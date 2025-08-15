export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * t * (t * (t * 6 - 15) + 10);

export function mulberry32(a){
  return function(){
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function hash32(x){
  x |= 0;
  x = (x ^ 61) ^ (x >>> 16);
  x = (x + (x << 3)) | 0;
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return x >>> 0;
}

export function seededInt(x, y, z, seed){
  let h = hash32(x * 73856093 ^ y * 19349663 ^ z * 83492791 ^ seed);
  return h;
}

export function valNoise3(x, y, z, seed){
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  function v(ix, iy, iz){
    return (seededInt(ix, iy, iz, seed) & 0xffff) / 65535 * 2 - 1;
  }
  const u = smooth(xf), v1 = smooth(yf), w = smooth(zf);
  let c000 = v(xi, yi, zi), c100 = v(xi + 1, yi, zi), c010 = v(xi, yi + 1, zi), c110 = v(xi + 1, yi + 1, zi);
  let c001 = v(xi, yi, zi + 1), c101 = v(xi + 1, yi, zi + 1), c011 = v(xi, yi + 1, zi + 1), c111 = v(xi + 1, yi + 1, zi + 1);
  const x00 = lerp(c000, c100, u), x10 = lerp(c010, c110, u), x01 = lerp(c001, c101, u), x11 = lerp(c011, c111, u);
  const y0 = lerp(x00, x10, v1), y1 = lerp(x01, x11, v1);
  return lerp(y0, y1, w);
}

export class RNG{
  constructor(seedStr){
    let s = 0;
    for(let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
    this._r = mulberry32(s | 0x9e3779b9);
    this.seed = s;
  }
  next(){ return this._r(); }
  range(a, b){ return a + (b - a) * this.next(); }
  int(a, b){ return Math.floor(this.range(a, b + 1)); }
  pick(arr){ return arr[this.int(0, arr.length - 1)]; }
}
