/* The departure clock owns visuals; combat cues remain soundtrack timestamps. */
(function(root){
'use strict';
const SHOTS=[5.019, 5.143, 5.248, 5.363, 5.478, 5.607, 5.717, 5.792, 5.927, 6.036, 6.136, 6.206, 6.291, 6.366, 6.475, 8.082, 8.176, 8.256, 8.371, 8.441, 8.546, 8.685, 8.79, 8.905, 9.02, 9.144, 9.259, 9.329, 9.463, 9.578, 9.678, 9.793, 9.902, 9.997, 10.062, 12.522, 12.641, 12.756, 12.831, 12.936, 13.015, 13.085, 13.17, 13.25, 13.335, 13.4, 13.489, 13.584, 13.664, 13.779, 13.908, 14.018, 14.397, 14.467, 14.582, 14.657, 14.761, 14.841, 14.956, 15.066, 15.166, 15.235, 15.32, 15.39, 15.505, 15.659, 15.759, 15.874, 15.944, 16.049, 16.158, 16.243, 16.353, 16.458, 16.572, 16.687, 16.792, 17.445, 17.565, 17.68, 17.75, 17.859, 17.939, 18.059, 18.164, 18.259, 18.323, 18.628, 18.752, 18.882, 18.987, 19.097, 19.181, 19.291, 19.396, 19.516, 19.62, 19.73, 20.299, 20.404, 20.518, 20.588, 20.693, 20.828, 20.937, 21.052, 21.167, 21.292, 21.406, 21.476, 21.611, 21.726, 21.825, 21.895, 21.98, 22.05, 22.145, 22.21, 23.766, 23.861, 23.941, 24.055, 24.125, 24.235, 24.37, 24.474, 24.589, 24.704, 24.834, 24.948, 25.018, 25.153, 25.263, 25.367, 25.432, 25.517, 25.592, 25.702, 26.345, 26.445, 26.56, 26.629, 26.734, 26.819, 26.929, 27.044, 27.143, 27.258, 27.368, 27.463, 27.527, 28.291, 28.361, 28.475, 28.595, 28.665, 28.77, 28.909, 29.014, 29.129, 29.244, 29.368, 29.483, 29.553, 29.693, 29.802, 29.902, 29.972, 30.057, 30.127, 30.221, 30.286, 31.927, 32.022, 32.102, 32.217, 32.287, 32.391, 32.531, 32.636, 32.751, 32.865, 32.99, 33.105, 33.18, 33.314, 33.424, 33.524, 33.594, 33.678, 33.748, 33.863],DEATHS=[12.641,20.518,28.595],DEAD=[2,6,4];
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)},mix=(a,b,t)=>a+(b-a)*t;
const dirs=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],distance=(a,b)=>{const[q,r]=a.split(',').map(Number),[x,y]=b.split(',').map(Number);return Math.max(Math.abs(q-x),Math.abs(r-y),Math.abs(q+r-x-y))};
function route(tiles,from,to,random=Math.random){
 const legal=k=>tiles[k]&&!['gravity','void'].includes(tiles[k].terrain);
 if(!legal(from)||!legal(to))return null;
 const queue=[[from]],seen=new Set([from]);
 for(let n=0;n<queue.length;n++){const path=queue[n],k=path[path.length-1];if(k===to)return path;const[q,r]=k.split(',').map(Number),next=dirs.map(([x,y])=>`${q+x},${r+y}`).filter(legal).map(k=>({k,n:random()})).sort((a,b)=>a.n-b.n);
  for(const{k:hex}of next)if(!seen.has(hex)){seen.add(hex);queue.push(path.concat(hex))}}
 return null;
}
function plan(game,staging,random=Math.random){
 const aboard=new Set(game.departure.people),fighters=game.players.flatMap((p,i)=>!aboard.has(i)&&!p.boarded&&!p.captive?[{index:i,hex:p.pos,name:p.name,drone:false}]:[]);
 for(const gun of game.sentries||[])fighters.push({index:fighters.length,hex:gun.hex,name:'Sentry gun',drone:true});
 if(!fighters.length)fighters.push({index:0,hex:staging,name:'Sentry drone 1',drone:true},{index:1,hex:staging,name:'Sentry drone 2',drone:true});
 const tiles=game.tiles,keys=Object.keys(tiles),edge=keys.filter(k=>{const[q,r]=k.split(',').map(Number);return dirs.some(([x,y])=>!tiles[`${q+x},${r+y}`])&&!['gravity','void'].includes(tiles[k].terrain)});
 const far=Math.max(0,...edge.map(k=>distance(k,staging))),farEdge=edge.filter(k=>distance(k,staging)>=far-1);
 const starts=farEdge.map(hex=>({hex,paths:fighters.map(f=>{const direct=route(tiles,hex,f.hex,random);if(direct)return direct;const closest=keys.filter(k=>!['gravity','void'].includes(tiles[k].terrain)).sort((a,b)=>distance(a,f.hex)-distance(b,f.hex));for(const k of closest){const p=route(tiles,hex,k,random);if(p)return p}return [hex]})}));
 const jumpers=Array(fighters.length).fill(0);
 const contacts=Array.from({length:40},(_,i)=>{const options=starts.length?starts:[{hex:staging,paths:fighters.map(f=>route(tiles,staging,f.hex,random))}],entry=options[Math.floor(random()*options.length)],targets=entry.paths.flatMap((p,j)=>p?[j]:[]),target=targets.length?targets[i%targets.length]:0,path=entry.paths[target]||[entry.hex],jumps=i>=25&&jumpers[target]<2;if(jumps)jumpers[target]++;return {path,target,wave:i<10?0:i<25?8:18,arrival:i<10?10+(i%5)*.8:i<25?19+(i%5)*.6:jumps?33.3:40+(i%5)*.6,leapAt:jumps?33.3+(jumpers[target]-1)*.1:Infinity,pileX:((i*17)%29)-14,pileY:((i*11)%23)-11,delay:random()*.75,dx:(random()-.5)*20,dy:(random()-.5)*16,phase:random()*6.28,death:i<10?SHOTS.filter(t=>t>=5&&t<=10)[Math.floor(i*(SHOTS.filter(t=>t>=5&&t<=10).length-1)/9)]:i<25?SHOTS.filter(t=>t>=12.5&&t<=19)[Math.floor((i-10)*(SHOTS.filter(t=>t>=12.5&&t<=19).length-1)/14)]:Infinity}});
 return {fighters,contacts};
}
function position(a,t,centre){const start=a.wave||0,arrival=a.arrival||33.7,p=clamp((Math.min(t,a.death)-start-.5-a.delay)/(arrival-start-.5-a.delay)),f=p*(a.path.length-1),n=Math.min(Math.max(0,a.path.length-2),Math.floor(f)),u=ease((f-n-.30)/.60),from=centre(a.path[n]),to=centre(a.path[Math.min(n+1,a.path.length-1)]);const gather=ease((p-.82)/.18),ring=a.phase,rx=Math.cos(ring)*39,ry=Math.sin(ring)*30;return {x:mix(from[0],to[0],u)+mix(a.dx,rx,gather),y:mix(from[1],to[1],u)+mix(a.dy,ry,gather),angle:Math.atan2(to[0]-from[0],-(to[1]-from[1]))}}

let owner=null,raf=null,assets=null;
function images(){if(assets)return assets;assets={};for(const[k,src]of Object.entries({ship:'dropship-landing.webp',body:'alien-realistic.png',marine:'marine-realistic.png',sentry:root.ShipArtwork?.SENTRY_ART?.parts})){const im=new Image();assets[k]=im;if(src)im.src=src}return assets}
const ready=im=>im&&(im.getContext||im.complete&&im.naturalWidth);
function polygon(c,pts){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}
const HULL=[[555,65],[650,12],[840,130],[862,186],[993,308],[1210,178],[1235,111],[1325,92],[1396,105],[1412,170],[1480,260],[1450,282],[1390,224],[1340,277],[1240,292],[1160,364],[1130,420],[1220,469],[1270,573],[1425,673],[1496,791],[1490,884],[1420,915],[1250,782],[1220,800],[1105,738],[1055,816],[990,879],[950,817],[885,821],[812,789],[793,727],[881,654],[912,590],[791,517],[756,486],[725,418],[643,352],[568,342],[501,293],[460,218],[465,166],[522,129],[596,142]];
function stop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;owner=null}
function mount(canvas,game,centre,staging,onTime){
 stop();owner=canvas;const c=canvas.getContext('2d'),art=images();if(!c)return;game.departure.battle??=plan(game,staging);const battle=game.departure.battle,reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function glow(x,y,r,rgb,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)}
 function sprite(im,x,y,w,h){if(ready(im))c.drawImage(im,x,y,w,h)}
 function platform(){const[sx,sy]=centre(staging),sc=.19,x=sx-320*sc,y=sy-665*sc;
  if(ready(art.ship)){c.save();polygon(c,[[15,688],[80,621],[133,473],[211,394],[237,448],[302,466],[416,477],[509,650],[551,774],[524,875],[406,961],[311,988],[292,955],[245,934],[160,831],[58,815]].map(([a,b])=>[x+a*sc,y+b*sc]));c.clip();sprite(art.ship,x,y,1536*sc,1024*sc);c.restore();c.save();polygon(c,[[427,565],[732,384],[816,482],[519,676]].map(([a,b])=>[x+a*sc,y+b*sc]));c.clip();sprite(art.ship,x,y,1536*sc,1024*sc);c.restore()}
 }
 function ship(t){const[sx,sy]=centre(staging),sc=.19,x=sx-320*sc,y=sy-665*sc;
  const lift=ease((t-14)/4),flight=ease((t-18)/14),power=ease((t-8)/4);c.save();c.translate(x+1030*sc+flight*297,y+465*sc-lift*16+flight*270);c.scale(sc*(1+lift*.1-flight*.04),sc*(1+lift*.1-flight*.04));c.translate(-1030,-465);
  if(power)for(const[ex,ey]of [[690,130],[590,254]])glow(ex,ey,300,'135,255,220',power*.8);
  c.save();polygon(c,HULL);c.clip();sprite(art.ship,0,0,1536,1024);c.restore();
  for(const[ex,ey]of [[690,130],[590,254]])if(power){glow(ex,ey,140,'220,255,240',power);glow(ex,ey,48,'255,255,255',power);c.fillStyle='#f2fff9';c.beginPath();c.ellipse(ex,ey,22*power,15*power,-.8,0,6.28);c.fill()}
  for(const[x,y,rgb]of [[1261,168,'255,45,60'],[849,688,'40,255,120']])glow(x,y,50,rgb,.8);
  const shut=ease((t-11)/3);if(shut){c.save();c.translate(753,405);c.scale(1,shut);c.fillStyle='#747660';polygon(c,[[-23,-5],[25,19],[37,70],[0,49]]);c.fill();c.strokeStyle='#202820';c.lineWidth=4;c.stroke();c.restore()}c.restore();
 }
 function draw(){if(owner!==canvas||!canvas.isConnected)return;raf=null;if(document.hidden)return;
  const t=(performance.now()-game.departure.started)/1000,w=canvas.clientWidth||820,h=canvas.clientHeight||614;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);const scale=Math.min(w/820,h/614);c.setTransform(scale,0,0,scale,(w-820*scale)/2-20*scale,(h-614*scale)/2-8*scale);
  platform();
  const positions=battle.contacts.map(a=>position(a,t,centre));
  function alien(a,p,angle,size=1){c.save();c.translate(p.x,p.y);c.rotate(angle);sprite(art.body,-19*size,-28*size,38*size,54*size);c.restore()}
  battle.contacts.forEach((a,i)=>{if(t<(a.wave||0)||t>=a.death||t>=a.leapAt)return;const p=positions[i];alien(a,{x:p.x,y:p.y+(reduced?0:Math.sin(t*14+a.phase))},p.angle)});
  const flashes=[];
  const shot=SHOTS.findIndex(at=>t>=at&&t<at+.075);
  battle.fighters.forEach((f,n)=>{const[x0,y0]=centre(f.hex),same=battle.fighters.filter(a=>a.hex===f.hex),offset=same.indexOf(f)-(same.length-1)/2,x=x0+offset*24,y=y0+8;
   const hit=battle.contacts.findIndex(a=>t>=a.death-.16&&t<a.death+.08),live=battle.contacts.flatMap((a,i)=>t>=(a.wave||0)&&t<a.death?[i]:[]),target=hit>=0?hit:live[(Math.floor(t*.7)+n*3)%live.length],p=positions[target]||positions[0],angle=Math.atan2(p.x-x,-(p.y-y));
   c.save();c.translate(x,y);if(f.drone){if(ready(art.sentry))c.drawImage(art.sentry,0,0,920,900,-17,-21,35,34);else{c.fillStyle='#697966';c.fillRect(-10,-10,20,20)}c.save();c.rotate(angle);if(ready(art.sentry))c.drawImage(art.sentry,1000,0,480,1000,-11,-30,20,41);else{c.fillStyle='#697966';c.fillRect(-3,-29,6,24)}glow(8,-4,5,'255,45,60',.8);c.restore()}else{c.rotate(angle);if(ready(art.marine))c.drawImage(art.marine,(f.index%4)*499.25,0,499.25,787,-20,-37,40,63)}c.restore();
   if(!f.drone){c.fillStyle='#d6e6cc';c.font='bold 9px monospace';c.textAlign='center';c.fillText((f.name||'?').charAt(0).toUpperCase(),x+11,y+19)}
   if(shot>=0&&shot%battle.fighters.length===n)flashes.push(()=>{const gx=x+Math.sin(angle)*27,gy=y-Math.cos(angle)*27;glow(gx,gy,34,'255,178,65',.8);c.save();c.translate(gx,gy);c.rotate(angle);c.fillStyle='#fff4b2';polygon(c,[[0,-14],[3,-5],[8,-7],[4,0],[1,8],[-3,1],[-9,-4],[-3,-5]]);c.fill();c.restore();c.strokeStyle='rgba(255,206,102,.6)';c.lineWidth=1;c.beginPath();c.moveTo(gx,gy);c.lineTo(mix(gx,p.x,.8),mix(gy,p.y,.8));c.stroke()});
  });
  // Defenders remain beneath landed aliens; flashes are painted last.
  battle.contacts.forEach((a,i)=>{if(t<a.leapAt||t>=a.death)return;const f=battle.fighters[a.target],same=battle.fighters.filter(v=>v.hex===f.hex),[x0,y0]=centre(f.hex),x=x0+(same.indexOf(f)-(same.length-1)/2)*24,y=y0+8,u=ease((t-a.leapAt)/.55),from=position(a,a.leapAt,centre),jump=reduced?0:Math.sin(u*Math.PI)*28;alien(a,{x:mix(from.x,x+a.pileX,u),y:mix(from.y,y+a.pileY,u)-jump},mix(from.angle,a.phase,u),1+Math.sin(u*Math.PI)*.18)});
  flashes.forEach(f=>f());
  battle.contacts.forEach((a,i)=>{const age=t-a.death;if(age<0||!Number.isFinite(age))return;const p=positions[i];c.save();c.translate(p.x,p.y);for(let j=0;j<17;j++){const ang=j*2.399+i,r=11+j%6*4;c.fillStyle=`rgba(174,190,98,${.25*Math.max(0,1-age/22)})`;c.beginPath();c.ellipse(Math.cos(ang)*r,Math.sin(ang)*r*.7,3+j%4,2+j%3,ang,0,6.28);c.fill()}if(age<1.5){glow(0,0,45+age*24,'193,209,121',.12*(1-age/1.5));for(let j=0;j<26;j++){const ang=j*2.399+i,r=Math.min(age,.7)*(35+j%7*14);c.fillStyle=`rgba(203,217,142,${.55*Math.max(0,1-age/1.25)})`;c.beginPath();c.ellipse(Math.cos(ang)*r,Math.sin(ang)*r*.65+age*age*32,Math.max(1,4-age*2),2,ang,0,6.28);c.fill()}}c.restore()});
  ship(t);
  if(!reduced)for(let i=0;i<43;i++){const at=2.3+i*.73+Math.sin(i*2.3)*.16,age=t-at,a=age>=0&&age<.10?.44*(1-age/.10):age>.17&&age<.28?.26*(1-(age-.17)/.11):0;if(a){c.save();c.globalCompositeOperation='screen';glow([35,790,45,800,440][i%5],[40,80,540,570,220][i%5],i%7===0?1000:660,'189,240,207',a);c.restore()}}
  c.setTransform(1,0,0,1,0,0);if(t>=34){c.fillStyle=`rgba(0,0,0,${ease((t-34)/2)})`;c.fillRect(0,0,w,h)}
  root.ShipLastStandWeather?.(game,t,reduced);onTime?.(t);if(owner===canvas)raf=requestAnimationFrame(draw);
 }
 canvas.__standResume=()=>{if(owner===canvas&&raf===null)draw()};draw();
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(!document.hidden)owner?.__standResume?.()});
root.ShipLastStand={plan,route,position,mount,stop,shots:SHOTS,deaths:DEATHS};
if(typeof module!=='undefined')module.exports=root.ShipLastStand;
})(typeof window==='undefined'?globalThis:window);
