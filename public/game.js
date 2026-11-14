(() => {
'use strict';
const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const keys = new Set();
let W=0,H=0,dpr=1,images=[],fish=[],bubbles=[],plants=[],particles=[];
let state='menu', player, eaten=0, best=0, elapsed=0, spawnClock=0, last=0, bgTime=0;
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
try {best=Number(localStorage.getItem('peixito-best'))||0;}catch{}
$('best').textContent=best;
function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);makeDecor();if(player){player.x=clamp(player.x,35,W-35);player.y=clamp(player.y,100,H-40);}}
function makeDecor(){plants=Array.from({length:Math.ceil(W/60)},(_,i)=>({x:i*65+rand(-25,25),h:rand(30,100),phase:rand(0,7),tone:Math.random()}));bubbles=Array.from({length:Math.max(28,Math.floor(W*H/20000))},()=>({x:rand(0,W),y:rand(0,H),r:rand(1,4),speed:rand(10,32),phase:rand(0,7)}));}
addEventListener('resize',resize);resize();
const manifest=fetch('fish.json').then(r=>r.json()).then(names=>Promise.all(names.map(src=>new Promise(resolve=>{let im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src='assets/fish/'+src;})))).then(a=>{images=a.filter(Boolean);});
function pickImage(){return images[Math.floor(Math.random()*images.length)]||null;}
function reset(){player={x:W*.45,y:H*.5,size:10,vx:0,vy:0,dir:1,img:images[0]||null,invuln:0};fish=[];particles=[];eaten=0;elapsed=0;spawnClock=0;for(let i=0;i<Math.min(18,Math.floor(W/65)+7);i++)spawn(true);updateHud();}
function updateHud(){$('size').textContent=player.size;$('eaten').textContent=eaten;$('best').textContent=best;}
function spawn(initial=false){if(!player||fish.length>=Math.min(48,Math.max(20,Math.floor(W/30))))return;
 const smaller=Math.random()<.58;
 let size=smaller?Math.max(1,Math.round(player.size*rand(.20,.90))):Math.round(player.size*rand(1.12,2.35));
 size=Math.max(1,size);
 const side=Math.random()<.5?-1:1;
 const speed=rand(34,83)*(1+Math.min(elapsed/200,1));
 const x=initial?rand(0,W):(side<0?-90:W+90);
 const y=rand(105,Math.max(125,H-65));
 fish.push({x,y,size,img:pickImage(),dir:side<0?1:-1,vx:(side<0?1:-1)*speed,vy:rand(-8,8),wave:rand(0,7),phase:rand(0,7)});
}
function radius(size){return clamp(18+Math.sqrt(size)*5.8,22,104);}
function drawFish(f,isPlayer=false){const r=radius(f.size), w=r*2.05,h=r*1.75;
 ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.dir,1);
 if(f.img){ctx.imageSmoothingEnabled=false;ctx.drawImage(f.img,-w/2,-h/2,w,h);}else{ctx.fillStyle=isPlayer?'#ffe188':'#f4a9ac';ctx.beginPath();ctx.ellipse(0,0,r*.8,r*.45,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-r*.65,0);ctx.lineTo(-r*1.2,-r*.5);ctx.lineTo(-r*1.2,r*.5);ctx.fill();}
 ctx.restore();
 const good=isPlayer?null:f.size<player.size;
 const color=isPlayer?'#ffe887':good?'#8afbc1':'#ff9da0';
 ctx.font=`900 ${isPlayer?17:14}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
 const tx=f.x,ty=f.y-h*.44-13;
 const text=String(f.size), tw=ctx.measureText(text).width;
 ctx.fillStyle='#06283ee0';roundRect(tx-tw/2-10,ty-12,tw+20,24,9);ctx.fill();
 ctx.strokeStyle=isPlayer?'#ffe88780':good?'#70efaa70':'#ff858570';ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle=color;ctx.fillText(text,tx,ty+1);
 if(isPlayer){ctx.fillStyle='#fff';ctx.font='bold 10px system-ui';ctx.fillText('VOCÊ',f.x,ty-24);}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function splash(x,y,color){for(let i=0;i<12;i++){const a=rand(0,Math.PI*2),s=rand(25,120);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.3,.7),max:.7,color});}}
function update(dt){bgTime+=dt;for(const b of bubbles){b.y-=b.speed*dt;b.x+=Math.sin(bgTime+b.phase)*6*dt;if(b.y<-10){b.y=H+10;b.x=rand(0,W);}}
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
 if(state!=='playing')return;
 elapsed+=dt;spawnClock+=dt;if(spawnClock>.55){spawnClock=0;spawn();}
 let ax=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 let ay=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 const len=Math.hypot(ax,ay)||1;ax/=len;ay/=len;
 const speed=clamp(270-Math.sqrt(player.size)*3.5,135,260);
 const easing=Math.min(1,dt*9);
 player.vx+=(ax*speed-player.vx)*easing;player.vy+=(ay*speed-player.vy)*easing;
 player.x=clamp(player.x+player.vx*dt,22,W-22);player.y=clamp(player.y+player.vy*dt,96,H-35);
 if(ax!==0)player.dir=ax>0?1:-1;
 for(const f of fish){f.wave+=dt*2;f.x+=f.vx*dt;f.y+=Math.sin(f.wave+f.phase)*8*dt;}
 fish=fish.filter(f=>f.x>-160&&f.x<W+160);
 const pr=radius(player.size)*.49;
 for(let i=fish.length-1;i>=0;i--){const f=fish[i];const fr=radius(f.size)*.48;
 if(Math.hypot(player.x-f.x,player.y-f.y)<(pr+fr)*.78){
 if(f.size<player.size){fish.splice(i,1);eaten++;player.size+=Math.max(1,Math.round(f.size*.20));splash(f.x,f.y,'#a7ffe1');if(eaten>best){best=eaten;try{localStorage.setItem('peixito-best',best);}catch{}}updateHud();}
 else{state='dead';splash(player.x,player.y,'#ffb3a1');show('FIM DE JOGO',`Você comeu ${eaten} peixes e chegou ao tamanho ${player.size}. Tente novamente!`,'↻ JOGAR NOVAMENTE');break;}
 }}
}
function background(){const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#0a6685');sky.addColorStop(.5,'#08617d');sky.addColorStop(1,'#06354f');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#b8faff0b';for(let i=0;i<7;i++){const x=(i+.5)*W/7+Math.sin(bgTime*.2+i)*35;ctx.beginPath();ctx.moveTo(x-25,0);ctx.lineTo(x+35,0);ctx.lineTo(x+140,H);ctx.lineTo(x+10,H);ctx.fill();}
 for(const b of bubbles){ctx.strokeStyle='#c8faff35';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle='#0a4d59';ctx.beginPath();ctx.moveTo(0,H-45);for(let x=0;x<=W+20;x+=20)ctx.lineTo(x,H-44+Math.sin(x*.025)*8);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
 for(const p of plants){const x=p.x,y=H-35;ctx.strokeStyle=p.tone>.5?'#167c70':'#15918a';ctx.lineWidth=5;ctx.lineCap='round';for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.sin(bgTime*.8+p.phase+k)*18,y-p.h*.5,x+(k-1)*12+Math.sin(bgTime*.8+p.phase)*12,y-p.h*(.7+k*.15));ctx.stroke();}}
 ctx.fillStyle='#b59a6870';for(let x=0;x<W;x+=80){ctx.beginPath();ctx.ellipse(x+Math.sin(x)*12,H-12,randStatic(x,15,35),7,0,0,Math.PI*2);ctx.fill();}
}
function randStatic(seed,a,b){return a+(Math.abs(Math.sin(seed*12.9898))*10000%1)*(b-a);}
function render(){ctx.clearRect(0,0,W,H);background();const order=[...fish].sort((a,b)=>a.size-b.size);for(const f of order)drawFish(f);if(player&&state!=='dead')drawFish(player,true);for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,randStatic(p.x+p.y,2,5),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}}
function loop(now){const dt=Math.min((now-last)/1000||0,.045);last=now;update(dt);render();requestAnimationFrame(loop);}
function show(title,message,button){$('heading').textContent=title;$('message').textContent=message;$('play').textContent=button;$('overlay').classList.remove('hidden');}
function start(){reset();state='playing';$('overlay').classList.add('hidden');}
function togglePause(){if(state==='playing'){state='paused';show('PAUSADO','O oceano está esperando por você.','▶ CONTINUAR');}else if(state==='paused'){state='playing';$('overlay').classList.add('hidden');}}
$('play').addEventListener('click',()=>{if(state==='paused')togglePause();else start();});$('pause').addEventListener('click',togglePause);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys.add(k);if(k==='p'&&!e.repeat)togglePause();if(k==='enter'&&state==='menu')start();});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
manifest.then(()=>{player={x:W*.45,y:H*.52,size:10,dir:1,img:images[0]};for(let i=0;i<15;i++)spawn(true);}).catch(()=>{show('ERRO AO CARREGAR','Não foi possível carregar os sprites dos peixes. Confira a pasta assets/fish.','TENTAR NOVAMENTE');});
requestAnimationFrame(loop);
})();