import { Quat } from '../src/quat.js';
import { Vec3 } from '../src/vec3.js';

test('quaternion rotates vector around Z axis', () => {
  const axis = new Vec3(0, 0, 1);
  const q = Quat.fromAxisAngle(axis, Math.PI / 2);
  const v = new Vec3(1, 0, 0);
  const rotated = q.rotate(v);
  expect(rotated.x).toBeCloseTo(0);
  expect(rotated.y).toBeCloseTo(1);
  expect(rotated.z).toBeCloseTo(0);
});

