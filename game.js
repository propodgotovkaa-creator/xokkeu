import {WORDS,ORIGIN,GOALS,GOAL_Y,aimAt,flight,shuffled,lerp,clamp,stickPose,CONTACT_MS} from './model.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const game=$('#game'),puck=$('#puck'),stick=$('#stick-pivot'),aimLine=$('#aim'),trail=$('#trail');
let phase='loading', deck=[],index=0, aim=aimAt(840), desiredX=840,last=performance.now(), shot=null, effects=[],soundOn=true,helpOpen=false;
let touchPointer=null;
let audioContext;const buffers=new Map();let audioLoading;const activeAudio=new Set();
const audioNames=['hit','slide','post','goal','finish'];
function resize(){const scale=Math.min(innerWidth/1600,innerHeight/900);game.style.transform=`translate(-50%,-50%) scale(${scale})`;}
addEventListener('resize',resize);resize();
function setPuck(x,y,scale=1,rotation=0){puck.style.transform=`translate(${x-42}px,${y-29}px) scale(${scale})`;}
function showFeedback(text,error=false){$('#feedback').textContent=text;$('#feedback').classList.toggle('error',error);$('#feedback').classList.add('visible');}
function clearFeedback(){$('#feedback').classList.remove('visible');}
function syncControls(){const enabled=phase==='aiming'&&!helpOpen;puck.disabled=!enabled;$$('.goal').forEach(el=>el.disabled=!enabled);$('#help').disabled=phase==='windup'||phase==='flight'||phase==='return';}
async function unlockAudio(){try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();audioLoading??=Promise.all(audioNames.map(async name=>{const response=await fetch(`audio/${name}.wav`);if(!response.ok)throw Error('audio');buffers.set(name,await audioContext.decodeAudioData(await response.arrayBuffer()));}));await audioLoading;}catch{/* Audio failure must never block play. */}}
function play(name){if(!soundOn||!audioContext||!buffers.has(name))return;const source=audioContext.createBufferSource(),gain=audioContext.createGain();source.buffer=buffers.get(name);gain.gain.value=.45;source.connect(gain).connect(audioContext.destination);source.onended=()=>activeAudio.delete(source);activeAudio.add(source);source.start();}
$('#sound').onclick=()=>{soundOn=!soundOn;$('#sound').textContent=soundOn?'♪':'×';$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound').setAttribute('aria-label',soundOn?'Выключить звук':'Включить звук');if(!soundOn)for(const s of activeAudio)s.stop();else unlockAudio();};
function currentWord(){const word=deck[index];$('#word-image').src=`assets/${word.id}.webp`;$('#word-image').alt=word.word;$('#word').textContent=word.word;$('#score').innerHTML=`${index} <small>/ 13</small>`;$('#card').classList.remove('change');void $('#card').offsetWidth;$('#card').classList.add('change');clearFeedback();phase='aiming';shot=null;setPuck(ORIGIN.x,ORIGIN.y);syncControls();}
function start(){deck=shuffled();index=0;desiredX=840;aim=aimAt(840);$('#welcome').hidden=true;$('#finish').hidden=true;effects.forEach(e=>e.el.remove());effects=[];unlockAudio();currentWord();}
$('#start').onclick=start;$('#restart').onclick=start;
function openHelp(){if(!['aiming','ready','finished'].includes(phase))return;helpOpen=true;$('#help-overlay').hidden=false;syncControls();$('#close-help').focus();}
function closeHelp(){helpOpen=false;$('#help-overlay').hidden=true;syncControls();$('#help').focus();}
$('#help').onclick=openHelp;$('#close-help').onclick=closeHelp;
function point(e){const r=game.getBoundingClientRect();return {x:(e.clientX-r.left)*1600/r.width,y:(e.clientY-r.top)*900/r.height};}
function isIce(e){return !e.target.closest('footer,header,.word-card,.overlay');}
function pointerAim(e){if(phase!=='aiming'||helpOpen||!isIce(e))return;if(e.pointerType==='touch'&&e.pointerId!==touchPointer)return;const p=point(e);if(!e.target.closest('#puck'))desiredX=clamp(p.x,330,1350);}
game.addEventListener('pointermove',pointerAim);
game.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||phase!=='aiming'||helpOpen||!isIce(e))return;e.preventDefault();if(e.pointerType==='touch'){touchPointer=e.pointerId;game.setPointerCapture(e.pointerId);pointerAim(e);}else{pointerAim(e);shoot(true);}});
game.addEventListener('pointerup',e=>{if(e.pointerId===touchPointer){touchPointer=null;if(game.hasPointerCapture(e.pointerId))game.releasePointerCapture(e.pointerId);shoot(true);}});
game.addEventListener('pointercancel',()=>{touchPointer=null;});
// Native keyboard activation of the puck / goal remains accessible. Pointer
// clicks have already been handled on pointerdown and cannot trigger twice.
$$('.goal').forEach((el,i)=>el.onclick=e=>{if(e.detail===0&&phase==='aiming'&&!helpOpen){desiredX=GOALS[i];shoot(true);}});
puck.onclick=e=>{if(e.detail===0)shoot();};
let keys=new Set();addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key)){e.preventDefault();if(phase==='aiming'&&!helpOpen){if(e.key===' '&&!e.repeat)shoot();else keys.add(e.key);}}if(e.key==='Escape'&&helpOpen)closeHelp();});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>{keys.clear();touchPointer=null;});
function shoot(settle=false){if(phase!=='aiming'||helpOpen)return;unlockAudio();clearFeedback();const frozen=settle?aimAt(desiredX):{...aim};shot={aim:frozen,fromAngle:aim.angle,correct:frozen.inMouth&&frozen.goal===deck[index].category,bar:frozen.inMouth&&frozen.goal!==deck[index].category,start:performance.now(),stage:'windup'};phase='windup';syncControls();}
function particles(x,y,count=15,wide=false){const now=performance.now();for(let i=0;i<count;i++){const el=document.createElement('img');el.src='assets/spark.webp';el.className='particle';$('#particles').append(el);const angle=Math.random()*Math.PI*2;effects.push({el,x,y,vx:Math.cos(angle)*(wide?600:210),vy:Math.sin(angle)*(wide?370:190)-130,start:now,duration:wide?2500:1050,spin:Math.random()*240});}}
function impact(now){const s=shot;play(s.correct?'goal':'post');const target=$$('.goal')[s.aim.goal].querySelector('img');target.classList.remove('net-hit');void target.offsetWidth;target.classList.add('net-hit');if(s.correct){phase='celebrate';s.start=now;showFeedback('ГОЛ!');particles(s.aim.x,GOAL_Y-15);index++;$('#score').innerHTML=`${index} <small>/ 13</small>`;}else{phase='return';s.start=now;s.contact=flight(s.aim,1,s.bar);showFeedback(s.bar?'Звонкая штанга! Попробуй ещё.':'Чуть мимо! Прицелься в ворота.',true);}syncControls();}
function finish(){phase='finished';$('#finish').hidden=false;clearFeedback();$('#restart').focus();play('finish');particles(800,270,32,true);syncControls();}
function render(now){const dt=Math.min((now-last)/1000,.08);last=now;if(phase==='aiming'&&!helpOpen){if(keys.has('ArrowLeft'))desiredX-=dt*520;if(keys.has('ArrowRight'))desiredX+=dt*520;desiredX=clamp(desiredX,330,1350);aim=aimAt(lerp(aim.x,desiredX,1-Math.exp(-dt*14)));}
const active=shot?.aim||aim;const length=Math.hypot(active.x-ORIGIN.x,active.y-ORIGIN.y);aimLine.style.height=`${length}px`;aimLine.style.top=`${ORIGIN.y-length}px`;aimLine.style.transform=`rotate(${active.angle}rad)`;aimLine.style.opacity=phase==='aiming'&&!helpOpen?'.8':'0';$$('.goal').forEach((el,i)=>el.classList.toggle('selected',phase==='aiming'&&active.goal===i&&active.inMouth));let pose=stickPose('ready',0),stickAngle=active.angle;
if(phase==='windup'){const elapsed=now-shot.start;pose=stickPose('windup',elapsed);const align=clamp(elapsed/150,0,1);stickAngle=lerp(shot.fromAngle,active.angle,align*align*(3-2*align));if(elapsed>=CONTACT_MS){phase='flight';shot.start+=CONTACT_MS;aim={...active};play('hit');play('slide');}}
if(phase==='flight'){const elapsed=now-shot.start,t=clamp(elapsed/850,0,1);pose=stickPose('follow',elapsed);const p=flight(active,t,shot.bar);setPuck(p.x,p.y,p.scale);trail.style.left=`${p.x}px`;trail.style.top=`${p.groundY-10}px`;trail.style.transform=`rotate(${active.angle}rad) scale(${p.scale})`;trail.style.opacity=String((1-t)*.65);if(t===1)impact(now);}
else if(phase==='return'){const t=clamp((now-shot.start)/1000,0,1);const c=shot.contact;const u=1-Math.pow(1-t,1.6);const side=(active.x<840?1:-1)*65*Math.sin(t*Math.PI);setPuck(lerp(c.x,840,u)+side,lerp(c.y,730,u)-28*Math.sin(t*Math.PI),lerp(.43,1,u),260*(1-t));trail.style.opacity='0';if(t===1){phase='aiming';shot=null;syncControls();}}
else if(phase==='celebrate'){trail.style.opacity='0';if(now-shot.start>1250){if(index===deck.length)finish();else currentWord();}}
else if(phase==='aiming')setPuck(ORIGIN.x,ORIGIN.y);
const cos=Math.cos(stickAngle),sin=Math.sin(stickAngle);stick.style.transform=`translate(${pose.x*cos-pose.y*sin}px,${pose.x*sin+pose.y*cos}px) rotate(${stickAngle+pose.turn}rad)`;
effects=effects.filter(e=>{const t=(now-e.start)/1000;if(now-e.start>e.duration){e.el.remove();return false;}e.el.style.transform=`translate(${e.x+e.vx*t}px,${e.y+e.vy*t+160*t*t}px) rotate(${e.spin*t}deg)`;e.el.style.opacity=String(1-(now-e.start)/e.duration);return true;});requestAnimationFrame(render);}
requestAnimationFrame(render);
async function preload(){phase='loading';$('#retry').hidden=true;$('#start').disabled=true;const files=['arena','goal','stick','puck','trophy','spark',...WORDS.map(w=>w.id)];let done=0;try{await Promise.all(files.map(id=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{done++;$('#loading').textContent=`Иллюстрации: ${done} из ${files.length}`;resolve();};img.onerror=()=>reject(Error(id));img.src=`assets/${id}.webp`;})));phase='ready';$('#start').disabled=false;$('#start').textContent='НАЧАТЬ ИГРУ';$('#loading').textContent='13 слов · мышь или касание · без спешки';}catch{$('#loading').textContent='Не удалось загрузить картинки. Проверьте соединение.';$('#retry').hidden=false;}}
$('#retry').onclick=preload;preload();
// Read-only state for reproducible quality checks; no solution is rendered in UI.
Object.defineProperty(window,'hockeyState',{get:()=>({phase,index,word:deck[index]?.word,aim:{...aim},shot:shot?{...shot}:null})});
