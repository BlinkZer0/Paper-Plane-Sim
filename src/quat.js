import { Vec3 } from './vec3.js';

export class Quat{
  constructor(x=0,y=0,z=0,w=1){this.x=x;this.y=y;this.z=z;this.w=w;}
  static fromAxisAngle(axis,angle){const s=Math.sin(angle/2);return new Quat(axis.x*s,axis.y*s,axis.z*s,Math.cos(angle/2));}
  mul(q){const ax=this.x,ay=this.y,az=this.z,aw=this.w;const bx=q.x,by=q.y,bz=q.z,bw=q.w;return new Quat(aw*bx+ax*bw+ay*bz-az*by,aw*by-ay*bw+az*bx-ax*bz,aw*bz+az*bw+ax*by-ay*bx,aw*bw-ax*bx-ay*by-az*bz);}
  rotate(v){const qv=new Quat(v.x,v.y,v.z,0);const qi=new Quat(-this.x,-this.y,-this.z,this.w);const rq=this.mul(qv).mul(qi);return new Vec3(rq.x,rq.y,rq.z);}
  norm(){const l=Math.hypot(this.x,this.y,this.z,this.w)||1;this.x/=l;this.y/=l;this.z/=l;this.w/=l;return this;}
}
