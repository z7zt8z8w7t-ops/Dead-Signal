'use strict';
const $=s=>document.querySelector(s), canvas=$('#game'), ctx=canvas.getContext('2d'), TILE=64, MAG=17, OFFICER_SCALE=1.3, PLAYER_RADIUS=18*OFFICER_SCALE;
const art={},artErrors=[];let walking=0,walkPhase=0;
// Recorded sample mixer. AudioContext is unlocked synchronously by Start.
const soundNames=['pistol-v12','reload','rain','door-open','door-close','switch','power','holster','step-l1','step-l2','step-l3','step-r1','step-r2','step-r3',...['carpet','wet','metal'].flatMap(t=>['l','r'].flatMap(side=>[1,2,3].map(i=>'step-'+t+'-'+side+i)))];
const sound={context:null,master:null,buffers:{},loading:null,muted:false,rain:null,rainGain:null,rainFilter:null,voices:new Set(),lastStep:0,reverbs:{},limiter:null};
function unlockSound(){
 const AudioCtx=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioCtx)return;
 if(!sound.context){sound.context=new AudioCtx();sound.master=sound.context.createGain();sound.master.gain.value=.7;sound.limiter=sound.context.createDynamicsCompressor();sound.limiter.threshold.value=-3;sound.limiter.knee.value=2;sound.limiter.ratio.value=12;sound.limiter.attack.value=.003;sound.limiter.release.value=.12;sound.master.connect(sound.limiter);sound.limiter.connect(sound.context.destination);buildReverbs()}
 sound.context.resume().catch(()=>{});
 if(!sound.loading)sound.loading=Promise.all(soundNames.map(async name=>{try{const r=await fetch('assets/'+name+'.wav');if(!r.ok)throw Error(name);sound.buffers[name]=await sound.context.decodeAudioData(await r.arrayBuffer())}catch(e){console.warn('Audio unavailable:',name)}})).then(()=>{if(soundNames.some(n=>!sound.buffers[n]))say('Some sounds could not load — check the WAV files in assets.');if(!sound.buffers.rain)return;const c=sound.context,src=c.createBufferSource();src.buffer=sound.buffers.rain;src.loop=true;sound.rainFilter=c.createBiquadFilter();sound.rainFilter.type='lowpass';sound.rainGain=c.createGain();sound.rainGain.gain.value=0;src.connect(sound.rainFilter);sound.rainFilter.connect(sound.rainGain);sound.rainGain.connect(sound.master);src.start();sound.rain=src});
}
function playSound(name,volume=1,rate=1,delay=0){
 const c=sound.context,b=sound.buffers[name];if(!c||!b||sound.muted||!active())return;
 const src=c.createBufferSource(),g=c.createGain();src.buffer=b;src.playbackRate.value=rate;g.gain.value=volume;src.connect(g);g.connect(sound.master);sound.voices.add(src);src.onended=()=>{sound.voices.delete(src);src.disconnect();g.disconnect()};src.start(c.currentTime+delay);
}
// Room responses are cached convolution buses; only weapon shots feed them.
const acousticProfiles={outside:{decay:.12,wet:.035,early:[.024],tone:5000},reception:{decay:1.05,wet:.23,early:[.035,.065,.095],tone:6200},corridor:{decay:.52,wet:.18,early:[.019,.041,.068],tone:4900},office:{decay:.26,wet:.085,early:[.013,.033],tone:2500},security:{decay:.4,wet:.14,early:[.02,.045],tone:3800},maintenance:{decay:.72,wet:.21,early:[.022,.053,.081],tone:5400}};
function acousticRoom(x,y){if(floor.get(cell(x,y))==='outside')return 'outside';if(inReception(x,y))return 'reception';if(y<7*TILE)return 'maintenance';if(x<10*TILE)return 'office';if(x>14*TILE)return 'security';return 'corridor'}
function roomImpulse(c,profile){const length=Math.ceil(c.sampleRate*profile.decay),buffer=c.createBuffer(2,length,c.sampleRate);let seed=12012;for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);let smooth=0;for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;smooth=.6*smooth+.4*noise;const t=i/c.sampleRate;data[i]=smooth*.09*Math.exp(-6*t/profile.decay)*Math.min(1,t/.012)}for(let i=0;i<profile.early.length;i++){const n=Math.floor((profile.early[i]+channel*.001)*c.sampleRate);if(n<length)data[n]+=.55/(i+1)}}return buffer}
function buildReverbs(){const c=sound.context;for(const [name,profile]of Object.entries(acousticProfiles)){const input=c.createGain(),filter=c.createBiquadFilter(),convolver=c.createConvolver(),impulse=roomImpulse(c,profile);input.gain.value=profile.wet;filter.type='lowpass';filter.frequency.value=profile.tone;convolver.normalize=false;convolver.buffer=impulse;input.connect(filter);filter.connect(convolver);convolver.connect(sound.master);sound.reverbs[name]={input,convolver,impulse}}}
function silenceReverbs(){for(const bus of Object.values(sound.reverbs)){bus.convolver.buffer=null;bus.convolver.buffer=bus.impulse}}
function gunshot(){const c=sound.context,b=sound.buffers['pistol-v12'];if(!c||!b||sound.muted||!active())return;const src=c.createBufferSource(),gain=c.createGain();src.buffer=b;gain.gain.value=.92;src.connect(gain);gain.connect(sound.master);const bus=sound.reverbs[acousticRoom(player.x,player.y)];if(bus)gain.connect(bus.input);sound.voices.add(src);src.onended=()=>{sound.voices.delete(src);src.disconnect();gain.disconnect()};src.start()}
function syncSound(){
 const c=sound.context;if(!c)return;const enabled=active()&&!document.hidden&&!sound.muted;
 sound.master.gain.setTargetAtTime(enabled?.7:0,c.currentTime,.03);
 if(sound.rainGain){const outside=floor.get(cell(player.x,player.y))==='outside';sound.rainGain.gain.setTargetAtTime(enabled?(outside?.22:.035):0,c.currentTime,.25);sound.rainFilter.frequency.setTargetAtTime(outside?15000:850,c.currentTime,.25)}
 if(!enabled){for(const voice of sound.voices){try{voice.stop()}catch(e){}}if(sound.wasEnabled)silenceReverbs()}sound.wasEnabled=enabled;
}
function toggleSound(){unlockSound();sound.muted=!sound.muted;$('#soundButton').textContent=sound.muted?'SOUND OFF':'SOUND ON';$('#soundButton').setAttribute('aria-pressed',String(sound.muted));syncSound()}
const floor=new Map(), explored=new Set(), rooms=[{name:'RECEPTION',x:3,y:18,w:18,h:8},{name:'WEST OFFICES',x:3,y:9,w:7,h:7},{name:'SECURITY',x:14,y:9,w:7,h:7},{name:'SERVICE CORRIDOR',x:10,y:7,w:4,h:12},{name:'MAINTENANCE',x:7,y:2,w:10,h:5},{name:'ARRIVAL / RAIN',x:2,y:26,w:20,h:7}];
function carve(x,y,w,h,type){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)floor.set(i+','+j,type)}
rooms.forEach(r=>carve(r.x,r.y,r.w,r.h,r.y===26?'outside':r.name==='SERVICE CORRIDOR'?'corridor':'inside'));carve(9,12,6,2,'corridor');
// One tile is approximately one metre. Door rectangles are actual leaf depth.
const doors=[
 {name:'Front entrance',x:11,y:25.85,w:2,h:.3,opened:false,progress:0},
 {name:'Reception corridor',x:11,y:17.85,w:2,h:.3,opened:false,progress:0},
 {name:'West office',x:9.85,y:12,w:.3,h:2,opened:false,progress:0},
 {name:'Security',x:13.85,y:12,w:.3,h:2,opened:false,progress:0},
 {name:'Maintenance',x:11,y:6.85,w:2,h:.3,opened:false,progress:0}];
const roomImage={x:176,y:1136,w:1184,h:544};
const props=[
 {kind:'desk',x:4.94000,y:19.26000,w:2.80000,h:1.68000},
 {kind:'sofa',x:15.95000,y:19.12000,w:2.65000,h:1.25000},
 {kind:'sofa',x:19.02000,y:20.93000,w:1.13000,h:2.56000},
 {kind:'table',x:16.55000,y:21.44000,w:1.54000,h:1.02000},
 {kind:'plant',x:3.70000,y:24.02000,w:1.10000,h:1.20000},
 {kind:'plant',x:19.11000,y:23.99000,w:1.19000,h:1.26000},
 {kind:'desk',x:4.3,y:9.8,w:2.2,h:1.45},{kind:'desk',x:4.3,y:14,w:2.2,h:1.45},
 {kind:'cabinet',x:8.5,y:9.8,w:.8,h:.8},
 {kind:'security',x:16.2,y:9.7,w:3,h:1.9},{kind:'cabinet',x:19.2,y:14.5,w:.8,h:.8},
 {kind:'generator',x:8,y:3,w:1.6,h:1.4},{kind:'cabinet',x:15.2,y:3,w:.8,h:.8}];
const WALL=22,wallBoxes=[],solidBoxes=[];
function wall(x,y,w,h){wallBoxes.push({x,y,w,h})}
function buildWalls(){
 wallBoxes.length=0;
 // Exterior edges of the interior footprint, plus partitions between adjoining rooms.
 for(const [k,type]of floor){if(type==='outside')continue;const [x,y]=k.split(',').map(Number);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(!floor.has((x+dx)+','+(y+dy))){
   if(dx)wall((x+(dx>0?1:0))*TILE-WALL/2,y*TILE,WALL,TILE);
   else wall(x*TILE,(y+(dy>0?1:0))*TILE-WALL/2,TILE,WALL);
  }
 }
 // Reception facade and the service corridor: leave only the door aperture open.
 wall(3*TILE,26*TILE-WALL/2,8*TILE,WALL);wall(13*TILE,26*TILE-WALL/2,8*TILE,WALL);
 for(const y of [7,18]){wall(10*TILE,y*TILE-WALL/2,TILE,WALL);wall(13*TILE,y*TILE-WALL/2,TILE,WALL)}
 for(const x of [10,14]){wall(x*TILE-WALL/2,9*TILE,WALL,3*TILE);wall(x*TILE-WALL/2,14*TILE,WALL,2*TILE)}
 // Join consecutive edge segments to avoid a wall seam at every floor tile.
 let changed=true;while(changed){changed=false;for(let i=0;i<wallBoxes.length&&!changed;i++)for(let j=i+1;j<wallBoxes.length;j++){
  const a=wallBoxes[i],b=wallBoxes[j];
  if(a.y===b.y&&a.h===b.h&&a.x<=b.x+b.w&&b.x<=a.x+a.w){const end=Math.max(a.x+a.w,b.x+b.w);a.x=Math.min(a.x,b.x);a.w=end-a.x;wallBoxes.splice(j,1);changed=true;break}
  if(a.x===b.x&&a.w===b.w&&a.y<=b.y+b.h&&b.y<=a.y+a.h){const end=Math.max(a.y+a.h,b.y+b.h);a.y=Math.min(a.y,b.y);a.h=end-a.y;wallBoxes.splice(j,1);changed=true;break}
 }}
}
function box(o){return{x:o.x*TILE,y:o.y*TILE,w:o.w*TILE,h:o.h*TILE}}
function contains(b,x,y,pad=0){return x>=b.x-pad&&x<=b.x+b.w+pad&&y>=b.y-pad&&y<=b.y+b.h+pad}
const lamps=[{x:6,y:22},{x:17,y:24},{x:12,y:20},{x:6,y:12},{x:17,y:13},{x:12,y:10},{x:12,y:4},{x:12,y:27},{x:5,y:29},{x:19,y:29}].map(p=>({x:(p.x+.5)*TILE,y:(p.y+.5)*TILE}));
// Beacon origins sit just inside the wall face, so beams can be occluded accurately.
const beacons=[{x:3*TILE+18,y:20.8*TILE,phase:0},{x:7*TILE,y:18*TILE+18,phase:1.4},{x:21*TILE-18,y:24.2*TILE,phase:2.8},{x:8*TILE,y:26*TILE-18,phase:4.2},{x:10*TILE+18,y:8.3*TILE,phase:0},{x:14*TILE-18,y:10.5*TILE,phase:1.4},{x:10*TILE+18,y:16.8*TILE,phase:2.8},{x:7*TILE+18,y:4.7*TILE,phase:4.2}];
function inReception(x,y){return x>=3*TILE&&x<=21*TILE&&y>=18*TILE&&y<=26*TILE}
const carpetZones=[{x:1002.88,y:1205.12,w:304.64,h:331.52},{x:672,y:1534.08,w:193.28,h:52.48}];
function surfaceAt(x,y){const type=floor.get(cell(x,y));if(type==='outside')return 'wet';if(inReception(x,y))return carpetZones.some(z=>contains(z,x,y))?'carpet':'tile';if(type==='corridor')return 'carpet';if(y<7*TILE)return 'metal';return 'tile'}
function footstepName(index,x,y){const t=surfaceAt(x,y);return 'step-'+(t==='tile'?'':t+'-')+(index%2?'l':'r')+(1+index%3)}
const powerSwitch={x:3*TILE+24,y:22.7*TILE}, keys={};let W=innerWidth,H=innerHeight,zoom=1,dpr=1,player,clock=0,last=0,running=false,paused=false,mapOpen=false,emergency=false,drawn=false,firing=false,reloadTime=0,cooldown=0,muzzleTime=0,bullets=[],impacts=[],toastTime=0,stick={x:0,y:0},pointer=null,firePointer=null;
let base=document.createElement('canvas'),bc=base.getContext('2d'),darkness=document.createElement('canvas'),dc=darkness.getContext('2d'),blockers=new Set();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), cell=(x,y)=>Math.floor(x/TILE)+','+Math.floor(y/TILE);
function inside(o,x,y,pad=0){return x>=o.x*TILE-pad&&x<(o.x+o.w)*TILE+pad&&y>=o.y*TILE-pad&&y<(o.y+o.h)*TILE+pad}
function doorSolids(d){
 const b=box(d),remaining=(1-d.progress)/2,out=[],horizontal=d.w>d.h;
 if(remaining>0){if(horizontal){out.push({x:b.x,y:b.y,w:b.w*remaining,h:b.h},{x:b.x+b.w*(1-remaining),y:b.y,w:b.w*remaining,h:b.h})}
 else out.push({x:b.x,y:b.y,w:b.w,h:b.h*remaining},{x:b.x,y:b.y+b.h*(1-remaining),w:b.w,h:b.h*remaining})}
 if(horizontal)out.push({x:b.x-7,y:b.y+b.h/2-17,w:9,h:34},{x:b.x+b.w-2,y:b.y+b.h/2-17,w:9,h:34});
 else out.push({x:b.x+b.w/2-17,y:b.y-7,w:34,h:9},{x:b.x+b.w/2-17,y:b.y+b.h-2,w:34,h:9});
 return out;
}
function refreshBlockers(){solidBoxes.length=0;solidBoxes.push(...wallBoxes,...props.map(box),...doors.flatMap(doorSolids))}
function open(x,y){return floor.has(cell(x,y))&&!solidBoxes.some(b=>contains(b,x,y))}
function clear(x,y,r=PLAYER_RADIUS){return [[-r,0],[r,0],[0,-r],[0,r],[-r*.7,-r*.7],[r*.7,r*.7],[-r*.7,r*.7],[r*.7,-r*.7]].every(([a,b])=>open(x+a,y+b))}
function move(dx,dy){if(clear(player.x+dx,player.y))player.x+=dx;if(clear(player.x,player.y+dy))player.y+=dy}
function mount(x,y){x*=OFFICER_SCALE;y*=OFFICER_SCALE;const c=Math.cos(player.angle),s=Math.sin(player.angle);return {x:player.x+c*x-s*y,y:player.y+s*x+c*y}}
function trace(origin,angle,range){
 const dx=Math.cos(angle),dy=Math.sin(angle);if(!open(origin.x,origin.y))return 0;
 let closest=range;
 for(const b of solidBoxes){let lo=0,hi=closest;
  for(const [p,v,min,max]of [[origin.x,dx,b.x,b.x+b.w],[origin.y,dy,b.y,b.y+b.h]]){
   if(Math.abs(v)<1e-8){if(p<min||p>max){hi=-1;break}}else{let a=(min-p)/v,z=(max-p)/v;if(a>z)[a,z]=[z,a];lo=Math.max(lo,a);hi=Math.min(hi,z)}
  }
  if(hi>=lo&&hi>=0)closest=Math.min(closest,lo);
 }
 // Grid traversal only for the outer floor footprint; furniture and walls use exact boxes.
 const sx=dx>=0?1:-1,sy=dy>=0?1:-1;let x=Math.floor(origin.x/TILE),y=Math.floor(origin.y/TILE);
 let tx=Math.abs(dx)<1e-8?Infinity:((sx>0?x+1:x)*TILE-origin.x)/dx,ty=Math.abs(dy)<1e-8?Infinity:((sy>0?y+1:y)*TILE-origin.y)/dy;
 const stepx=TILE/Math.max(1e-8,Math.abs(dx)),stepy=TILE/Math.max(1e-8,Math.abs(dy));
 for(let i=0;i<80;i++){let hit;if(tx<ty){hit=tx;tx+=stepx;x+=sx}else{hit=ty;ty+=stepy;y+=sy}if(hit>=closest)return closest;if(!floor.has(x+','+y))return Math.max(0,hit)}return closest;
}
function rect(c,x,y,w,h,fill,stroke){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1)}}
function asset(name,path){return new Promise(resolve=>{const img=new Image();img.onload=()=>{art[name]=img;resolve(true)};img.onerror=()=>{artErrors.push(path);resolve(false)};img.src=path})}
function cropCell(img,col,row,cols,rows){const w=Math.floor(img.width/cols),h=Math.floor(img.height/rows),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,col*w,row*h,w,h,0,0,w,h);return c}
function cropRegion(img,x,y,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h);return trimAlpha(c)}
function trimAlpha(img){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);const data=g.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>32){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}if(x1<=x0||y1<=y0)return c;const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(c,x0,y0,out.width,out.height,0,0,out.width,out.height);return out}
async function loadArt(){await Promise.all([asset('drawn','assets/officer-drawn-v10.png'),asset('holstered','assets/officer-holstered-v10.png'),asset('furniture','assets/furniture-atlas.png'),asset('surfaces','assets/surface-atlas.png'),asset('reception','assets/reception-room-v11.webp')]);if(art.furniture){const regions={desk:[40,95,550,365],sofa:[625,175,535,260],plant:[1180,110,350,355],security:[35,550,610,370],table:[690,625,420,300],cabinet:[1145,610,360,315]};for(const [k,r]of Object.entries(regions))art[k]=cropRegion(art.furniture,...r)}if(art.surfaces){['tile','asphalt','steel','carpet'].forEach((k,i)=>{const cell=cropCell(art.surfaces,i%2,Math.floor(i/2),2,2),sample=document.createElement('canvas');sample.width=sample.height=k==='tile'?128:128;sample.getContext('2d').drawImage(cell,0,0,sample.width,sample.height);art[k]=sample})}rebuild();$('#start').disabled=false;$('#start').textContent='Start play test';if(artErrors.length)$('#intro').textContent+=' Some artwork could not load; reload after uploading the assets folder.';}
function rebuild(){buildWalls();refreshBlockers();base.width=24*TILE;base.height=34*TILE;const patterns={};for(const k of ['tile','asphalt','carpet'])if(art[k])patterns[k]=bc.createPattern(art[k],'repeat');bc.fillStyle='#091018';bc.fillRect(0,0,base.width,base.height);
 for(const [key,type]of floor){const [x,y]=key.split(',').map(Number),px=x*TILE,py=y*TILE;rect(bc,px,py,TILE,TILE,type==='outside'?((x+y)%2?'#35464c':'#394b51'):type==='corridor'?'#a6b2b8':(x+y)%2?'#e2e7e8':'#d9e0e3',type==='outside'?'#405158':'#a5b2bb33');if(art.tile){const t=type==='outside'?art.asphalt:type==='corridor'?art.carpet:art.tile;if(t){bc.fillStyle=patterns[type==='outside'?'asphalt':type==='corridor'?'carpet':'tile'];bc.fillRect(px,py,TILE,TILE);if(type!=='outside'){rect(bc,px+1,py+1,TILE-2,TILE-2,(x+y)%2?'#ffffff08':'#183b4910');if(type!=='corridor'){rect(bc,px,py,TILE,1,'#41535f24');rect(bc,px,py,1,TILE,'#41535f24')}}}}if(type==='outside'){for(let n=0;n<4;n++){bc.strokeStyle='#4e636b';bc.beginPath();bc.ellipse(px+12+n*12,py+20+(x*n+y*7)%28,5+n,1,0,0,7);bc.stroke()}}else{}
 }
 // Corporate reception floor inlay, entrance mat and outside parking marks.
 bc.textAlign='center';bc.fillStyle='#9eafb8';bc.font='600 32px system-ui';bc.fillText('NORTHSTAR',12*TILE,23.2*TILE);bc.font='11px system-ui';bc.fillText('BIOSCIENCES  /  RECEPTION',12*TILE,23.6*TILE);rect(bc,10.6*TILE,24*TILE,2.8*TILE,.7*TILE,'#596870');for(let y=24*TILE;y<24.7*TILE;y+=6)rect(bc,10.6*TILE,y,2.8*TILE,1,'#809095');for(const x of [4,18])for(let y=28;y<32;y++)rect(bc,x*TILE,y*TILE,4,36,'#dddbb3');
 for(const o of props)drawProp(bc,o);
 for(const b of wallBoxes){
  bc.save();bc.shadowColor='#00000066';bc.shadowBlur=14;bc.shadowOffsetX=5;bc.shadowOffsetY=7;rect(bc,b.x,b.y,b.w,b.h,'#35434e');bc.restore();
  rect(bc,b.x+1,b.y+1,b.w-2,b.h-2,'#71818d','#c0ccd3');
  rect(bc,b.x+4,b.y+4,b.w-8,b.h-8,'#5b6b78');
  rect(bc,b.x,b.y,b.w,2,'#d1d9dc');rect(bc,b.x,b.y,2,b.h,'#b5c3cb');
 }
 if(art.reception)bc.drawImage(art.reception,roomImage.x,roomImage.y,roomImage.w,roomImage.h);
 rect(bc,powerSwitch.x-17,powerSwitch.y-23,34,46,'#304853','#82b0bc');rect(bc,powerSwitch.x-9,powerSwitch.y-14,18,20,emergency?'#ed775c':'#6bc7b4');bc.font='10px system-ui';bc.fillStyle='#344b58';bc.fillText('POWER TEST',powerSwitch.x,powerSwitch.y+39);
 for(const b of beacons){rect(bc,b.x-8,b.y-7,16,14,'#18212a','#72828a');bc.fillStyle='#795015';bc.beginPath();bc.arc(b.x,b.y,5.5,0,Math.PI*2);bc.fill()}
 for(const l of lamps){if(inReception(l.x,l.y))continue;rect(bc,l.x-17,l.y-4,34,8,'#cad7da','#617882');rect(bc,l.x-12,l.y-2,24,4,emergency?'#273943':'#f4ffff')}
}
function drawProp(c,o){if(art[o.kind]){const x=o.x*TILE+3,y=o.y*TILE+3,w=o.w*TILE-6,h=o.h*TILE-6;c.save();c.shadowColor='#0a1d354d';c.shadowBlur=13;c.shadowOffsetX=3;c.shadowOffsetY=6;if(o.kind==='sofa'&&h>w){c.translate(x+w/2,y+h/2);c.rotate(Math.PI/2);c.drawImage(art[o.kind],-h/2,-w/2,h,w)}else c.drawImage(art[o.kind],x,y,w,h);c.restore();return}const x=o.x*TILE+5,y=o.y*TILE+5,w=o.w*TILE-10,h=o.h*TILE-10;rect(c,x+4,y+6,w,h,'#00000033');
 if(o.kind==='desk'||o.kind==='security'){rect(c,x,y,w,h,'#8d6b4c','#674832');rect(c,x+3,y+3,w-6,h-6,'#c0a98c','#dbc9b2');const monitors=o.kind==='security'?3:1;for(let i=0;i<monitors;i++){rect(c,x+25+i*57,y+10,44,30,'#1b303b','#536b78');rect(c,x+29+i*57,y+14,36,21,'#4d8897');rect(c,x+27+i*57,y+45,40,12,'#394b52');for(let k=0;k<5;k++)rect(c,x+31+i*57+k*6,y+48,3,3,'#8a9aa1')}rect(c,x+w-38,y+13,24,33,'#f4f1df','#b2b5af');c.fillStyle='#4b6571';c.beginPath();c.arc(x+w-48,y+35,7,0,7);c.fill();}
 else if(o.kind==='sofa'){rect(c,x,y,w,h,'#294a59','#16343e');if(w>h){for(let i=0;i<o.w;i++)rect(c,x+8+i*TILE,y+9,48,h-18,'#496e7d','#7896a1')}else for(let i=0;i<o.h;i++)rect(c,x+9,y+8+i*TILE,w-18,48,'#496e7d','#7896a1');}
 else if(o.kind==='plant'){c.fillStyle='#8b7d68';c.beginPath();c.arc(x+w/2,y+h/2,22,0,7);c.fill();for(let i=0;i<9;i++){c.save();c.translate(x+w/2,y+h/2);c.rotate(i*2.4);c.fillStyle=i%2?'#426f54':'#588365';c.beginPath();c.ellipse(12,0,19,6,.2,0,7);c.fill();c.restore()}}
 else if(o.kind==='table'){rect(c,x,y,w,h,'#9aaeb7','#647d89');rect(c,x+15,y+12,27,21,'#f5f1e7');rect(c,x+22,y+16,18,2,'#8aa4ad');}
 else{rect(c,x,y,w,h,o.kind==='generator'?'#526972':'#7c939d','#344e5b');for(let j=8;j<h-8;j+=10)rect(c,x+9,y+j,w-18,3,'#364f5c');rect(c,x+w-12,y+10,4,10,'#73d2b7');}
}
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);darkness.width=W;darkness.height=H;zoom=Math.max(.65,Math.min(1.65,W/1000,H/620))}addEventListener('resize',resize);resize();
function say(s){$('#toast').textContent=s;toastTime=4}
function reset(){player={x:12*TILE,y:30*TILE,angle:-Math.PI/2,ammo:MAG,hp:100};clock=0;walking=0;walkPhase=0;sound.lastStep=0;drawn=false;emergency=false;reloadTime=0;cooldown=0;bullets=[];impacts=[];explored.clear();doors.forEach(d=>{d.opened=false;d.progress=0});resetInput();rebuild();reveal();updateHUD()}
function resetInput(){for(const k in keys)delete keys[k];stick={x:0,y:0};pointer=null;firePointer=null;firing=false;walking=0;$('#knob').style.transform='';$('#fire').classList.remove('active')}
function start(){unlockSound();reset();running=true;paused=false;mapOpen=false;document.body.classList.remove('covered','map-open');$('#overlay').style.display='none';say('Enter reception. USE opens doors. Find the power test switch on reception’s west wall.')}
function rectDistance(o,p){return Math.hypot(p.x-Math.max(o.x*TILE,Math.min(p.x,(o.x+o.w)*TILE)),p.y-Math.max(o.y*TILE,Math.min(p.y,(o.y+o.h)*TILE)))}
function nearbyDoor(){return doors.filter(d=>rectDistance(d,player)<80).sort((a,b)=>rectDistance(a,player)-rectDistance(b,player))[0]}
function active(){return running&&!paused&&!mapOpen}
function use(){if(!active())return;if(distance(player,powerSwitch)<100){emergency=!emergency;playSound('switch',.35);playSound('power',.2,emergency?.8:1,.13);rebuild();say(emergency?'MAINS OFF — emergency lighting active. Draw the Glock for its torch.':'MAINS RESTORED — normal lighting active.');updateHUD();return}const d=nearbyDoor();if(!d){say('Move near a door or the reception power switch, then USE.');return}if(d.progress>0&&d.progress<1){say('Door is moving…');return}if(d.opened&&inside(d,player.x,player.y,PLAYER_RADIUS+6)){say('Step clear of the doorway before closing it.');return}d.opened=!d.opened;refreshBlockers();playSound(d.opened?'door-open':'door-close',.3);say(d.name+(d.opened?' opening.':' closing.'));updateHUD()}
function holster(){if(!active())return;drawn=!drawn;playSound('holster',.18,drawn?1:0.9);firing=false;$('#fire').classList.remove('active');say(drawn?'Glock drawn — pistol torch on.':'Glock holstered — vest light only.');updateHUD()}
function reload(){if(!active()||reloadTime>0||player.ammo===MAG)return;reloadTime=1.5;playSound('reload',.28);say('Reloading…');updateHUD()}
function updateHUD(){$('#healthValue').textContent='100';$('#ammoValue').textContent=player.ammo;$('#ammoPanel').classList.toggle('empty',player.ammo===0);$('#ammoState').textContent=reloadTime?'RELOADING '+reloadTime.toFixed(1)+'s':'RESERVE ∞';$('#holster').textContent=drawn?'HOLSTER':'DRAW';$('#fire').disabled=!drawn;$('#reload').disabled=reloadTime>0||player.ammo===MAG;$('#reload').textContent=reloadTime?'LOADING '+reloadTime.toFixed(1):'RELOAD';$('#objective').textContent=emergency?'Emergency power · compare vest light and pistol torch':'Find the power test switch on reception’s west wall';$('#kills').textContent=(floor.get(cell(player.x,player.y))==='outside'?'OUTSIDE · RAIN':'INSIDE')+'  /  '+(drawn?'GLOCK DRAWN':'HOLSTERED');const door=nearbyDoor(),atPower=distance(player,powerSwitch)<100,moving=door&&door.progress>0&&door.progress<1;$('#use').textContent=atPower?'POWER':moving?'MOVING…':door?(door.opened?'CLOSE':'OPEN'):'USE';$('#use').disabled=!atPower&&!!moving}
function toggleMap(){if(!running||paused)return;mapOpen=!mapOpen;resetInput();document.body.classList.toggle('covered',mapOpen);document.body.classList.toggle('map-open',mapOpen);$('#mapButton').textContent=mapOpen?'CLOSE MAP':'MAP'}
function pause(){if(!running||mapOpen)return;paused=!paused;resetInput();document.body.classList.toggle('covered',paused);$('#overlay').style.display=paused?'flex':'none';$('#title').textContent='PAUSED';$('#intro').textContent='Visual playtest paused.';$('#start').textContent='Resume'}
function shoot(){if(!drawn||reloadTime||cooldown>0)return;if(!player.ammo){say('Magazine empty — press RELOAD.');cooldown=.5;return}player.ammo--;gunshot();cooldown=.18;muzzleTime=.06;const p=mount(26.8,2.8);const clipped=trace(player,Math.atan2(p.y-player.y,p.x-player.x),distance(p,player));if(clipped<distance(p,player)){const a=Math.atan2(p.y-player.y,p.x-player.x);impacts.push({x:player.x+Math.cos(a)*clipped,y:player.y+Math.sin(a)*clipped,life:.1});return}bullets.push({...p,vx:Math.cos(player.angle)*920,vy:Math.sin(player.angle)*920,life:.8});}
function reveal(){const range=emergency?(drawn?560:130):650;for(let y=-10;y<=10;y++)for(let x=-10;x<=10;x++){const gx=Math.floor(player.x/TILE)+x,gy=Math.floor(player.y/TILE)+y,p={x:(gx+.5)*TILE,y:(gy+.5)*TILE};if(floor.has(gx+','+gy)&&distance(p,player)<range&&trace(player,Math.atan2(p.y-player.y,p.x-player.x),distance(p,player))>=distance(p,player)-2)explored.add(gx+','+gy)}}
function update(dt){clock+=dt;let doorChanged=false;for(const d of doors){if(!d.opened&&d.progress>0&&inside(d,player.x,player.y,PLAYER_RADIUS+6)){d.opened=true;say('Doorway occupied — reopening.')}const previous=d.progress;d.progress=d.opened?Math.min(1,d.progress+dt*1.8):Math.max(0,d.progress-dt*1.8);if(previous!==d.progress)doorChanged=true}if(doorChanged)refreshBlockers();const previousX=player.x,previousY=player.y;let x=stick.x+(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),y=stick.y+(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),l=Math.hypot(x,y);if(l>.06){player.angle=Math.atan2(y,x);if(l>1){x/=l;y/=l}move(x*205*dt,y*205*dt)}walking=Math.hypot(player.x-previousX,player.y-previousY)/Math.max(.001,dt);if(walking>1)walkPhase+=Math.hypot(player.x-previousX,player.y-previousY)*.05;const stepIndex=Math.floor((walkPhase+Math.PI/2)/Math.PI);if(walking>1&&stepIndex!==sound.lastStep){sound.lastStep=stepIndex;playSound(footstepName(stepIndex,player.x,player.y),surfaceAt(player.x,player.y)==='carpet'?.16:.2,.97+Math.random()*.06)}cooldown=Math.max(0,cooldown-dt);muzzleTime=Math.max(0,muzzleTime-dt);if(reloadTime){reloadTime=Math.max(0,reloadTime-dt);if(!reloadTime){player.ammo=MAG;say('Magazine ready: 17 rounds.')}}if(firing||keys[' '])shoot();for(const b of bullets){const n=Math.ceil(920*dt/5);for(let i=0;i<n&&b.life>0;i++){b.x+=b.vx*dt/n;b.y+=b.vy*dt/n;if(!open(b.x,b.y)){b.life=0;impacts.push({x:b.x,y:b.y,life:.14})}}b.life-=dt}bullets=bullets.filter(b=>b.life>0);impacts.forEach(p=>p.life-=dt);impacts=impacts.filter(p=>p.life>0);toastTime-=dt;if(toastTime<0)$('#toast').textContent='';reveal();updateHUD()}
function screen(p){return{x:W/2+(p.x-player.x)*zoom,y:H/2+(p.y-player.y)*zoom}}
function illuminate(origin,angle,half,range,brightness,tint){if(!open(origin.x,origin.y))return;const p=screen(origin);dc.save();dc.beginPath();dc.moveTo(p.x,p.y);const n=half>3?80:64;for(let i=0;i<=n;i++){const a=angle-half+2*half*i/n,r=trace(origin,a,range)+3;dc.lineTo(p.x+Math.cos(a)*r*zoom,p.y+Math.sin(a)*r*zoom)}dc.closePath();dc.clip();dc.globalCompositeOperation='destination-out';const g=dc.createRadialGradient(p.x,p.y,0,p.x,p.y,range*zoom);g.addColorStop(0,'rgba(0,0,0,'+brightness+')');g.addColorStop(.45,'rgba(0,0,0,'+brightness*.85+')');g.addColorStop(1,'rgba(0,0,0,0)');dc.fillStyle=g;dc.fillRect(0,0,W,H);if(tint){dc.globalCompositeOperation='source-over';const cg=dc.createRadialGradient(p.x,p.y,0,p.x,p.y,range*zoom);cg.addColorStop(0,'rgba(176,34,19,.40)');cg.addColorStop(.5,'rgba(150,25,14,.23)');cg.addColorStop(1,'rgba(120,20,10,0)');dc.fillStyle=cg;dc.fillRect(0,0,W,H)}dc.restore();}
// Sprite canvases share a 512px frame and shoulder pivot (256,280).
// Feet animate below the upright torso; only actual travel advances the gait.
function drawDoors(){
 for(const d of doors){const b=box(d),horizontal=d.w>d.h,span=Math.max(b.w,b.h),depth=20,slide=d.progress;
  ctx.save();ctx.translate(b.x+b.w/2,b.y+b.h/2);if(!horizontal)ctx.rotate(Math.PI/2);
  rect(ctx,-span/2,-12,span,24,'#54748122');rect(ctx,-span/2,-14,span,2,'#1e3441');rect(ctx,-span/2,12,span,2,'#94a8b3');
  // Frame and recessed track stay visible when the two leaves slide into their pockets.
  rect(ctx,-span/2-7,-17,9,34,'#526777','#becbd1');rect(ctx,span/2-2,-17,9,34,'#526777','#becbd1');
  ctx.save();ctx.beginPath();ctx.rect(-span/2,-12,span,24);ctx.clip();
  const half=span/2,offset=half*slide;
  for(const side of [-1,1]){const x=side<0?-half-offset:offset;
   const g=ctx.createLinearGradient(0,-10,0,10);g.addColorStop(0,'#acbac3');g.addColorStop(.35,'#637783');g.addColorStop(1,'#354a59');
   rect(ctx,x,-10,half,depth,g,'#cfdae0');
   if(d.name==='Front entrance'){rect(ctx,x+6,-6,half-12,12,'#92c7d680','#d0e5e9');rect(ctx,x+half/2-1,-7,2,14,'#3b5867')}
   else{rect(ctx,x+6,-7,half-12,3,'#8499a7');rect(ctx,x+6,4,half-12,2,'#243b4b')}
   rect(ctx,side<0?x+half-6:x+3,-6,3,12,'#ebf0f0');
  }
  ctx.restore();
  rect(ctx,-span/2-6,-4,4,8,slide===1?'#80dfba':'#e6b15f');
  // Threshold lighting and access reader clearly mark the doorway.
  rect(ctx,span/2+8,-7,9,14,'#162b3b','#8296a4');rect(ctx,span/2+10,-4,5,5,'#76cabb');
  ctx.restore();
 }
}
function drawCharacter(){
 ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle+Math.PI/2);ctx.scale(OFFICER_SCALE,OFFICER_SCALE);
 ctx.fillStyle='#00000035';ctx.beginPath();ctx.ellipse(0,5,17,14,0,0,Math.PI*2);ctx.fill();
 const moving=walking>1, stride=moving?Math.sin(walkPhase)*8:0;
 for(const side of [-1,1]){const step=stride*side;ctx.save();ctx.translate(side*7,8-step);ctx.rotate(moving?side*Math.cos(walkPhase)*.08:0);ctx.fillStyle='#101820';ctx.beginPath();ctx.roundRect(-4,-6,8,15,3);ctx.fill();ctx.strokeStyle='#47505a';ctx.lineWidth=.8;ctx.stroke();ctx.restore()}
 const sprite=art[drawn?'drawn':'holstered'];
 if(sprite){ctx.drawImage(sprite,-28,-30.625,56,56)}
 else{ctx.fillStyle='#162431';ctx.beginPath();ctx.ellipse(0,0,15,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b7a58e';ctx.beginPath();ctx.arc(0,-3,7,0,Math.PI*2);ctx.fill();if(drawn){rect(ctx,6,-22,4,14,'#17212a');rect(ctx,4,-12,8,5,'#b7a58e')}}
 ctx.restore();
 if(muzzleTime){const p=mount(26.8,2.8);ctx.save();ctx.translate(p.x,p.y);const g=ctx.createRadialGradient(0,0,0,0,0,18);g.addColorStop(0,'#fffbea');g.addColorStop(.3,'#ffd275');g.addColorStop(1,'#ff922000');ctx.fillStyle=g;ctx.fillRect(-18,-18,36,36);ctx.restore()}
}
function drawMap(){ctx.fillStyle='#0b1720';ctx.fillRect(0,0,W,H);const scale=Math.min((W-350)/(24*TILE),(H-140)/(34*TILE)),ox=(W-24*TILE*scale)/2,oy=80;
 ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
 for(const k of explored){const[x,y]=k.split(',').map(Number);rect(ctx,x*TILE,y*TILE,TILE-1,TILE-1,'#728b96')}
 ctx.save();ctx.beginPath();for(const k of explored){const[x,y]=k.split(',').map(Number);ctx.rect(x*TILE,y*TILE,TILE,TILE)}ctx.clip();
 for(const b of wallBoxes)rect(ctx,b.x,b.y,b.w,b.h,'#d2e0e7');for(const d of doors){const b=box(d);rect(ctx,b.x,b.y,b.w,b.h,d.progress===1?'#70c8af':'#deae74')}ctx.restore();
 ctx.strokeStyle='#efc477';ctx.lineWidth=10;ctx.strokeRect(powerSwitch.x-28,powerSwitch.y-28,56,56);ctx.fillStyle='#57d5ee';ctx.beginPath();ctx.arc(player.x,player.y,22,0,7);ctx.fill();ctx.restore();ctx.font='16px system-ui';ctx.fillStyle='#d7e7ed';ctx.textAlign='center';ctx.fillText('EXPLORED MAP · Amber: power test switch',W/2,H-35)
}
function beaconAngle(b){return clock*1.8+b.phase}
function beamRays(b){const a=beaconAngle(b),rays=[];for(let i=0;i<=24;i++){const angle=a-.28+.56*i/24,r=trace(b,angle,380);rays.push({x:b.x+Math.cos(angle)*r,y:b.y+Math.sin(angle)*r,r})}return rays}
function drawBeacons(){
 for(const b of beacons){if(distance(b,player)>950)continue;const p=screen(b),rays=beamRays(b);
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.beginPath();ctx.moveTo(p.x,p.y);for(const r of rays){const q=screen(r);ctx.lineTo(q.x,q.y)}ctx.closePath();ctx.clip();
  for(const carpet of [false,true]){ctx.save();ctx.beginPath();if(!carpet)ctx.rect(0,0,W,H);for(const z of carpetZones){const q=screen(z);ctx.rect(q.x,q.y,z.w*zoom,z.h*zoom)}ctx.clip(carpet?'nonzero':'evenodd');const shine=carpet?.16:.38,g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,380*zoom);g.addColorStop(0,'rgba(255,188,35,'+shine+')');g.addColorStop(.5,'rgba(255,170,20,'+shine*.65+')');g.addColorStop(1,'rgba(255,160,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore()}ctx.restore();
  // Reflect only on the first wall hit, never across a partition into another room.
  for(let i=0;i<rays.length;i+=4){const r=rays[i];if(r.r>=379)continue;const hit=solidBoxes.find(w=>contains(w,r.x,r.y,1));if(!hit)continue;const q=screen(r),c=screen(hit);ctx.save();ctx.beginPath();ctx.rect(c.x,c.y,hit.w*zoom,hit.h*zoom);ctx.clip();ctx.globalCompositeOperation='screen';const glow=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,25*zoom);glow.addColorStop(0,'rgba(255,197,61,.32)');glow.addColorStop(1,'rgba(255,164,20,0)');ctx.fillStyle=glow;ctx.fillRect(q.x-26*zoom,q.y-26*zoom,52*zoom,52*zoom);ctx.restore()}
  // Visible revolving amber lens and metal mounting bracket.
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(zoom,zoom);ctx.fillStyle='#18212a';ctx.fillRect(-8,-7,16,14);ctx.strokeStyle='#72828a';ctx.strokeRect(-8,-7,16,14);ctx.fillStyle='#db8b13';ctx.beginPath();ctx.arc(0,0,5.5,0,Math.PI*2);ctx.fill();ctx.rotate(beaconAngle(b));ctx.fillStyle='#ffe296';ctx.fillRect(0,-1.5,5,3);ctx.restore();
 }
}
function draw(){ctx.fillStyle='#0c1720';ctx.fillRect(0,0,W,H);if(!player)return;if(mapOpen){drawMap();return}ctx.save();ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-player.x,-player.y);ctx.drawImage(base,0,0);drawDoors();for(const b of bullets){ctx.fillStyle='#f6dc93';ctx.beginPath();ctx.arc(b.x,b.y,2,0,7);ctx.fill()}for(const h of impacts){ctx.fillStyle='#f8e0a5';ctx.fillRect(h.x-3,h.y-3,6,6)}drawCharacter();ctx.restore();dc.globalCompositeOperation='source-over';dc.fillStyle=emergency?'rgba(0,5,12,.96)':'rgba(7,18,28,.18)';dc.clearRect(0,0,W,H);dc.fillRect(0,0,W,H);
if(!emergency)for(const l of lamps){if(distance(l,player)>1000)continue;const outside=floor.get(cell(l.x,l.y))==='outside';illuminate(l,0,Math.PI,outside?240:210,.24,null)}
if(emergency)for(const b of beacons){if(distance(b,player)>950)continue;illuminate(b,0,Math.PI,65,.28,null);illuminate(b,beaconAngle(b),.34,390,.1,null);illuminate(b,beaconAngle(b),.28,380,.28,null);illuminate(b,beaconAngle(b),.22,370,.68,null)}
const personalLight=emergency||floor.get(cell(player.x,player.y))==='outside';const vest=mount(9,5);if(personalLight)illuminate(vest,player.angle,.85,145,.62,null);if(drawn&&personalLight){const torch=mount(25,4);illuminate(torch,player.angle,.45,620,.12,null);illuminate(torch,player.angle,.415,600,.25,null);illuminate(torch,player.angle,.38,580,.88,null)}if(muzzleTime)illuminate(mount(26.8,2.8),0,Math.PI,120,.9,null);ctx.drawImage(darkness,0,0,W,H);if(emergency)drawBeacons();
// Rain exists in the exterior only, and stops at the entrance threshold.
ctx.strokeStyle='#b9d6e64d';ctx.lineWidth=1;for(let i=0;i<190;i++){const x=(i*97+clock*90)%W,y=(i*173+clock*460)%H,wx=player.x+(x-W/2)/zoom,wy=player.y+(y-H/2)/zoom;if(floor.get(cell(wx,wy))!=='outside')continue;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+14);ctx.stroke()}drawRainDetails();
// Fixture indicators sit above darkness without revealing neighboring rooms.
if(distance(powerSwitch,player)<800){const p=screen(powerSwitch);ctx.fillStyle=emergency?'#ff7862':'#63d0b5';ctx.fillRect(p.x-5,p.y-8,10,16)} }
function bindTap(id,fn){const el=$(id);el.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(!el.disabled){unlockSound();fn()}};el.onclick=e=>{if(e.detail===0&&!el.disabled){unlockSound();fn()}};el.oncontextmenu=e=>e.preventDefault()}
bindTap('#soundButton',toggleSound);bindTap('#start',()=>running&&paused?pause():start());bindTap('#use',use);bindTap('#reload',reload);bindTap('#holster',holster);bindTap('#mapButton',toggleMap);bindTap('#pause',pause);
const se=$('#stick');function stickMove(e){const r=se.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),radius=r.width*.35,strength=l<7?0:Math.min(1,l/radius);stick={x:l?x/l*strength:0,y:l?y/l*strength:0};$('#knob').style.transform='translate('+stick.x*radius+'px,'+stick.y*radius+'px)'}se.onpointerdown=e=>{if(!active()||pointer!==null)return;e.preventDefault();unlockSound();pointer=e.pointerId;se.setPointerCapture(pointer);stickMove(e)};se.onpointermove=e=>{if(e.pointerId===pointer)stickMove(e)};se.onpointerup=se.onpointercancel=se.onlostpointercapture=e=>{if(e.pointerId!==pointer)return;pointer=null;stick={x:0,y:0};$('#knob').style.transform=''};
$('#fire').onpointerdown=e=>{if(!active()||!drawn||firePointer!==null)return;e.preventDefault();unlockSound();firePointer=e.pointerId;e.currentTarget.setPointerCapture(firePointer);firing=true;$('#fire').classList.add('active')};$('#fire').onpointerup=$('#fire').onpointercancel=$('#fire').onlostpointercapture=e=>{if(e.pointerId!==firePointer)return;firePointer=null;firing=false;$('#fire').classList.remove('active')};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat&&['e','r','h','m','escape'].includes(k))return;if(k==='e')use();else if(k==='r')reload();else if(k==='h')holster();else if(k==='m')toggleMap();else if(k==='escape'){if(mapOpen)toggleMap();else pause()}else keys[k]=true});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden&&active())pause()});for(const t of ['gesturestart','gesturechange','gestureend','dblclick'])document.addEventListener(t,e=>e.preventDefault(),{passive:false});
function drawRainDetails(){for(let i=0;i<46;i++){const wx=(2+(i*7.37)%20)*TILE,wy=(26+(i*3.17)%7)*TILE,t=(clock*1.1+i*.173)%1;if(!open(wx,wy))continue;const p=screen({x:wx,y:wy});ctx.strokeStyle='rgba(187,219,233,'+((1-t)*.18)+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,2+t*12,1+t*4,0,0,7);ctx.stroke()} }
function frame(now){const dt=Math.min(.035,(now-last)/1000||0);last=now;if(active())update(dt);syncSound();draw();requestAnimationFrame(frame)}reset();$('#start').disabled=true;$('#start').textContent='Loading artwork…';loadArt();requestAnimationFrame(frame);if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
