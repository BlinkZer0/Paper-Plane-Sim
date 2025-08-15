import { Vec3 } from './vec3.js';
import { Quat } from './quat.js';
import { DEG, clamp } from './utils.js';

export const BASE_PLANES={
  dart:{ name:'Dart', mass:0.008, wingArea:0.015, CD0:0.05, k:0.06, stall:16*DEG, CLalpha:5.2, control:0.015, damping:0.35, I:0.00003 },
  glider:{ name:'Glider', mass:0.006, wingArea:0.028, CD0:0.04, k:0.05, stall:18*DEG, CLalpha:5.5, control:0.010, damping:0.28, I:0.00004 },
  stunt:{ name:'Stunt', mass:0.007, wingArea:0.020, CD0:0.06, k:0.07, stall:20*DEG, CLalpha:5.4, control:0.020, damping:0.33, I:0.000028 },
  heavy:{ name:'Heavy', mass:0.010, wingArea:0.019, CD0:0.055,k:0.065,stall:15*DEG, CLalpha:5.0, control:0.012, damping:0.40, I:0.00005 },
  snub:{ name:'Snub Nose', mass:0.0075, wingArea:0.018, CD0:0.052, k:0.062, stall:17*DEG, CLalpha:5.3, control:0.018, damping:0.33, I:0.000032, locked:true, requires:120 },
  fighter:{ name:'Fighter Jet', mass:0.0065, wingArea:0.017, CD0:0.048, k:0.058, stall:22*DEG, CLalpha:5.8, control:0.028, damping:0.30, I:0.000027, locked:true, requires:600 }
};

export const BASE_MATERIALS={
  construction:{ name:'Construction', mass:1.3, wingArea:1.05, CD0:1.1, color:'#f87171', texture:'assets/paper/construction.svg' },
  notebook:{ name:'Notebook', mass:0.9, wingArea:1.0, CD0:0.98, color:'#f8fafc', texture:'assets/paper/notebook.svg' },
  printer:{ name:'Printer', mass:1.0, wingArea:1.0, CD0:1.0, color:'#ffffff', texture:'assets/paper/printer.svg' },
  wax:{ name:'Wax', mass:1.1, wingArea:1.02, CD0:0.95, color:'#e0f2fe', texture:'assets/paper/wax.svg' },
  balsa:{ name:'Balsa', mass:2.0, wingArea:1.1, CD0:1.2, color:'#f5deb3', texture:'assets/paper/balsa.svg' }
};

export class Plane{
  constructor(params){
    this.params=params;
    this.pos=new Vec3(0,1.5,0);
    this.vel=new Vec3(0,0,0);
    this.angVel=new Vec3(0,0,0);
    this.q=new Quat();
    this.thrown=false;
    this.lines=this.makeWire(params);
  }
  basis(){
    return{right:this.q.rotate(new Vec3(1,0,0)),up:this.q.rotate(new Vec3(0,1,0)),forward:this.q.rotate(new Vec3(0,0,1))};
  }
  makeWire(p){
    const e=[];
    const span=0.14,len=0.22,tail=0.06;
    const noseZ=p.name==='Snub Nose'?len*0.35:len/2;
    const wingTip=span/2;
    const pts={
      nose:new Vec3(0,0,noseZ),
      tail:new Vec3(0,0,-len/2),
      left:new Vec3(-wingTip,0,0),
      right:new Vec3(wingTip,0,0),
      tailL:new Vec3(-tail/2,0,-len/2),
      tailR:new Vec3(tail/2,0,-len/2),
      finT:new Vec3(0,0.05,-len/2+0.025)
    };
    const seg=(a,b)=>e.push([a,b]);
    seg(pts.nose,pts.left);seg(pts.nose,pts.right);
    seg(pts.left,pts.tail);seg(pts.right,pts.tail);
    seg(pts.tailL,pts.finT);seg(pts.finT,pts.tailR);seg(pts.tailL,pts.tailR);
    if(p.name==='Fighter Jet'){
      const c=0.06;
      seg(new Vec3(-c,0,0.05),new Vec3(-c,0,0.12));
      seg(new Vec3(c,0,0.05),new Vec3(c,0,0.12));
      seg(new Vec3(-0.04,0,-0.15),new Vec3(0.04,0,-0.15));
    }
    return e;
  }
  worldEdges(){
    const b=this.basis();
    const out=[];const T=this.pos;
    const rotate=p=>new Vec3(b.right.x*p.x+b.up.x*p.y+b.forward.x*p.z,b.right.y*p.x+b.up.y*p.y+b.forward.y*p.z,b.right.z*p.x+b.up.z*p.y+b.forward.z*p.z);
    for(const[a,bp]of this.lines){const pa=Vec3.add(rotate(a),T),pb=Vec3.add(rotate(bp),T);out.push([pa,pb]);}
    return out;
  }
  reset(pos,dir,speed){
    this.pos=pos.clone();
    this.vel=Vec3.mul(dir.norm(),speed);
    const z=dir.norm();
    const up=new Vec3(0,1,0);
    const x=up.cross(z).norm();
    const y=z.cross(x).norm();
    const m00=x.x,m01=y.x,m02=z.x;
    const m10=x.y,m11=y.y,m12=z.y;
    const m20=x.z,m21=y.z,m22=z.z;
    const trace=m00+m11+m22;let q;
    if(trace>0){const s=Math.sqrt(trace+1.0)*2;q=new Quat((m21-m12)/s,(m02-m20)/s,(m10-m01)/s,0.25*s);} 
    else if((m00>m11)&&(m00>m22)){const s=Math.sqrt(1.0+m00-m11-m22)*2;q=new Quat(0.25*s,(m01+m10)/s,(m02+m20)/s,(m21-m12)/s);} 
    else if(m11>m22){const s=Math.sqrt(1.0+m11-m00-m22)*2;q=new Quat((m01+m10)/s,0.25*s,(m12+m21)/s,(m02-m20)/s);} 
    else{const s=Math.sqrt(1.0+m22-m00-m11)*2;q=new Quat((m02+m20)/s,(m12+m21)/s,0.25*s,(m10-m01)/s);} 
    this.q=q.norm();
    this.angVel.set(0,0,0);
    this.thrown=true;
  }
  step(dt,windFn,input,assist){
    const P=this.params;
    const g=new Vec3(0,-9.81,0);
    const b=this.basis();
    const wind=windFn(this.pos);
    const vAir=Vec3.sub(this.vel,wind);
    const speed=vAir.len();
    const rho=1.225;
    const qdyn=0.5*rho*speed*speed;
    const flowDir=vAir.len()>1e-6?Vec3.mul(vAir,-1/speed):new Vec3(0,0,1);
    const cosT=clamp(b.forward.dot(flowDir),-1,1);
    let alpha=Math.acos(cosT);
    const sign=Math.sign(b.up.dot(flowDir)-b.up.dot(b.forward));
    alpha*=(sign>=0?1:-1);
    const ctrlPitch=input.pitch*6*DEG;
    alpha+=ctrlPitch*0.25;
    const stall=P.stall;
    const absA=Math.abs(alpha);
    let CL=P.CLalpha*alpha;
    if(absA>stall){const over=absA-stall;CL=P.CLalpha*stall*Math.sign(alpha)*(1/(1+over*12));}
    const CD=P.CD0+P.k*CL*CL;
    const liftMag=qdyn*P.wingArea*CL;
    const dragMag=qdyn*P.wingArea*CD;
    const liftDir=vAir.len()>1e-6?Vec3.mul(b.right.cross(vAir).cross(vAir).norm(),1):new Vec3(0,1,0);
    const dragDir=vAir.len()>1e-6?Vec3.mul(vAir,-1/speed):new Vec3(0,0,-1);
    let F=new Vec3(0,0,0);
    F=Vec3.add(F,Vec3.mul(liftDir,liftMag));
    F=Vec3.add(F,Vec3.mul(dragDir,dragMag));
    F=Vec3.add(F,Vec3.mul(g,P.mass));
    const acc=Vec3.mul(F,1/P.mass);
    this.vel.add(Vec3.mul(acc,dt));
    this.pos.add(Vec3.mul(this.vel,dt));
    const I=P.I;
    let Tlocal=new Vec3(input.roll*P.control,input.yaw*P.control*0.8,input.pitch*P.control*1.2);
    if(assist){
      const dampToLevel=0.5;
      Tlocal.x += (-b.up.z)*dampToLevel;
      Tlocal.y += (-b.right.y)*0.2;
      Tlocal.z += (-alpha)*0.1;
    }
    const Tworld=new Vec3(
      b.right.x*Tlocal.x+b.up.x*Tlocal.y+b.forward.x*Tlocal.z,
      b.right.y*Tlocal.x+b.up.y*Tlocal.y+b.forward.y*Tlocal.z,
      b.right.z*Tlocal.x+b.up.z*Tlocal.y+b.forward.z*Tlocal.z);
    const damp=Vec3.mul(this.angVel,-P.damping);
    const T=Vec3.add(Tworld,damp);
    const angAcc=Vec3.mul(T,1/I);
    this.angVel.add(Vec3.mul(angAcc,dt));
    const wlen=this.angVel.len();
    if(wlen>1e-6){
      const dq=Quat.fromAxisAngle(this.angVel.clone().div(wlen),wlen*dt);
      this.q=this.q.mul(dq).norm();
    }
    this._alpha=alpha;
    this._speed=speed;
    this._wind=wind.len();
    this._windVec = wind.clone();
  }
}
