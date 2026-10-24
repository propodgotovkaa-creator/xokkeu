export const WORDS = Object.freeze([
  {id:'coat',word:'шуба',category:0},{id:'mouse',word:'мышка',category:1},
  {id:'frog',word:'лягушка',category:1},{id:'hat',word:'шапка',category:0},
  {id:'baby',word:'малыш',category:2},{id:'shower',word:'душ',category:2},
  {id:'cherry',word:'вишня',category:1},{id:'chocolate',word:'шоколад',category:0},
  {id:'porridge',word:'каша',category:1},{id:'wardrobe',word:'шкаф',category:0},
  {id:'pencil',word:'карандаш',category:2},{id:'chess',word:'шахматы',category:0},
  {id:'ears',word:'уши',category:1}
]);
export const ORIGIN = {x:840,y:730};
export const GOALS = [450,840,1230];
export const GOAL_Y = 485;
export const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
export const lerp = (a,b,t)=>a+(b-a)*t;
export function shuffled(random=Math.random){const a=[...WORDS];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function aimAt(x){x=clamp(x,330,1350);const dx=x-ORIGIN.x,dy=GOAL_Y-ORIGIN.y;const goal=GOALS.reduce((best,g,i)=>Math.abs(g-x)<Math.abs(GOALS[best]-x)?i:best,0);return {x,y:GOAL_Y,angle:Math.atan2(dx,-dy),goal,inMouth:Math.abs(x-GOALS[goal])<=104};}
// All ground-plane motion uses the frozen aim ray. An unsuccessful shot rises
// into the crossbar; its ground projection never changes direction to hit a post.
export function flight(aim,t,high=false){const p=(4.2*t)/(1+3.2*t);const scale=lerp(1,.43,p);const ground={x:lerp(ORIGIN.x,aim.x,p),y:lerp(ORIGIN.y,aim.y,p)};const lift=high?260*t-110*t*t:0;return {...ground,groundY:ground.y,y:ground.y-lift,scale};}

// Blade-face coordinates relative to the puck. Positive Y is toward the player.
// The blade sweeps backwards, accelerates through contact, then follows through.
export const CONTACT_MS=340;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const blendPose=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),turn:lerp(a.turn,b.turn,t)});
const READY={x:12,y:28,turn:0}, BACK={x:95,y:115,turn:-.28}, CONTACT={x:0,y:20,turn:0}, THROUGH={x:-45,y:-35,turn:.24};
export function stickPose(stage,ms){if(stage==='windup'){if(ms<190)return blendPose(READY,BACK,smooth(ms/190));return blendPose(BACK,CONTACT,Math.pow(clamp((ms-190)/150,0,1),2));}if(stage==='follow'){if(ms<160)return blendPose(CONTACT,THROUGH,1-Math.pow(1-clamp(ms/160,0,1),3));return blendPose(THROUGH,READY,smooth((ms-160)/460));}return {...READY};}
