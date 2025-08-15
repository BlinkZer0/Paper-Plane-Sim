import { Vec3 } from './vec3.js';
import { RNG, DEG, lerp, TAU, clamp } from './utils.js';
import { buildHouse, buildOffice, buildMall, buildStadium, buildGoogleCity } from './levels.js';
import { makeWind, buildUpdrafts } from './wind.js';
import { Plane, BASE_PLANES, BASE_MATERIALS } from './plane.js';
import { Quat } from './quat.js';
import { playRandomTrack, stopTrack, setTrackInfo } from './audio/background.js';
import { audioReady, effects } from './audio/loader.js';

/**************** Camera & draw ****************/
let canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
const urlParams=new URLSearchParams(location.search);
const wireframeMode=urlParams.get('wireframe')==='1'||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
const compassCanvas=document.getElementById('compass');
const compassCtx=compassCanvas.getContext('2d');
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px'}addEventListener('resize',resize);resize();canvas.focus();function focusCanvas(){canvas.focus();}
const camera={pos:new Vec3(0,2,-6),target:new Vec3(0,1,0),up:new Vec3(0,1,0),fov:70*DEG,near:0.05};
function getViewBasis(pos,target,up){const z=Vec3.sub(target,pos).norm();const x=up.cross(z).norm();const y=z.cross(x).norm();return{x,y,z}}
function project(p){const rel=Vec3.sub(p,camera.pos);const basis=getViewBasis(camera.pos,camera.target,camera.up);const cx=rel.dot(basis.x),cy=rel.dot(basis.y),cz=rel.dot(basis.z);if(cz<camera.near)return null;const f=(canvas.height*0.5)/Math.tan(camera.fov*0.5);const sx=canvas.width*0.5+(cx*f/cz);const sy=canvas.height*0.5-(cy*f/cz);return{x:sx,y:sy,z:cz}}
function drawEdges(edges,color){ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,Math.min(2.5,canvas.height/900));ctx.beginPath();for(const[a,b]of edges){const pa=project(a),pb=project(b);if(!pa||!pb)continue;ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y)}ctx.stroke()}
function shadeColor(hex,shade){const num=parseInt(hex.slice(1),16);let r=Math.min(255,Math.floor(((num>>16)&255)*shade));let g=Math.min(255,Math.floor(((num>>8)&255)*shade));let b=Math.min(255,Math.floor((num&255)*shade));return`rgb(${r},${g},${b})`}
function drawFaces(faces,color){const light=new Vec3(0.3,0.8,0.6).norm();ctx.lineWidth=Math.max(1,Math.min(2.5,canvas.height/900));for(const face of faces){const[a,b,c]=face;const pa=project(a),pb=project(b),pc=project(c);if(!pa||!pb||!pc)continue;const n=Vec3.sub(b,a).cross(Vec3.sub(c,a)).norm();const shade=Math.max(0.2,n.dot(light));const fill=shadeColor(color,shade);ctx.fillStyle=fill;ctx.strokeStyle=fill;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.lineTo(pc.x,pc.y);ctx.closePath();ctx.fill();ctx.stroke()}}
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
let ui={
  level:document.getElementById("level"),
  plane:document.getElementById("plane"),
  material:document.getElementById("material"),
  materialIcon:document.getElementById("materialIcon"),
  levelDetail:document.getElementById("levelDetail"),
  seed:document.getElementById("seed"),
  regen:document.getElementById("regen"),
  throw:document.getElementById("throw"),
  throwVal:document.getElementById("throwVal"),
  windPreset:document.getElementById("windPreset"),
  assist:document.getElementById("assist"),
  ghost:document.getElementById("ghost"),
  launch:document.getElementById("launch"),
  pause:document.getElementById("pauseBtn"),
  fps:document.getElementById("fps"),
  spd:document.getElementById("spd"),
  aoa:document.getElementById("aoa"),
  alt:document.getElementById("alt"),
  wnd:document.getElementById("wind"),
  windDir:document.getElementById("windDir"),
  pts:document.getElementById("points"),
  session:document.getElementById("session"),
  padState:document.getElementById("padState"),
  control:document.getElementById("controlMode"),
  tiltReset:document.getElementById("tiltReset"),
  unlockInfo:document.getElementById("unlockInfo"),
  bestDist:document.getElementById("bestDist"),
  bestTime:document.getElementById("bestTime"),
  bestTargets:document.getElementById("bestTargets"),
  badgeList:document.getElementById("badgeList"),
  replay:document.getElementById("replayBtn"),
  showGhost:document.getElementById("showGhost"),
  share:document.getElementById("shareBtn"),
  saveVideo:document.getElementById("saveVideoBtn")
};
setTrackInfo('');
ui.throw.addEventListener('input',()=>ui.throwVal.textContent=(+ui.throw.value).toFixed(1)+' m/s');ui.throw.addEventListener('change',()=>focusCanvas());
const TUTORIAL_KEY='paperplane_tutorial_v1';
let tutorialActive=!localStorage.getItem(TUTORIAL_KEY);
let scene={edges:[],boxes:[],spawn:new Vec3(0,1.5,0),bounds:{min:new Vec3(-10,0,-10),max:new Vec3(10,5,10)}};
let updrafts=[];
let plane;
let windField;
let paused=tutorialActive,tGlobal=0;
let score=0, sessionTime=0;
const SAVEKEY='paperplane_unlocks_v2';
const STATSKEY='paperplane_stats_v1';
let unlocks = JSON.parse(localStorage.getItem(SAVEKEY)||'{}');
let stats = JSON.parse(localStorage.getItem(STATSKEY)||'{}');
let metrics={distance:0,time:0,targets:0};
let lastPos=null;
let targetsHitStep=0;
let announcedUnlocks={};
let flightLog=[],wasThrown=false;
let replayLog=[],replayParams=null,replayIndex=0,replaying=false,ghostPlane=null,ghostVisible=false,replayFinish=null;
let recorder=null,recordedChunks=[];

function isUnlocked(key){
  const req=BASE_PLANES[key].requires;
  if(!req) return true;
  const pts=unlocks.points||0;
  const dist=stats.bestDistance||0;
  const time=stats.bestTime||0;
  const targ=stats.bestTargets||0;
  if(typeof req==='number') return pts>=req;
  if(req.points && pts<req.points) return false;
  if(req.distance && dist<req.distance) return false;
  if(req.time && time<req.time) return false;
  if(req.targets && targ<req.targets) return false;
  return true;
}
function refreshPlaneList(){
  ui.plane.innerHTML='';
  for(const key of Object.keys(BASE_PLANES)){
    const p=BASE_PLANES[key];
    const opt=document.createElement('option');
    opt.value=key;
    let reqText='';
    if(p.requires){
      const parts=[];
      if(typeof p.requires==='number') parts.push(`${p.requires} pts`);
      else{
        if(p.requires.points) parts.push(`${p.requires.points} pts`);
        if(p.requires.distance) parts.push(`${p.requires.distance} m`);
        if(p.requires.time) parts.push(`${p.requires.time} s`);
        if(p.requires.targets) parts.push(`${p.requires.targets} targets`);
      }
      reqText=parts.join(', ');
    }
    opt.textContent=p.name+(p.requires?` — ${isUnlocked(key)?'Unlocked':`Locked (${reqText})`}`:'');
    if(p.requires && !isUnlocked(key)){
      opt.disabled=true;
      opt.className='locked';
    }
    ui.plane.appendChild(opt);
  }
  ui.unlockInfo.textContent=`Pts:${unlocks.points||0} Dist:${Math.floor(stats.bestDistance||0)} Time:${Math.floor(stats.bestTime||0)} Tgts:${stats.bestTargets||0}`;
}
function refreshMaterialList(){
  ui.material.innerHTML='';
  for(const key of Object.keys(BASE_MATERIALS)){
    const m=BASE_MATERIALS[key];
    const opt=document.createElement('option');
    opt.value=key;
    opt.textContent=m.name;
    ui.material.appendChild(opt);
  }
}

function updateAchievementsPanel(){
  ui.bestDist.textContent=Math.floor(stats.bestDistance||0);
  ui.bestTime.textContent=Math.floor(stats.bestTime||0);
  ui.bestTargets.textContent=stats.bestTargets||0;
  ui.badgeList.innerHTML='';
  (stats.badges||[]).forEach(b=>{
    const li=document.createElement('li');
    li.textContent=b;
    ui.badgeList.appendChild(li);
  });
}

const BADGES=[
  {name:'Long Haul',test:s=>s.bestDistance>=500},
  {name:'Marathon',test:s=>s.bestTime>=60},
  {name:'Sharpshooter',test:s=>s.bestTargets>=5}
];

function checkBadges(){
  stats.badges=stats.badges||[];
  let changed=false;
  for(const b of BADGES){
    if(!stats.badges.includes(b.name) && b.test(stats)){
      stats.badges.push(b.name);
      toast(`Badge unlocked: ${b.name}`);
      changed=true;
    }
  }
  if(changed){
    localStorage.setItem(STATSKEY,JSON.stringify(stats));
    updateAchievementsPanel();
  }
}
function makeParams(){const shape=BASE_PLANES[ui.plane.value]||BASE_PLANES.dart;const mat=BASE_MATERIALS[ui.material.value]||BASE_MATERIALS.printer;return{...shape,mass:shape.mass*mat.mass,wingArea:shape.wingArea*mat.wingArea,CD0:shape.CD0*mat.CD0,color:mat.color,texture:mat.texture}}
function updateMaterialIcon(){const m=BASE_MATERIALS[ui.material.value];if(m)ui.materialIcon.style.backgroundImage=`url(${m.texture})`}
function rebuild(){stopTrack();rng=new RNG(ui.seed.value||'seed');const L=ui.level.value;let s; if(L==='house')s=buildHouse(rng); if(L==='office')s=buildOffice(rng); if(L==='mall')s=buildMall(rng); if(L==='stadium')s=buildStadium(rng); if(L==='google')s=buildGoogleCity(rng); scene=s;windField=makeWind(L,rng.seed);updrafts=buildUpdrafts(L,rng,scene.bounds);plane=new Plane(makeParams());plane.reset(scene.spawn.clone(),new Vec3(0,0,1),+ui.throw.value);ui.levelDetail.textContent=`edges:${scene.edges.length} boxes:${scene.boxes.length} updrafts:${updrafts.length}`;sessionTime=0;updateMaterialIcon();audioReady.then(()=>setTimeout(()=>playRandomTrack(),300))}
main
refreshPlaneList();
refreshMaterialList();
checkBadges();
updateAchievementsPanel();
ui.plane.value='dart';
ui.material.value='printer';
updateMaterialIcon();
ghostVisible=ui.showGhost.checked;
ui.regen.addEventListener('click',()=>{rebuild();focusCanvas();});
ui.level.addEventListener('change',()=>{rebuild();focusCanvas();});
ui.plane.addEventListener('change',()=>{plane=new Plane(makeParams());updateMaterialIcon();focusCanvas();});
ui.material.addEventListener('change',()=>{plane=new Plane(makeParams());updateMaterialIcon();focusCanvas();});
ui.control.addEventListener('change',()=>focusCanvas());
ui.windPreset.addEventListener('change',()=>focusCanvas());
ui.assist.addEventListener('change',()=>focusCanvas());
ui.ghost.addEventListener('change',()=>focusCanvas());
ui.launch.addEventListener('click',()=>{if(!tutorialActive){throwPlane();focusCanvas();}});
ui.pause.addEventListener('click',()=>{if(!tutorialActive){togglePause();focusCanvas();}});
ui.replay.addEventListener('click',()=>{if(!tutorialActive){startReplay();focusCanvas();}});
ui.showGhost.addEventListener('change',()=>{ghostVisible=ui.showGhost.checked;focusCanvas();});
ui.share.addEventListener('click',()=>{shareFlight();});
ui.saveVideo.addEventListener('click',()=>{saveVideo();});

/**************** Input: Keyboard & Gamepad ****************/
const keys={}; addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(e.code==='Space'){e.preventDefault();if(!tutorialActive)throwPlane()} if(e.key.toLowerCase()==='p'){if(!tutorialActive)togglePause()}}); addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
let tilt={pitch:0,roll:0,yaw:0};
let tiltBase={beta:0,gamma:0,alpha:0};
let tiltLast={beta:0,gamma:0,alpha:0};
let tiltReady=false;
function resetTilt(){tiltBase={beta:tiltLast.beta,gamma:tiltLast.gamma,alpha:tiltLast.alpha};}
addEventListener('deviceorientation',e=>{tiltLast.beta=e.beta||0;tiltLast.gamma=e.gamma||0;tiltLast.alpha=e.alpha||0;if(!tiltReady&&ui.control.value==='tilt'){resetTilt();tiltReady=true;}tilt.pitch=clamp((tiltLast.beta-tiltBase.beta)/45,-1,1);tilt.roll=clamp((tiltLast.gamma-tiltBase.gamma)/45,-1,1);const dyaw=((tiltLast.alpha-tiltBase.alpha+540)%360)-180;tilt.yaw=clamp(dyaw/45,-1,1);});
ui.tiltReset.addEventListener('click',()=>{resetTilt();tiltReady=true;focusCanvas()});
ui.control.addEventListener('change',()=>{if(ui.control.value==='tilt'){ui.tiltReset.style.display='inline-block';tiltReady=false;}else{ui.tiltReset.style.display='none';}});
let gamepadIndex=null;window.addEventListener('gamepadconnected',e=>{gamepadIndex=e.gamepad.index;ui.padState.textContent='gamepad connected';});window.addEventListener('gamepaddisconnected',()=>{gamepadIndex=null;ui.padState.textContent='no gamepad'});
function readGamepad(){if(gamepadIndex==null)return null;const gp=navigator.getGamepads()[gamepadIndex];if(!gp)return null;const dz=0.18;const ax=(v)=>Math.abs(v)<dz?0:v;  const pitch=ax(gp.axes[1]||0); const roll=ax(gp.axes[0]||0); const yaw=ax(gp.axes[2]||gp.axes[3]||0); const A=gp.buttons[0]?.pressed; const Start=(gp.buttons[9]?.pressed)||false; return { pitch, roll, yaw, A, Start } }
function getInput(){const mode=ui.control.value;let fromPad=readGamepad(); if(mode==='gamepad' || (mode==='auto' && fromPad)){ if(!tutorialActive){ if(fromPad?.Start && !prevPadStart){togglePause()} if(fromPad?.A && !prevPadA){throwPlane()} } prevPadStart=!!fromPad?.Start; prevPadA=!!fromPad?.A; return { pitch: fromPad?fromPad.pitch:0, roll: fromPad?fromPad.roll:0, yaw: fromPad?fromPad.yaw:0 } }  if(mode==='tilt'){ return { pitch:tilt.pitch, roll:tilt.roll, yaw:tilt.yaw } }  return { pitch:(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0), roll:(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0), yaw:(keys['e']?1:0)-(keys['q']?1:0) } }
let prevPadStart=false, prevPadA=false;

/**************** Scoring & Unlocks ****************/
function addScore(dt){
  if(!plane.thrown) return;
  score+=dt;
  sessionTime+=dt;
  metrics.time+=dt;
  if(lastPos){
    metrics.distance+=Vec3.sub(plane.pos,lastPos).len();
  }
  lastPos=plane.pos.clone();
  if(targetsHitStep>0){
    metrics.targets+=targetsHitStep;
    targetsHitStep=0;
  }
  let statsDirty=false;
  if(metrics.distance>(stats.bestDistance||0)){stats.bestDistance=Math.floor(metrics.distance);statsDirty=true;}
  if(metrics.time>(stats.bestTime||0)){stats.bestTime=Math.floor(metrics.time);statsDirty=true;}
  if(metrics.targets>(stats.bestTargets||0)){stats.bestTargets=metrics.targets;statsDirty=true;}
  if(statsDirty){
    localStorage.setItem(STATSKEY,JSON.stringify(stats));
    updateAchievementsPanel();
    checkBadges();
  }
  saveTimer+=dt;
  if(saveTimer>5){
    unlocks.points=(unlocks.points||0)+Math.floor(scoreSavedDelta);
    localStorage.setItem(SAVEKEY,JSON.stringify(unlocks));
    scoreSavedDelta=0;
    saveTimer=0;
    refreshPlaneList();
    ui.unlockInfo.classList.add('green');
    setTimeout(()=>ui.unlockInfo.classList.remove('green'),600);
  }
  scoreSavedDelta+=dt;
  ui.pts.textContent=Math.floor((unlocks.points||0)+scoreSavedDelta);
  ui.session.textContent=Math.floor(sessionTime);
  for(const key of Object.keys(BASE_PLANES)){
    const p=BASE_PLANES[key];
    if(p.locked && !announcedUnlocks[key] && isUnlocked(key)){
      announcedUnlocks[key]=true;
      toast(`Unlocked: ${p.name}!`);
      refreshPlaneList();
    }
  }
}
let saveTimer=0, scoreSavedDelta=0;
function finalizeScore(){
  if(scoreSavedDelta>0){
    unlocks.points=(unlocks.points||0)+Math.floor(scoreSavedDelta);
    localStorage.setItem(SAVEKEY,JSON.stringify(unlocks));
    scoreSavedDelta=0;
    refreshPlaneList();
  }
  localStorage.setItem(STATSKEY,JSON.stringify(stats));
}

/**************** Gameplay helpers ****************/
function togglePause(){paused=!paused;ui.pause.textContent=paused?'Resume (P / Start)':'Pause (P / Start)';focusCanvas()}
function throwPlane(){
  plane.reset(scene.spawn.clone(),new Vec3(0,0,1),+ui.throw.value);
  metrics={distance:0,time:0,targets:0};
  lastPos=plane.pos.clone();
  targetsHitStep=0;
  flightLog=[];wasThrown=false;
  replaying=false;ghostPlane=null;
  audioReady.then(()=>{const s=effects.swoosh; if(s){s.currentTime=0; s.play();}});
  focusCanvas();
}
function collide(){ if(ui.ghost.checked) return false; if(plane.pos.y<scene.bounds.min.y-0.2) return true; for(const b of scene.boxes){ if(pointInBox(plane.pos,b)) return true } return false }
function pointInBox(p,box){return(p.x>=box.min.x&&p.x<=box.max.x&&p.y>=box.min.y&&p.y<=box.max.y&&p.z>=box.min.z&&p.z<=box.max.z)}
function applyUpdrafts(pos,t){
  let add=new Vec3(0,0,0);
  for(const u of updrafts){
    if(u.vanish && t<u.hideUntil) continue;
    const dx=pos.x-u.pos.x,dz=pos.z-u.pos.z;
    const r=u.r;
    if(dx*dx+dz*dz<r*r){
      u.vanish=true;
      u.hideUntil=t+4;
      add.y+=u.str;
      toast('Caught updraft +');
      targetsHitStep++;
    }
  }
  return add;
}

function nearestUpdraft(pos,t){let best=null,dist=Infinity;for(const u of updrafts){if(u.vanish && t<u.hideUntil) continue;const dx=u.pos.x-pos.x,dz=u.pos.z-pos.z;const d=Math.sqrt(dx*dx+dz*dz);if(d<dist){dist=d;best=Math.atan2(dx,dz);}}return best==null?0:best;}

/**************** Replay & Share ****************/
function startReplay(cb){
  let saved;
  if(replayLog.length){
    saved={log:replayLog,params:replayParams||plane.params};
  }else{
    saved=JSON.parse(localStorage.getItem('lastFlightLog')||'{}');
  }
  const log=saved.log||[];
  if(!log.length)return;
  ghostPlane=new Plane(saved.params||makeParams());
  ghostVisible=ui.showGhost.checked;
  replayLog=log;
  replayParams=saved.params||replayParams;
  replayIndex=0;
  replaying=true;
  replayFinish=cb||null;
}
function shareFlight(){
  const url=location.href;
  if(navigator.share){navigator.share({title:'Paper Plane Flight',text:'Check out my flight!',url});}
  else{const tweet=`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my paper plane flight! '+url)}`;window.open(tweet,'_blank');}
}
function startRecording(){
  const stream=canvas.captureStream(60);recorder=new MediaRecorder(stream,{mimeType:'video/webm'});recordedChunks=[];
  recorder.ondataavailable=e=>{if(e.data.size>0)recordedChunks.push(e.data);};
  recorder.onstop=()=>{const blob=new Blob(recordedChunks,{type:'video/webm'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='flight.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  recorder.start();
}
function saveVideo(){startRecording();startReplay(()=>{if(recorder)recorder.stop();});}

/**************** Toast ****************/
let toastDiv=null;function ensureToast(){if(!toastDiv){toastDiv=document.createElement('div');toastDiv.style.position='fixed';toastDiv.style.left='50%';toastDiv.style.top='14px';toastDiv.style.transform='translateX(-50%)';toastDiv.style.padding='8px 12px';toastDiv.style.background='#0b0f14cc';toastDiv.style.border='1px solid #1f2a3c';toastDiv.style.borderRadius='10px';toastDiv.style.pointerEvents='none';toastDiv.style.transition='opacity .2s';document.body.appendChild(toastDiv)}}
function toast(msg){ensureToast();toastDiv.textContent=msg;toastDiv.style.opacity='1';setTimeout(()=>toastDiv.style.opacity='0',1200)}

/**************** Tutorial ****************/
const tutorialModal=document.getElementById('tutorialModal');
const tutorialSteps=[...tutorialModal.querySelectorAll('.step')];
const highlightElems=[ui.plane,ui.throw,ui.pause];
tutorialSteps.forEach((step,i)=>{
  step.querySelector('.tut-next').addEventListener('click',()=>{
    highlightElems[i].classList.remove('highlight');
    const next=i+1;
    if(next>=tutorialSteps.length){
      tutorialModal.classList.add('hidden');
      tutorialActive=false;
      paused=false;
      localStorage.setItem(TUTORIAL_KEY,'1');
    }else{
      tutorialSteps[next].classList.remove('hidden');
      tutorialSteps[i].classList.add('hidden');
      highlightElems[next].classList.add('highlight');
    }
  });
});
function startTutorial(){
  tutorialModal.classList.remove('hidden');
  tutorialSteps.forEach((s,j)=>{if(j>0)s.classList.add('hidden');});
  tutorialSteps[0].classList.remove('hidden');
  highlightElems[0].classList.add('highlight');
}
if(tutorialActive) startTutorial();

/**************** Loop ****************/
let last=performance.now(),acc=0;rebuild();setTimeout(()=>throwPlane(),400);
 function frame(now){
  const dt=(now-last)/1000;last=now;
  if(!paused){
    acc+=dt;const step=1/120;
    while(acc>=step){
      tGlobal+=step;
      const inp=getInput();
      const wind=(pos)=>{const base=windField(pos,tGlobal,windOverride());const up=applyUpdrafts(pos,tGlobal);return Vec3.add(base,up)};
      plane.step(step,wind,inp,ui.assist.checked);
      if(collide())plane.thrown=false;
      if(plane.thrown){
        flightLog.push({pos:{x:plane.pos.x,y:plane.pos.y,z:plane.pos.z},q:{x:plane.q.x,y:plane.q.y,z:plane.q.z,w:plane.q.w}});
        wasThrown=true;
      }else if(wasThrown){
        const save={params:plane.params,log:flightLog};
        localStorage.setItem('lastFlightLog',JSON.stringify(save));
        replayLog=save.log.slice();
        replayParams=save.params;
        wasThrown=false;
      }
      const b=plane.basis();
      const follow=Vec3.add(plane.pos,Vec3.mul(b.forward,-3.5));
      follow.add(Vec3.mul(b.up,1.2));
      camera.pos=Vec3.add(Vec3.mul(camera.pos,0.9),Vec3.mul(follow,0.1));
      camera.target=Vec3.add(Vec3.mul(camera.target,0.85),Vec3.mul(plane.pos,0.15));
      addScore(step);acc-=step;
    }
  }
  if(replaying&&ghostPlane){
    if(replayIndex<replayLog.length){
      const e=replayLog[replayIndex++];
      ghostPlane.pos.set(e.pos.x,e.pos.y,e.pos.z);
      ghostPlane.q=new Quat(e.q.x,e.q.y,e.q.z,e.q.w);
    }else{
      replaying=false;
      if(replayFinish){const cb=replayFinish;replayFinish=null;cb();}
    }
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawEdges(scene.edges,'#3fb7ff');
  drawUpdrafts(updrafts,now);
  if(wireframeMode)drawEdges(plane.worldEdges(),plane.params.color||'#86efac');
  else drawFaces(plane.worldFaces(),plane.params.color||'#86efac');
  if(ghostVisible&&ghostPlane){
    if(wireframeMode)drawEdges(ghostPlane.worldEdges(),'rgba(255,255,255,0.5)');
    else drawFaces(ghostPlane.worldFaces(),'rgba(255,255,255,0.5)');
  }
  const windVec=plane._windVec||new Vec3(0,0,0);
  const wDir=Math.atan2(windVec.x,windVec.z);
  const upDir=nearestUpdraft(plane.pos,tGlobal);
  drawCompass(wDir,upDir);
  ui.spd.textContent=(plane._speed||0).toFixed(1);
  ui.aoa.textContent=((plane._alpha||0)/DEG).toFixed(1);
  ui.alt.textContent=(plane.pos.y).toFixed(1);
  ui.wnd.textContent=(plane._wind||0).toFixed(1);
  ui.windDir.textContent=((wDir*180/Math.PI+360)%360).toFixed(0);
  fpsCounter.tick(now);
  requestAnimationFrame(frame);
 }
function windOverride(){const p=ui.windPreset.value;let o=null;if(p==='calm')o={speed:0.05,gust:0.05,vertical:0.0,swirl:0.05};if(p==='indoor')o={speed:0.25,gust:0.2,vertical:0.05,swirl:0.15};if(p==='drafty')o={speed:0.6,gust:0.5,vertical:0.2,swirl:0.25};if(p==='gusty')o={speed:1.6,gust:1.8,vertical:0.15,swirl:0.7};if(p==='outdoor')o={speed:1.1,gust:1.2,vertical:0.05,swirl:0.5};return o}
const fpsCounter={buf:new Array(20).fill(0),i:0,tick(t){this.buf[this.i++%this.buf.length]=t;const a=this.buf[(this.i-1+this.buf.length)%this.buf.length];const b=this.buf[this.i%this.buf.length];if(b!==0){const dt=(a-b)/this.buf.length;const fps=(dt>0)?1000/dt:0;document.getElementById('fps').textContent=fps.toFixed(0)}}};
requestAnimationFrame(frame);
window.addEventListener('beforeunload',finalizeScore);
