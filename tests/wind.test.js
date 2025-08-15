import { Vec3 } from '../src/vec3.js';
import { makeWind, buildUpdrafts } from '../src/wind.js';
import { RNG } from '../src/utils.js';

test('wind field deterministic output', () => {
  const wind = makeWind('house', 12345);
  const v = wind(new Vec3(0, 0, 0), 0);
  expect(v.x).toBeCloseTo(-0.1906510079);
  expect(v.y).toBeCloseTo(-0.0023318667);
  expect(v.z).toBeCloseTo(0.2276571916);
});

test('buildUpdrafts creates expected count', () => {
  const bounds = { min: new Vec3(-5, 0, -5), max: new Vec3(5, 10, 5) };
  const list = buildUpdrafts('house', new RNG('seed'), bounds);
  expect(list).toHaveLength(6);
});

