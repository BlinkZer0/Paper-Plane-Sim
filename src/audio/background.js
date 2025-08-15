const PLAYLIST=[
  {title:'Kansai 90s',artist:'Shuriken Miasma',url:'https://example.com/kansai90s.mp3'},
  {title:'Sidewinder',artist:'Shuriken Miasma',url:'https://example.com/sidewinder.mp3'},
  {title:'Sunshowers',artist:'Shuriken Miasma',url:'https://example.com/sunshowers.mp3'}
];

let current=null;
let infoEl=null;

function setTrackInfo(text){
  if(!infoEl) infoEl=document.getElementById('track');
  if(infoEl) infoEl.textContent=text||'';
}

function playRandomTrack(){
  stopTrack();
  const track=PLAYLIST[Math.floor(Math.random()*PLAYLIST.length)];
  current=new Audio(track.url);
  current.loop=false;
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
