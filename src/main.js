import { Vec3 } from './vec3.js';
import { RNG, DEG, lerp, TAU } from './utils.js';
import { buildHouse, buildOffice, buildMall, buildStadium, buildGoogleCity } from './levels.js';
import { makeWind, buildUpdrafts } from './wind.js';
import { Plane, BASE_PLANES, BASE_MATERIALS } from './plane.js';
import { playRandomTrack, stopTrack, setTrackInfo } from './audio/background.js';

/**************** Camera & draw ****************/
let canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
const compassCanvas=document.getElementById('compass');
const compassCtx=compassCanvas.getContext('2d');
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px'}addEventListener('resize',resize);resize();canvas.focus();function focusCanvas(){canvas.focus();}
const camera={pos:new Vec3(0,2,-6),target:new Vec3(0,1,0),up:new Vec3(0,1,0),fov:70*DEG,near:0.05};
function getViewBasis(pos,target,up){const z=Vec3.sub(target,pos).norm();const x=up.cross(z).norm();const y=z.cross(x).norm();return{x,y,z}}
function project(p){const rel=Vec3.sub(p,camera.pos);const basis=getViewBasis(camera.pos,camera.target,camera.up);const cx=rel.dot(basis.x),cy=rel.dot(basis.y),cz=rel.dot(basis.z);if(cz<camera.near)return null;const f=(canvas.height*0.5)/Math.tan(camera.fov*0.5);const sx=canvas.width*0.5+(cx*f/cz);const sy=canvas.height*0.5-(cy*f/cz);return{x:sx,y:sy,z:cz}}
function drawEdges(edges,color){ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,Math.min(2.5,canvas.height/900));ctx.beginPath();for(const[a,b]of edges){const pa=project(a),pb=project(b);if(!pa||!pb)continue;ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y)}ctx.stroke()}
function drawUpdrafts(list, now){ctx.save();for(const u of list){if(u.vanish && now<u.hideUntil) continue;  const base=project(new Vec3(u.pos.x,0,u.pos.z));const top=project(new Vec3(u.pos.x,u.h,u.pos.z));if(!base||!top)continue;const segs=10;for(let i=0;i<segs;i++){const t=i/segs;const y=lerp(base.y,top.y,t);const amp=6*Math.sin((now*0.002)+(t*8));const x=base.x+amp;ctx.strokeStyle='rgba(103,232,249,0.6)';ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y+16);ctx.stroke()} }ctx.restore()}

function drawCompass(wDir, upDir){
  const ctx=compassCtx; ctx.clearRect(0,0,80,80); ctx.save(); ctx.translate(40,40);
  ctx.strokeStyle='#3a4c6a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,35,0,TAU); ctx.stroke();
  ctx.fillStyle='#94a3b8'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.fillText('N',0,-24);
  ctx.save(); ctx.rotate(wDir); ctx.strokeStyle='#67e8f9'; ctx.fillStyle='#67e8f9'; ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(0,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(-4,-22); ctx.lineTo(4,-22); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.rotate(upDir); ctx.fillStyle='#86efac'; ctx.beginPath(); ctx.arc(0,-34,4,0,TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}

/**************** World state ****************/
let rng=new RNG('blink-zero');
let ui={ level:document.getElementById('level'), plane:document.getElementById('plane'), material:document.getElementById('material'), materialIcon:document.getElementById('materialIcon'), levelDetail:document.getElementById('levelDetail'), seed:document.getElementById('seed'), regen:document.getElementById('regen'), throw:document.getElementById('throw'), throwVal:document.getElementById('throwVal'), windPreset:document.getElementById('windPreset'), assist:document.getElementById('assist'), ghost:document.getElementById('ghost'), launch:document.getElementById('launch'), pause:document.getElementById('pauseBtn'), fps:document.getElementById('fps'), spd:document.getElementById('spd'), aoa:document.getElementById('aoa'), alt:document.getElementById('alt'), wnd:document.getElementById('wind'), windDir:document.getElementById('windDir'), pts:document.getElementById('points'), session:document.getElementById('session'), padState:document.getElementById('padState'), control:document.getElementById('controlMode'), unlockInfo:document.getElementById('unlockInfo') };
setTrackInfo('');
ui.throw.addEventListener('input',()=>ui.throwVal.textContent=(+ui.throw.value).toFixed(1)+' m/s');ui.throw.addEventListener('change',()=>focusCanvas());
let scene={edges:[],boxes:[],spawn:new Vec3(0,1.5,0),bounds:{min:new Vec3(-10,0,-10),max:new Vec3(10,5,10)}};let updrafts=[];let plane;let windField;let paused=false,tGlobal=0;let score=0, sessionTime=0;const SAVEKEY='paperplane_unlocks_v2';
let unlocks = JSON.parse(localStorage.getItem(SAVEKEY)||'{}');
function isUnlocked(key){const req=BASE_PLANES[key].requires;return !req || (unlocks.points||0)>=req}
function refreshPlaneList(){ui.plane.innerHTML='';for(const key of Object.keys(BASE_PLANES)){const p=BASE_PLANES[key];const opt=document.createElement('option');opt.value=key;opt.textContent=p.name+(p.requires?` — ${isUnlocked(key)?'Unlocked':`Locked (${p.requires} pts)`}`:'');if(p.requires && !isUnlocked(key)){opt.disabled=true;opt.className='locked'}ui.plane.appendChild(opt)}ui.unlockInfo.textContent=`Total pts: ${unlocks.points||0}`}
function refreshMaterialList(){ui.material.innerHTML='';for(const key of Object.keys(BASE_MATERIALS)){const m=BASE_MATERIALS[key];const opt=document.createElement('option');opt.value=key;opt.textContent=m.name;ui.material.appendChild(opt)}}
function makeParams(){const shape=BASE_PLANES[ui.plane.value]||BASE_PLANES.dart;const mat=BASE_MATERIALS[ui.material.value]||BASE_MATERIALS.printer;return{...shape,mass:shape.mass*mat.mass,wingArea:shape.wingArea*mat.wingArea,CD0:shape.CD0*mat.CD0,color:mat.color,texture:mat.texture}}
function updateMaterialIcon(){const m=BASE_MATERIALS[ui.material.value];if(m)ui.materialIcon.style.backgroundImage=`url(${m.texture})`}
codex/implement-ground-effect-lift-scaling
function rebuild(){rng=new RNG(ui.seed.value||'seed');const L=ui.level.value;let s; if(L==='house')s=buildHouse(rng); if(L==='office')s=buildOffice(rng); if(L==='mall')s=buildMall(rng); if(L==='stadium')s=buildStadium(rng); if(L==='google')s=buildGoogleCity(rng); scene=s;windField=makeWind(L,rng.seed);updrafts=buildUpdrafts(L,rng,scene.bounds,scene.vents);plane=new Plane(makeParams());plane.reset(scene.spawn.clone(),new Vec3(0,0,1),+ui.throw.value);ui.levelDetail.textContent=`edges:${scene.edges.length} boxes:${scene.boxes.length} updrafts:${updrafts.length}`;sessionTime=0;updateMaterialIcon()}

function rebuild(){stopTrack();rng=new RNG(ui.seed.value||'seed');const L=ui.level.value;let s; if(L==='house')s=buildHouse(rng); if(L==='office')s=buildOffice(rng); if(L==='mall')s=buildMall(rng); if(L==='stadium')s=buildStadium(rng); if(L==='google')s=buildGoogleCity(rng); scene=s;windField=makeWind(L,rng.seed);updrafts=buildUpdrafts(L,rng,scene.bounds);plane=new Plane(makeParams());plane.reset(scene.spawn.clone(),new Vec3(0,0,1),+ui.throw.value);ui.levelDetail.textContent=`edges:${scene.edges.length} boxes:${scene.boxes.length} updrafts:${updrafts.length}`;sessionTime=0;updateMaterialIcon();setTimeout(()=>playRandomTrack(),300)}
main
refreshPlaneList();refreshMaterialList();ui.plane.value='dart';ui.material.value='printer';updateMaterialIcon();
ui.regen.addEventListener('click',()=>{rebuild();focusCanvas();});ui.level.addEventListener('change',()=>{rebuild();focusCanvas();});ui.plane.addEventListener('change',()=>{plane=new Plane(makeParams());updateMaterialIcon();focusCanvas();});ui.material.addEventListener('change',()=>{plane=new Plane(makeParams());updateMaterialIcon();focusCanvas();});ui.control.addEventListener('change',()=>focusCanvas());ui.windPreset.addEventListener('change',()=>focusCanvas());ui.assist.addEventListener('change',()=>focusCanvas());ui.ghost.addEventListener('change',()=>focusCanvas());ui.launch.addEventListener('click',()=>{throwPlane();focusCanvas();});ui.pause.addEventListener('click',()=>{togglePause();focusCanvas();});

/**************** Input: Keyboard & Gamepad ****************/
const keys={}; addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(e.code==='Space'){e.preventDefault();throwPlane()} if(e.key.toLowerCase()==='p'){togglePause()}}); addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
let gamepadIndex=null;window.addEventListener('gamepadconnected',e=>{gamepadIndex=e.gamepad.index;ui.padState.textContent='gamepad connected';});window.addEventListener('gamepaddisconnected',()=>{gamepadIndex=null;ui.padState.textContent='no gamepad'});
function readGamepad(){if(gamepadIndex==null)return null;const gp=navigator.getGamepads()[gamepadIndex];if(!gp)return null;const dz=0.18;const ax=(v)=>Math.abs(v)<dz?0:v;  const pitch=ax(gp.axes[1]||0); const roll=ax(gp.axes[0]||0); const yaw=ax(gp.axes[2]||gp.axes[3]||0); const A=gp.buttons[0]?.pressed; const Start=(gp.buttons[9]?.pressed)||false; return { pitch, roll, yaw, A, Start } }
function getInput(){const mode=ui.control.value;let fromPad=readGamepad(); if(mode==='gamepad' || (mode==='auto' && fromPad)){ if(fromPad?.Start && !prevPadStart){togglePause()} if(fromPad?.A && !prevPadA){throwPlane()} prevPadStart=!!fromPad?.Start; prevPadA=!!fromPad?.A; return { pitch: fromPad?fromPad.pitch:0, roll: fromPad?fromPad.roll:0, yaw: fromPad?fromPad.yaw:0 } }  return { pitch:(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0), roll:(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0), yaw:(keys['e']?1:0)-(keys['q']?1:0) } }
let prevPadStart=false, prevPadA=false;

/**************** Scoring & Unlocks ****************/
function addScore(dt){if(!plane.thrown)return; score+=dt; sessionTime+=dt; const total=(unlocks.points||0)+dt;  let changed=false; if(!isUnlocked('snub') && total>=BASE_PLANES.snub.requires){unlocks.points=(unlocks.points||0); changed=true; toast(`Unlocked: Snub Nose!`)} if(!isUnlocked('fighter') && total>=BASE_PLANES.fighter.requires){changed=true; toast(`Unlocked: Fighter Jet!`)}  saveTimer+=dt; if(saveTimer>5){unlocks.points=(unlocks.points||0)+Math.floor(scoreSavedDelta); localStorage.setItem(SAVEKEY,JSON.stringify(unlocks)); scoreSavedDelta=0; saveTimer=0; refreshPlaneList(); ui.unlockInfo.classList.add('green'); setTimeout(()=>ui.unlockInfo.classList.remove('green'),600)} scoreSavedDelta+=dt; ui.pts.textContent=Math.floor((unlocks.points||0)+scoreSavedDelta); ui.session.textContent=Math.floor(sessionTime);}
let saveTimer=0, scoreSavedDelta=0; function finalizeScore(){ if(scoreSavedDelta>0){unlocks.points=(unlocks.points||0)+Math.floor(scoreSavedDelta); localStorage.setItem(SAVEKEY,JSON.stringify(unlocks)); scoreSavedDelta=0; refreshPlaneList(); }}

/**************** Gameplay helpers ****************/
function togglePause(){paused=!paused;ui.pause.textContent=paused?'Resume (P / Start)':'Pause (P / Start)';focusCanvas()}
function throwPlane(){plane.reset(scene.spawn.clone(),new Vec3(0,0,1),+ui.throw.value);focusCanvas()}
function collide(){ if(ui.ghost.checked) return false; if(plane.pos.y<scene.bounds.min.y-0.2) return true; for(const b of scene.boxes){ if(pointInBox(plane.pos,b)) return true } return false }
function pointInBox(p,box){return(p.x>=box.min.x&&p.x<=box.max.x&&p.y>=box.min.y&&p.y<=box.max.y&&p.z>=box.min.z&&p.z<=box.max.z)}
function applyUpdrafts(pos,t){let add=new Vec3(0,0,0);for(const u of updrafts){if(u.vanish && t<u.hideUntil) continue;const dx=pos.x-u.pos.x,dz=pos.z-u.pos.z;const r=u.r; if(dx*dx+dz*dz<r*r){u.vanish=true;u.hideUntil=t+4; add.y+=u.str;      toast('Caught updraft +');}}  return add}

function nearestUpdraft(pos,t){let best=null,dist=Infinity;for(const u of updrafts){if(u.vanish && t<u.hideUntil) continue;const dx=u.pos.x-pos.x,dz=u.pos.z-pos.z;const d=Math.sqrt(dx*dx+dz*dz);if(d<dist){dist=d;best=Math.atan2(dx,dz);}}return best==null?0:best;}

/**************** Toast ****************/
let toastDiv=null;function ensureToast(){if(!toastDiv){toastDiv=document.createElement('div');toastDiv.style.position='fixed';toastDiv.style.left='50%';toastDiv.style.top='14px';toastDiv.style.transform='translateX(-50%)';toastDiv.style.padding='8px 12px';toastDiv.style.background='#0b0f14cc';toastDiv.style.border='1px solid #1f2a3c';toastDiv.style.borderRadius='10px';toastDiv.style.pointerEvents='none';toastDiv.style.transition='opacity .2s';document.body.appendChild(toastDiv)}}
function toast(msg){ensureToast();toastDiv.textContent=msg;toastDiv.style.opacity='1';setTimeout(()=>toastDiv.style.opacity='0',1200)}

/**************** Loop ****************/
let last=performance.now(),acc=0;rebuild();setTimeout(()=>throwPlane(),400);
 function frame(now){const dt=(now-last)/1000;last=now;if(!paused){acc+=dt;const step=1/120;while(acc>=step){tGlobal+=step;const inp=getInput();     const wind=(pos)=>{const base=windField(pos,tGlobal,windOverride());const up=applyUpdrafts(pos,tGlobal);return Vec3.add(base,up)};plane.step(step,wind,inp,ui.assist.checked);if(collide())plane.thrown=false;     const b=plane.basis();const follow=Vec3.add(plane.pos,Vec3.mul(b.forward,-3.5));follow.add(Vec3.mul(b.up,1.2));camera.pos=Vec3.add(Vec3.mul(camera.pos,0.9),Vec3.mul(follow,0.1));camera.target=Vec3.add(Vec3.mul(camera.target,0.85),Vec3.mul(plane.pos,0.15));addScore(step);acc-=step}}  ctx.clearRect(0,0,canvas.width,canvas.height);drawEdges(scene.edges,'#3fb7ff');drawUpdrafts(updrafts,now);drawEdges(plane.worldEdges(),plane.params.color||'#86efac');const windVec=plane._windVec||new Vec3(0,0,0);const wDir=Math.atan2(windVec.x,windVec.z);const upDir=nearestUpdraft(plane.pos,tGlobal);drawCompass(wDir,upDir);ui.spd.textContent=(plane._speed||0).toFixed(1);ui.aoa.textContent=((plane._alpha||0)/DEG).toFixed(1);ui.alt.textContent=(plane.pos.y).toFixed(1);ui.wnd.textContent=(plane._wind||0).toFixed(1);ui.windDir.textContent=((wDir*180/Math.PI+360)%360).toFixed(0);fpsCounter.tick(now);requestAnimationFrame(frame)}
function windOverride(){const p=ui.windPreset.value;let o=null;if(p==='calm')o={speed:0.05,gust:0.05,vertical:0.0,swirl:0.05};if(p==='indoor')o={speed:0.25,gust:0.2,vertical:0.05,swirl:0.15};if(p==='drafty')o={speed:0.6,gust:0.5,vertical:0.2,swirl:0.25};if(p==='gusty')o={speed:1.6,gust:1.8,vertical:0.15,swirl:0.7};if(p==='outdoor')o={speed:1.1,gust:1.2,vertical:0.05,swirl:0.5};return o}
const fpsCounter={buf:new Array(20).fill(0),i:0,tick(t){this.buf[this.i++%this.buf.length]=t;const a=this.buf[(this.i-1+this.buf.length)%this.buf.length];const b=this.buf[this.i%this.buf.length];if(b!==0){const dt=(a-b)/this.buf.length;const fps=(dt>0)?1000/dt:0;document.getElementById('fps').textContent=fps.toFixed(0)}}};
requestAnimationFrame(frame);
window.addEventListener('beforeunload',finalizeScore);
