import { Vec3 } from './vec3.js';
import { TAU, valNoise3 } from './utils.js';

export function makeWind(level,rngSeed){
  const seed = rngSeed >>> 0;
  let p={speed:0.3,gust:0.0,vertical:0.0,swirl:0.0};
  if(level==='house') p={speed:0.2,gust:0.2,vertical:0.05,swirl:0.1};
  if(level==='office') p={speed:0.5,gust:0.4,vertical:0.1,swirl:0.2};
  if(level==='mall') p={speed:0.8,gust:0.6,vertical:0.35,swirl:0.3};
  if(level==='stadium') p={speed:1.5,gust:1.2,vertical:0.1,swirl:0.8};
  if(level==='google') p={speed:1.2,gust:1.5,vertical:0.05,swirl:0.5};
  const dir0 = (()=>{const a=(seed%1000)/1000*TAU;return new Vec3(Math.cos(a),0,Math.sin(a));})();
  return function windAt(pos,t,override){
    const o=override||{};
    const mix={...p,...o};
    const f=0.12,ft=0.07;
    const nx=valNoise3(pos.x*f,pos.y*f,pos.z*f+t*ft,seed+17);
    const ny=valNoise3(pos.x*f+130,pos.y*f,pos.z*f+t*ft,seed+29);
    const nz=valNoise3(pos.x*f,pos.y*f+270,pos.z*f+t*ft,seed+71);
    let v=Vec3.mul(dir0,mix.speed);
    const swirl=new Vec3(nx,ny*mix.vertical,nz).norm().mul(mix.swirl);
    v=Vec3.add(v,swirl);
    const gust=Math.max(0,valNoise3(t*0.15,77,33,seed+999));
    v=Vec3.add(v,new Vec3(nx,ny,nz).mul(gust*mix.gust));
    return v;
  };
}

export function buildUpdrafts(level, rng, bounds){
  const list=[];
  const add=(x,z,r,str,h)=>list.push({pos:new Vec3(x,0,z),r,str,h,vanish:false,hideUntil:0});
  const W=bounds.max.x-bounds.min.x, D=bounds.max.z-bounds.min.z;
  if(level==='house'||level==='office'){
    for(let i=0;i<6;i++) add(rng.range(bounds.min.x+2,bounds.max.x-2),rng.range(bounds.min.z+2,bounds.max.z-2),rng.range(0.6,1.1),rng.range(0.6,1.2),bounds.max.y);
  }
  if(level==='mall'){
    add(0,0,1.6,1.8,bounds.max.y);
    for(let i=0;i<4;i++) add(rng.range(-10,10),rng.range(-6,6),1.0,1.2,bounds.max.y);
  }
  if(level==='stadium'){
    add(0,0,4.0,1.6,bounds.max.y);
    for(let i=0;i<6;i++){const ang=i*TAU/6;add(Math.cos(ang)*10,Math.sin(ang)*6,1.2,1.0,bounds.max.y);}
  }
  if(level==='google'){
    add(0,0,3.0,2.2,bounds.max.y);
    for(let i=0;i<12;i++) add(rng.range(bounds.min.x+5,bounds.max.x-5),rng.range(bounds.min.z+5,bounds.max.z-5),rng.range(1.0,2.0),rng.range(1.0,2.4),bounds.max.y);
  }
  return list;
}
