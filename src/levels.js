import { Vec3 } from './vec3.js';
import { TAU, lerp } from './utils.js';

function addBox(edges,min,max){
  const p=[new Vec3(min.x,min.y,min.z),new Vec3(max.x,min.y,min.z),new Vec3(max.x,max.y,min.z),new Vec3(min.x,max.y,min.z),new Vec3(min.x,min.y,max.z),new Vec3(max.x,min.y,max.z),new Vec3(max.x,max.y,max.z),new Vec3(min.x,max.y,max.z)];
  const e=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  for(const [a,b] of e) edges.push([p[a],p[b]]);
}

function addRectFrame(edges,c,w,h,z){
  const x=w/2,y=h/2;
  const pts=[new Vec3(c.x-x,c.y-y,z),new Vec3(c.x+x,c.y-y,z),new Vec3(c.x+x,c.y+y,z),new Vec3(c.x-x,c.y+y,z)];
  const e=[[0,1],[1,2],[2,3],[3,0],[0,2],[1,3]];
  for(const [a,b] of e) edges.push([pts[a],pts[b]]);
}

function addRing(edges,center,r,z,segments=64){
  let prev=null;
  for(let i=0;i<=segments;i++){
    const t=i/segments*TAU;
    const p=new Vec3(center.x+Math.cos(t)*r,center.y+Math.sin(t)*r,z);
    if(prev) edges.push([prev,p]);
    prev=p;
  }
}

export function buildHouse(rng){
  const edges=[],boxes=[];
  const rooms=rng.int(3,5);
  const roomW=8,roomH=3,roomD=8;
  const cols=rng.int(2,3);
  const rows=Math.ceil(rooms/cols);
  let x0=-cols*roomW*0.55,z0=-rows*roomD*0.55;let i=0;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(i++>=rooms) break;
      const cx=x0+c*roomW*1.1,cz=z0+r*roomD*1.1;
      addBox(edges,new Vec3(cx-roomW/2,0,cz-roomD/2),new Vec3(cx+roomW/2,roomH,cz+roomD/2));
      boxes.push({min:new Vec3(cx-roomW/2,0,cz-roomD/2),max:new Vec3(cx+roomW/2,roomH,cz+roomD/2)});
      addRectFrame(edges,new Vec3(cx,1.0,cz-roomD/2),1.2,2.1,0);
      const tx=cx+rng.range(-2,2),tz=cz+rng.range(-2,2);
      addBox(edges,new Vec3(tx-0.6,0.7,tz-0.4),new Vec3(tx+0.6,0.78,tz+0.4));
      for(const dx of[-0.55,0.55])
        for(const dz of[-0.35,0.35])
          addBox(edges,new Vec3(tx+dx-0.05,0,tz+dz-0.05),new Vec3(tx+dx+0.05,0.7,tz+dz+0.05));
      const cxh=tx+1.0,czh=tz;
      addBox(edges,new Vec3(cxh-0.25,0,czh-0.25),new Vec3(cxh+0.25,0.45,czh+0.25));
      addRectFrame(edges,new Vec3(cxh,0.9,czh-0.25),0.5,0.9,0);
    }
  }
  for(let x=-10;x<=10;x+=2) for(let z=-10;z<=10;z+=2) edges.push([new Vec3(x,3,z),new Vec3(x+2,3,z)]);
  for(let x=-10;x<=10;x+=2) for(let z=-10;z<=10;z+=2) edges.push([new Vec3(x,3,z),new Vec3(x,3,z+2)]);
  return {edges,boxes,spawn:new Vec3(0,1.5,-rows*roomD*0.6),bounds:{min:new Vec3(-12,0,-12),max:new Vec3(12,4,12)}};
}

export function buildOffice(rng){
  const edges=[],boxes=[];
  const w=40,d=30,h=3.2;
  addBox(edges,new Vec3(-w/2,0,-d/2),new Vec3(w/2,h,d/2));
  boxes.push({min:new Vec3(-w/2,0,-d/2),max:new Vec3(w/2,h,d/2)});
  const cw=3.0,cd=3.0;
  for(let x=-w/2+2;x<w/2-2;x+=cw+1){
    for(let z=-d/2+2;z<d/2-2;z+=cd+1){
      addBox(edges,new Vec3(x,0.0,z),new Vec3(x+cw,1.5,z+cd));
      addBox(edges,new Vec3(x+0.4,0.7,z+0.4),new Vec3(x+cw-0.4,0.78,z+cd-0.4));
      addRectFrame(edges,new Vec3(x+cw*0.5,1.1,z+cd*0.5),0.7,0.45,0);
    }
  }
  for(let x=-w/2+5;x<=w/2-5;x+=10){
    for(let z=-d/2+5;z<=d/2-5;z+=10){
      addBox(edges,new Vec3(x-0.4,0,z-0.4),new Vec3(x+0.4,h,z+0.4));
    }
  }
  return {edges,boxes,spawn:new Vec3(-w/2+2,1.6,-d/2+2),bounds:{min:new Vec3(-w/2,0,-d/2),max:new Vec3(w/2,h+0.5,d/2)}};
}

export function buildMall(rng){
  const edges=[],boxes=[];
  const w=50,d=30,floors=3;
  const floorH=4.0;
  addBox(edges,new Vec3(-w/2,0,-d/2),new Vec3(w/2,floors*floorH,d/2));
  boxes.push({min:new Vec3(-w/2,0,-d/2),max:new Vec3(w/2,floors*floorH,d/2)});
  const aw=w*0.5,ad=d*0.4;
  addRectFrame(edges,new Vec3(0,0,0),aw,ad,0);
  for(let f=1;f<=floors;f++){
    const y=f*floorH-1.2;
    addRectFrame(edges,new Vec3(0,y,0),aw,ad,0);
    addRectFrame(edges,new Vec3(0,y,0),aw*0.2,2.0,0);
    addRectFrame(edges,new Vec3(0,y,0),2.0,ad*0.2,0);
  }
  for(let s=-1;s<=1;s+=2){
    let x=s*(aw/2-3);
    for(let f=0;f<floors-1;f++){
      const y0=f*floorH+0.2,y1=(f+1)*floorH-0.2;
      addBox(edges,new Vec3(x-0.5,y0,-5),new Vec3(x+0.5,y1,-3));
      addBox(edges,new Vec3(x-0.5,y0,3),new Vec3(x+0.5,y1,5));
    }
  }
  return {edges,boxes,spawn:new Vec3(-aw/2+2,2.0,-ad/2+2),bounds:{min:new Vec3(-w/2,0,-d/2),max:new Vec3(w/2,floors*floorH+1,d/2)}};
}

export function buildStadium(rng){
  const edges=[],boxes=[];
  const R=45,inner=20,height=18;
  const rings=18;
  for(let i=0;i<rings;i++){
    const t=i/(rings-1);
    const r=lerp(inner,R,t);
    const y=lerp(1,height,t*t);
    addRing(edges,new Vec3(0,y,0),r,0,96);
  }
  addRectFrame(edges,new Vec3(0,0.5,0),inner*1.2,inner*0.8,0);
  for(let k=0;k<4;k++){
    const a=k*TAU/4;
    const x=Math.cos(a)*(R+3),z=Math.sin(a)*(R+3);
    addBox(edges,new Vec3(x-0.6,0,z-0.6),new Vec3(x+0.6,12,z+0.6));
    addRectFrame(edges,new Vec3(x,13,z),6,2,0);
  }
  boxes.push({min:new Vec3(-inner*0.6,0,-inner*0.4),max:new Vec3(inner*0.6,1.0,inner*0.4)});
  return {edges,boxes,spawn:new Vec3(-inner*0.5,3.0,-inner*0.3),bounds:{min:new Vec3(-R-5,0,-R-5),max:new Vec3(R+5,height+2,R+5)}};
}

export function buildGoogleCity(rng){
  const edges=[],boxes=[];
  const size=120;
  const block=rng.range(16,22);
  const streets=1.8;
  for(let x=-size;x<=size;x+=block){
    for(let z=-size;z<=size;z+=block){
      addBox(edges,new Vec3(x-streets/2,0,z-(block+streets)/2),new Vec3(x+streets/2,0.1,z+(block+streets)/2));
      addBox(edges,new Vec3((x-(block+streets)/2),0,z-streets/2),new Vec3((x+(block+streets)/2),0.1,z+streets/2));
    }
  }
  const dens=0.5;
  for(let x=-size+block/2;x<size;x+=block){
    for(let z=-size+block/2;z<size;z+=block){
      if(rng.next()<dens){
        const bx=x+rng.range(-block*0.3,block*0.3),bz=z+rng.range(-block*0.3,block*0.3);
        const bw=rng.range(block*0.25,block*0.45),bd=rng.range(block*0.25,block*0.45),bh=rng.range(8,55);
        addBox(edges,new Vec3(bx-bw/2,0.1,bz-bd/2),new Vec3(bx+bw/2,bh,bz+bd/2));
        boxes.push({min:new Vec3(bx-bw/2,0.1,bz-bd/2),max:new Vec3(bx+bw/2,bh,bz+bd/2)});
      }
    }
  }
  addRectFrame(edges,new Vec3(0,0,0),block*2.4,block*2.0,0);
  return {edges,boxes,spawn:new Vec3(-block,30.48,-block),bounds:{min:new Vec3(-size,0,-size),max:new Vec3(size,60,size)}};
}
