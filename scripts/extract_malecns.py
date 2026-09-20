"""Small, verified neuPrint extract. No token ever enters output or exception logs."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from datetime import datetime, timezone

DATASET = 'male-cns:v1.0'
SERVER = 'https://neuprint.janelia.org'
OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/generated/malecns_visual_motor.json'
ANNOTATIONS = ('type', 'instance', 'side', 'class', 'subclass', 'superclass', 'hemilineage', 'status', 'statusLabel')


def records(client, query):
    return client.fetch_custom(query).to_dict('records')


def select_paths(paths, max_nodes):
    """Keep complete paths only, growing one weakly connected component."""
    remaining = sorted({tuple(path) for path in paths}, key=lambda path: (len(path), path))
    selected, nodes, backbone = [], set(), set()
    while remaining:
        eligible = [path for path in remaining if (not nodes or nodes.intersection(path)) and len(nodes.union(path)) <= max_nodes]
        if not eligible:
            break
        path = eligible[0]
        remaining.remove(path)
        selected.append(path)
        nodes.update(path)
        backbone.update(zip(path, path[1:]))
    return sorted(nodes), backbone, selected


def edge_map(rows):
    result = {}
    for row in rows:
        key = (int(row['source']), int(row['target']))
        weight = row['weight']
        if key in result or weight is None or int(weight) != weight or weight <= 0:
            raise ValueError('Duplicate pair or invalid raw weight')
        result[key] = int(weight)
    return result


def validate_export(graph):
    ids = {node['bodyId'] for node in graph['nodes']}
    if len(ids) != len(graph['nodes']) or not 2 <= len(ids) <= 200:
        raise ValueError('Invalid node count')
    if not 1 <= len(graph['edges']) <= 1500:
        raise ValueError('Invalid edge count')
    if any(not isinstance(body, int) or not 0 < body <= 2**53 - 1 for body in ids):
        raise ValueError('Body ID cannot be represented safely by JavaScript')
    pairs = set()
    for edge in graph['edges']:
        pair = (int(edge['source']), int(edge['target']))
        if pair in pairs or not set(pair).issubset(ids) or not isinstance(edge['weight'], int) or edge['weight'] <= 0:
            raise ValueError('Invalid edge')
        pairs.add(pair)


def extract(client, args, keys):
    def resolve(body_ids, types):
        predicates = []
        if body_ids:
            predicates.append(f'n.bodyId IN {json.dumps(body_ids)}')
        if types:
            if 'type' not in keys:
                raise ValueError('No type property; inspect schema and use verified body IDs')
            predicates.append(f'n.type IN {json.dumps(types)}')
        rows = records(client, 'MATCH (n:Neuron) WHERE ' + ' OR '.join(predicates) + ' RETURN n.bodyId AS bodyId, n.type AS type ORDER BY type, bodyId')
        found = {int(row['bodyId']) for row in rows}
        if not rows or not set(body_ids).issubset(found) or not set(types).issubset({row['type'] for row in rows}):
            raise ValueError('An exact endpoint label or body ID was not found')
        # Round-robin across exact types, avoiding a single abundant photoreceptor type.
        groups = {}
        for row in rows:
            groups.setdefault(row['type'], []).append(int(row['bodyId']))
        ordered = []
        while any(groups.values()):
            for group in groups.values():
                if group:
                    ordered.append(group.pop(0))
        return ordered

    source_candidates = resolve(args.source_id, args.source_type)
    target_candidates = resolve(args.target_id, args.target_type)
    sources = source_candidates[:args.max_sources]
    targets = target_candidates[:args.max_targets]
    if set(sources).intersection(targets):
        raise ValueError('Visual and descending endpoint sets must be disjoint')
    queries, paths = [], []
    for target in targets:
        for source in sources:
            query = (f'MATCH (s:Neuron {{bodyId: {source}}}), (t:Neuron {{bodyId: {target}}}) '
                     f'MATCH p=allShortestPaths((s)-[:ConnectsTo*1..{args.max_hops}]->(t)) '
                     f'WHERE all(r IN relationships(p) WHERE r.weight >= {args.min_weight}) '
                     'AND all(n IN nodes(p) WHERE n:Neuron) '
                     f'RETURN [n IN nodes(p) | n.bodyId] AS ids LIMIT {args.paths_per_pair}')
            queries.append(query)
            paths.extend(row['ids'] for row in records(client, query))
    ids, backbone, selected = select_paths(paths, args.max_nodes)
    if not selected:
        raise ValueError('No connecting paths within the limits; no JSON was written')

    available = [key for key in ANNOTATIONS if key in keys]
    projection = ', '.join(f'{key}: n.`{key}`' for key in available)
    node_query = f'MATCH (n:Neuron) WHERE n.bodyId IN {json.dumps(ids)} RETURN n.bodyId AS bodyId, {{{projection}}} AS annotations ORDER BY bodyId'
    edge_query = (f'MATCH (a:Neuron)-[r:ConnectsTo]->(b:Neuron) WHERE a.bodyId IN {json.dumps(ids)} '
                  f'AND b.bodyId IN {json.dumps(ids)} AND r.weight >= {args.min_weight} '
                  'RETURN a.bodyId AS source, b.bodyId AS target, r.weight AS weight ORDER BY source, target')
    node_rows = records(client, node_query)
    raw_edges = edge_map(records(client, edge_query))
    if {int(row['bodyId']) for row in node_rows} != set(ids) or not backbone.issubset(raw_edges):
        raise ValueError('A path neuron or backbone edge could not be verified')
    retained = dict((pair, raw_edges[pair]) for pair in sorted(backbone))
    for pair, weight in sorted(raw_edges.items(), key=lambda item: (-item[1], item[0])):
        if len(retained) >= args.max_edges:
            break
        retained[pair] = weight
    if len(retained) > args.max_edges:
        raise ValueError('Edge cap is smaller than the required path backbone')

    # Fresh server reads verify each identity, annotation and exported pair/weight.
    verified_nodes = records(client, node_query)
    verified_edges = edge_map(records(client, edge_query))
    if node_rows != verified_nodes or any(verified_edges.get(pair) != weight for pair, weight in retained.items()):
        raise ValueError('Verification disagrees with extraction; refusing export')
    nodes = []
    for row in node_rows:
        body = int(row['bodyId'])
        annotations = row['annotations']
        node = {key: annotations.get(key) for key in ('type', 'instance', 'side')}
        if any(value is not None and not isinstance(value, str) for value in node.values()):
            raise ValueError('Unexpected annotation type; inspect schema before adapting')
        node.update(id=str(body), bodyId=body, annotations=annotations,
                    category='visual' if body in sources else 'descending' if body in targets else 'central', categoryBasis='path-role')
        nodes.append(node)
    edges = [dict(source=str(source), target=str(target), weight=weight) for (source, target), weight in sorted(retained.items())]
    graph = {'metadata': {
        'dataset': DATASET, 'source': 'HHMI Janelia FlyEM', 'license': 'CC-BY-4.0',
        'sourceUrl': 'https://male-cns.janelia.org/download/',
        'extractedAt': datetime.now(timezone.utc).isoformat(), 'realConnectivity': True,
        'description': 'Bounded directed paths between explicitly selected visual and descending endpoints. Roles assigned by MetroFly.',
        'nodeCount': len(nodes), 'edgeCount': len(edges),
        'verification': {'bodyIds': True, 'edges': True, 'weights': True},
        'methodology': {'schemaKeys': sorted(keys), 'annotationFields': available,
            'sourceTypes': args.source_type, 'targetTypes': args.target_type,
            'sourceIds': sources, 'targetIds': targets,
            'sourceCandidateCount': len(source_candidates), 'targetCandidateCount': len(target_candidates),
            'maxHops': args.max_hops, 'minWeight': args.min_weight, 'pathsPerPair': args.paths_per_pair,
            'maxNodes': args.max_nodes, 'maxEdges': args.max_edges, 'selectedPaths': selected,
            'pathQueries': queries, 'nodeQuery': node_query, 'edgeQuery': edge_query,
            'candidatePathCount': len(paths), 'inducedEdgeCount': len(raw_edges),
            'selection': 'Complete intersecting paths, then strongest induced edges; backbone preserved. Equal-length paths limited by server order.',
            'verification': 'Fresh queries for every retained identity, annotation, directed pair and exact raw weight.',
            'contentSha256': hashlib.sha256(json.dumps({'nodes': nodes, 'edges': edges}, sort_keys=True).encode()).hexdigest()}
    }, 'nodes': nodes, 'edges': edges}
    validate_export(graph)
    return graph


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inspect', action='store_true', help='Read live schema and candidate annotations, without exporting')
    parser.add_argument('--source-id', action='append', type=int, default=[])
    parser.add_argument('--target-id', action='append', type=int, default=[])
    parser.add_argument('--source-type', action='append', default=[])
    parser.add_argument('--target-type', action='append', default=[])
    parser.add_argument('--max-sources', type=int, default=12)
    parser.add_argument('--max-targets', type=int, default=2)
    parser.add_argument('--max-hops', type=int, default=8)
    parser.add_argument('--paths-per-pair', type=int, default=8)
    parser.add_argument('--min-weight', type=int, default=5)
    parser.add_argument('--max-nodes', type=int, default=150)
    parser.add_argument('--max-edges', type=int, default=1000)
    parser.add_argument('--overwrite', action='store_true', help='Explicitly allow replacing a previously verified extract')
    args = parser.parse_args()
    token = os.environ.get('NEUPRINT_TOKEN', '').strip()
    if not token:
        print('NEUPRINT_TOKEN is missing. Nothing exported; MetroFly keeps DEMO GRAPH.', file=sys.stderr)
        return 2
    bounds = ((args.max_sources, 1, 24), (args.max_targets, 1, 4), (args.max_hops, 1, 10), (args.paths_per_pair, 1, 16), (args.min_weight, 1, 10000), (args.max_nodes, 2, 200), (args.max_edges, 1, 1500))
    if any(not low <= value <= high for value, low, high in bounds) or args.max_sources * args.max_targets > 48:
        parser.error('Limits exceeded: <=200 nodes, <=1500 edges, <=48 endpoint pairs, <=10 hops')
    if not args.inspect and (not (args.source_id or args.source_type) or not (args.target_id or args.target_type)):
        parser.error('Run --inspect first, then explicitly choose verified source and target labels or body IDs')
    if not args.inspect and OUTPUT.exists() and not args.overwrite:
        parser.error('Output already exists; review it before using --overwrite')
    try:
        from neuprint import Client
    except ImportError:
        print('Install scripts/requirements-malecns.txt in a local Python environment.', file=sys.stderr)
        return 2
    try:
        client = Client(SERVER, dataset=DATASET, token=token)
        if DATASET not in client.fetch_datasets():
            raise ValueError('Dataset not accessible')
        keys = client.fetch_neuron_keys()
        if args.inspect:
            searchable = [key for key in ('type', 'instance') if key in keys]
            condition = ' OR '.join(f"n.`{key}` =~ '(?i).*(R[1-6]|DNg13).*'" for key in searchable)
            candidates = records(client, 'MATCH (n:Neuron) WHERE ' + condition + ' RETURN n.type AS type, n.instance AS instance, count(n) AS count ORDER BY type, instance LIMIT 300') if condition else []
            print(json.dumps({'dataset': DATASET, 'schemaKeys': keys, 'candidateAnnotations': candidates, 'note': 'Search hints only, not confirmed pathway membership. Review labels in neuPrint before choosing endpoints.'}, indent=2))
            return 0
        graph = extract(client, args, keys)
        serialized = json.dumps(graph, indent=2, ensure_ascii=False, allow_nan=False)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        staging = OUTPUT.with_suffix('.json.tmp')
        staging.write_text(serialized + '\n', encoding='utf-8')
        staging.replace(OUTPUT)
        print(f"Verified export: {len(graph['nodes'])} neurons, {len(graph['edges'])} directed connections. {OUTPUT}")
        if len(graph['nodes']) < 50:
            print('Small connected extract (<50 nodes); inspect the selection before widening verified endpoints.')
        return 0
    except Exception as error:
        # HTTP exceptions can contain request headers. Never print raw errors or tracebacks.
        print(f'Extraction failed ({type(error).__name__}). No replacement exported. Check credentials, schema, endpoint selection and limits.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
