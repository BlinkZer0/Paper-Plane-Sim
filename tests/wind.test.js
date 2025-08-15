import { Vec3 } from '../src/vec3.js';
import { makeWind, buildUpdrafts } from '../src/wind.js';
import { RNG } from '../src/utils.js';

test('wind field deterministic output', () => {
  const wind = makeWind('house', 12345);
  const v = wind(new Vec3(0, 0, 0), 0);
  expect(v.x).toBeCloseTo(-0.1647884917);
  expect(v.y).toBeCloseTo(-0.0804778956);
  expect(v.z).toBeCloseTo(0.2951768376);
});

test('buildUpdrafts creates expected count', () => {
  const bounds = { min: new Vec3(-5, 0, -5), max: new Vec3(5, 10, 5) };
  const list = buildUpdrafts('house', new RNG('seed'), bounds);
  expect(list).toHaveLength(6);
});

test('vents create matching updrafts', () => {
  const bounds = { min: new Vec3(-5, 0, -5), max: new Vec3(5, 10, 5) };
  const vents = [new Vec3(1, 0, 1), new Vec3(-2, 0, -1)];
  const list = buildUpdrafts('house', new RNG('seed'), bounds, vents);
  expect(list).toHaveLength(vents.length);
  expect(list[0].pos.x).toBeCloseTo(vents[0].x);
  expect(list[1].pos.z).toBeCloseTo(vents[1].z);
});

