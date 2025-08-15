export class Vec3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  clone(){return new Vec3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  mul(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  div(s){this.x/=s;this.y/=s;this.z/=s;return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  cross(v){return new Vec3(this.y*v.z-this.z*v.y,this.z*v.x-this.x*v.z,this.x*v.y-this.y*v.x);}
  len(){return Math.hypot(this.x,this.y,this.z);}
  norm(){const l=this.len()||1;return this.div(l);}
  static add(a,b){return new Vec3(a.x+b.x,a.y+b.y,a.z+b.z);}
  static sub(a,b){return new Vec3(a.x-b.x,a.y-b.y,a.z-b.z);}
  static mul(a,s){return new Vec3(a.x*s,a.y*s,a.z*s);}
}
