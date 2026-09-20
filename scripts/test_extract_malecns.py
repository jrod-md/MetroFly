"""Offline tests use synthetic IDs. They are NOT evidence of Janelia connectivity."""
import unittest
from types import SimpleNamespace
from extract_malecns import select_paths, edge_map, validate_export, extract


class Frame:
    def __init__(self, rows): self.rows = rows
    def to_dict(self, _): return self.rows


class FakeClient:
    def __init__(self, corrupt=False):
        self.edge_reads = 0
        self.corrupt = corrupt

    def fetch_custom(self, query):
        if 'allShortestPaths' in query:
            return Frame([{'ids': [1, 2, 3]}])
        if 'AS annotations' in query:
            return Frame([{'bodyId': body, 'annotations': {'type': f'fixture-{body}'}} for body in (1, 2, 3)])
        if 'r.weight AS weight' in query:
            self.edge_reads += 1
            weight = 99 if self.corrupt and self.edge_reads > 1 else 10
            return Frame([{'source': 1, 'target': 2, 'weight': weight}, {'source': 2, 'target': 3, 'weight': 7}])
        return Frame([{'bodyId': 1 if 'IN [1]' in query else 3, 'type': 'fixture'}])


class ExtractionTests(unittest.TestCase):
    def test_path_cap_preserves_whole_connected_paths(self):
        ids, edges, paths = select_paths([[1, 2, 3], [1, 4, 3], [10, 11], [1, 5, 6, 3]], 4)
        # Shortest disconnected component wins; no invented links to other paths.
        self.assertEqual(ids, [10, 11])
        ids, edges, paths = select_paths([[1, 2, 3], [1, 4, 3], [1, 5, 6, 3]], 4)
        self.assertEqual(ids, [1, 2, 3, 4])
        self.assertTrue(all(set(path).issubset(ids) for path in paths))
        self.assertEqual(edges, {(1, 2), (2, 3), (1, 4), (4, 3)})

    def test_raw_weights_are_never_rounded_or_aggregated(self):
        for weight in (0, -1, 2.5, None):
            with self.assertRaises((ValueError, TypeError)):
                edge_map([{'source': 1, 'target': 2, 'weight': weight}])
        with self.assertRaises(ValueError):
            edge_map([{'source': 1, 'target': 2, 'weight': 2}] * 2)

    def test_extraction_and_fresh_verification(self):
        args = SimpleNamespace(source_id=[1], target_id=[3], source_type=[], target_type=[], max_sources=12, max_targets=2, max_hops=8, min_weight=5, paths_per_pair=8, max_nodes=150, max_edges=1000)
        graph = extract(FakeClient(), args, ['type', 'bodyId'])
        validate_export(graph)
        self.assertEqual(graph['metadata']['nodeCount'], 3)
        self.assertEqual([edge['weight'] for edge in graph['edges']], [10, 7])
        self.assertIsNone(graph['nodes'][0]['instance'])
        self.assertIsNone(graph['nodes'][0]['side'])
        self.assertEqual(graph['nodes'][1]['category'], 'central')
        with self.assertRaises(ValueError):
            extract(FakeClient(corrupt=True), args, ['type', 'bodyId'])


if __name__ == '__main__':
    unittest.main()
