"""Synthetic topology tests only; no token and no live dataset required."""
import math
import unittest
from extract_malecns_skeletons import global_normalization, parse_swc_rows, simplify_skeleton


def rows():
    return [
        {'rowId': 1, 'x': 0, 'y': 0, 'z': 0, 'radius': 2, 'link': -1},
        {'rowId': 2, 'x': 10, 'y': 0, 'z': 0, 'radius': 2, 'link': 1},
        {'rowId': 3, 'x': 20, 'y': 3, 'z': 0, 'radius': 2, 'link': 2},
        {'rowId': 4, 'x': 30, 'y': 0, 'z': 0, 'radius': 2, 'link': 3},
        {'rowId': 5, 'x': 20, 'y': 15, 'z': 0, 'radius': 2, 'link': 3},
        {'rowId': 6, 'x': 20, 'y': 30, 'z': 0, 'radius': 2, 'link': 5},
    ]


class SkeletonTests(unittest.TestCase):
    def test_parser_rejects_bad_topology_and_nonfinite_coordinates(self):
        with self.assertRaises(ValueError): parse_swc_rows(rows() + [{'rowId': 7, 'x': math.nan, 'y': 0, 'z': 0, 'link': 1}])
        bad = rows(); bad[-1]['link'] = 999
        with self.assertRaises(ValueError): parse_swc_rows(bad)

    def test_simplification_is_deterministic_and_preserves_roots_leaves_branches(self):
        source = parse_swc_rows(rows())
        first = simplify_skeleton(source, tolerance=100, max_segment_length=1000)
        second = simplify_skeleton(source, tolerance=100, max_segment_length=1000)
        self.assertEqual(first, second)
        ids = {point['id'] for point in first}
        self.assertTrue({1, 3, 4, 6}.issubset(ids))
        self.assertTrue(all(point['parent'] == -1 or point['parent'] in ids for point in first))

    def test_global_transform_is_shared_and_finite(self):
        neurons = [{'points': parse_swc_rows(rows())}, {'points': [{'id': 10, 'x': 100, 'y': -5, 'z': 4, 'parent': -1}]}]
        transform = global_normalization(neurons)
        self.assertEqual(transform['sourceBounds']['min'], [0.0, -5.0, 0.0])
        self.assertEqual(transform['sourceBounds']['max'], [100.0, 30.0, 4.0])
        self.assertTrue(math.isfinite(transform['scale']) and transform['scale'] > 0)


if __name__ == '__main__':
    unittest.main()
