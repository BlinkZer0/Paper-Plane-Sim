import { tracks } from './loader.js';

const PLAYLIST = tracks;

let current=null;
let infoEl=null;

function setTrackInfo(text){
  if(!infoEl) infoEl=document.getElementById('track');
  if(infoEl) infoEl.textContent=text||'';
}

function playRandomTrack(){
  stopTrack();
  const track = PLAYLIST[Math.floor(Math.random()*PLAYLIST.length)];
  current = track.el;
  current.currentTime = 0;
  current.loop = false;
  current.play();
  setTrackInfo(`${track.title} — ${track.artist}`);
}

function stopTrack(){
  if(current){current.pause();current.currentTime=0;}
  current=null;
  setTrackInfo('');
}

export{playRandomTrack,stopTrack,setTrackInfo};
export const playlist=PLAYLIST;
