import { Vec3 } from '../src/vec3.js';

test('vector addition', () => {
  const result = new Vec3(1, 2, 3).add(new Vec3(4, 5, 6));
  expect(result).toEqual({ x: 5, y: 7, z: 9 });
});

test('cross product', () => {
  const a = new Vec3(1, 0, 0);
  const b = new Vec3(0, 1, 0);
  const c = a.cross(b);
  expect(c.x).toBeCloseTo(0);
  expect(c.y).toBeCloseTo(0);
  expect(c.z).toBeCloseTo(1);
});

test('normalization', () => {
  const v = new Vec3(3, 4, 0).norm();
  expect(v.x).toBeCloseTo(0.6);
  expect(v.y).toBeCloseTo(0.8);
  expect(v.z).toBeCloseTo(0);
});

