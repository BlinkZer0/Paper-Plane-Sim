import { RNG } from '../src/utils.js';

test('deterministic sequence', () => {
  const rng1 = new RNG('seed');
  const rng2 = new RNG('seed');
  expect(rng1.next()).toBeCloseTo(rng2.next());
  expect(rng1.next()).toBeCloseTo(rng2.next());
});

test('range within bounds', () => {
  const rng = new RNG('bounds');
  for (let i = 0; i < 5; i++) {
    const v = rng.range(5, 10);
    expect(v).toBeGreaterThanOrEqual(5);
    expect(v).toBeLessThanOrEqual(10);
  }
});

