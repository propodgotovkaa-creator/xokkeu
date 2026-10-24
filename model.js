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
export function flight(aim,t,high=false){const p=1-Math.pow(1-t,1.65);const scale=lerp(1,.43,p);const ground={x:lerp(ORIGIN.x,aim.x,p),y:lerp(ORIGIN.y,aim.y,p)};const lift=high?150*Math.sin(t*Math.PI/2):9*Math.sin(t*Math.PI);return {...ground,groundY:ground.y,y:ground.y-lift,scale};}
