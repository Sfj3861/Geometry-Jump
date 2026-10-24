"use strict";
(() => {
  // Original Canvas engine; no official GD assets, level files, or music are bundled.
  const c=document.getElementById("game"),g=c.getContext("2d",{alpha:false});
  const W=960,H=540,FLOOR=430,CEIL=54,STEP=1/60,VERSION="0.5.1";
  const C={ink:"#142636",text:"#f7f4df",muted:"#a8bbc3",green:"#75d15d",yellow:"#f1d56a",blue:"#6cb8d0",pink:"#df8fba",red:"#d9756d",grid:"rgba(230,242,239,.055)"};
  let scale=1,ox=0,oy=0,dpr=1,state="menu",screen="main",selected=0,buttons=[],practice=false,muted=false,hitboxes=false;
  let levelIndex=0,level=null,world=[],finishX=0,camera=0,elapsed=0,acc=0,last=0,attempt=0,deaths=0,particles=[],held=false,pressed=false,shake=0,audio=null,toast="",toastUntil=0,checkpointX=180,practiceRespawn=false;
  let save={unlocked:1,completed:[],best:{},attempts:{}};
  try{save=Object.assign(save,JSON.parse(localStorage.getItem("gj-save-v2")||"{}"));}catch(_){}
  const LEVELS=[
    ["First Steps",195,["s","s","d","b","g","s","d","b","s","g","s","d"]],
    ["Bright Circuit",155,["s","d","s","b","g","s","o","d","g","b","s","d","s"]],
    ["Gravity Lane",205,["s","b","g","s","bluePad","d","s","blueOrb","g","s","b","bluePad","s","d"]],
    ["Mirror Hall",35,["s","d","mirror","s","b","g","d","s","mirror","s","g","b","d"]],
    ["Orbital",275,["s","ball","s","g","b","s","ball","g","d","s","ball","b","g","s"]],
    ["Updraft",185,["s","ship","s","ceil","s","ceil","g","s","ceil","s","cube","d","g","s"]],
    ["Skybound",215,["s","ufo","s","g","ufo","d","s","b","g","ufo","s","d","cube","s"]],
    ["Pink Pulse",325,["s","pinkPad","d","s","pinkOrb","g","b","s","pinkOrb","d","pinkPad","g","s","d"]],
    ["Scale Shift",245,["s","mini","d","s","g","s","big","b","d","g","mini","s","big","d"]],
    ["Overdrive",40,["d","s","bluePad","g","ship","ceil","s","cube","mirror","d","ball","g","blueOrb","ufo","s"]],
    ["Theory Path",300,["s","d","g","pinkOrb","b","mirror","s","ball","g","bluePad","d","ship","ceil","cube","s"]],
    ["Final Dimension",345,["d","s","bluePad","g","ball","d","pinkOrb","mirror","s","ship","ceil","cube","mini","d","ufo","g","blueOrb","s","big","pinkPad","d"]]
  ].map(([name,hue,pattern])=>({name,hue,pattern}));
  const P={x:180,y:FLOOR-34,size:34,vy:0,rot:0,mode:"cube",gravity:1,mirror:false,grounded:true,mini:false};
  function persist(){try{localStorage.setItem("gj-save-v2",JSON.stringify(save));}catch(_){}}
  function resize(){dpr=Math.min(devicePixelRatio||1,2);c.width=Math.round(innerWidth*dpr);c.height=Math.round(innerHeight*dpr);scale=Math.min(innerWidth/W,innerHeight/H);ox=(innerWidth-W*scale)/2;oy=(innerHeight-H*scale)/2;}
  addEventListener("resize",resize,{passive:true});resize();
  function sound(f,d=.08,type="square",v=.04){if(muted)return;try{audio=audio||(new(window.AudioContext||window.webkitAudioContext)());if(audio.state==="suspended")audio.resume();const o=audio.createOscillator(),a=audio.createGain();o.type=type;o.frequency.value=f;a.gain.setValueAtTime(v,audio.currentTime);a.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(a);a.connect(audio.destination);o.start();o.stop(audio.currentTime+d);}catch(_){}}
  function toastMsg(s){toast=s;toastUntil=performance.now()+1500;}
  function build(def){let x=570,out=[];const add=(type,props={})=>out.push(Object.assign({type,x,used:false},props));for(const t of def.pattern){switch(t){
    case"s":add("spike");x+=245;break;case"d":add("spike");add("spike",{x:x+38});x+=320;break;
    case"b":add("block",{w:48,h:48});x+=265;break;case"g":add("gap",{w:92});x+=330;break;
    case"o":add("orb",{y:FLOOR-122,color:C.blue,impulse:-13.8});x+=290;break;
    case"blueOrb":add("orb",{y:FLOOR-142,color:C.blue,impulse:-14.2});x+=315;break;
    case"pinkOrb":add("orb",{y:FLOOR-150,color:C.pink,impulse:-16});x+=325;break;
    case"bluePad":add("pad",{color:C.blue,impulse:-17.2});x+=265;break;case"pinkPad":add("pad",{color:C.pink,impulse:-19});x+=275;break;
    case"ceil":add("ceilingSpike",{y:CEIL+30});x+=230;break;
    case"ship":add("portal",{mode:"ship",color:C.blue});x+=125;break;case"cube":add("portal",{mode:"cube",color:C.green});x+=125;break;
    case"ball":add("portal",{mode:"ball",color:C.yellow});x+=125;break;case"ufo":add("portal",{mode:"ufo",color:C.pink});x+=125;break;
    case"mirror":add("portal",{mode:"mirror",color:"#c5a4e8"});x+=125;break;case"mini":add("portal",{mode:"mini",color:C.yellow});x+=125;break;case"big":add("portal",{mode:"big",color:C.green});x+=125;break;
  }}finishX=x+180;out.push({type:"finish",x:finishX});return out.sort((a,b)=>a.x-b.x);}
  function reset(){P.x=180;P.y=FLOOR-P.size;P.vy=0;P.rot=0;P.mode="cube";P.gravity=1;P.mirror=false;P.grounded=true;P.mini=false;P.size=34;camera=0;checkpointX=180;practiceRespawn=false;particles=[];held=false;pressed=false;}
  function start(i){if(i>=save.unlocked){toastMsg("Complete the previous level first");return;}levelIndex=i;level=LEVELS[i];world=build(level);attempt=0;deaths=0;elapsed=0;screen="game";state="playing";retry();sound(420,.06,"sine",.025);}
  function retry(){state="playing";attempt++;save.attempts[levelIndex]=(save.attempts[levelIndex]||0)+1;world.forEach(o=>o.used=false);reset();persist();}
  function progress(){return level?Math.min(100,Math.floor(P.x/finishX*100)):0;}
  function emit(x,y,color,n=7){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5-1,life:.45+Math.random()*.35,color,size:2+Math.random()*3});}
  function die(){if(state!=="playing"||practiceRespawn)return;deaths++;shake=8;sound(150,.22,"sawtooth",.06);emit(P.x+P.size/2,P.y+P.size/2,C.red,18);save.best[levelIndex]=Math.max(save.best[levelIndex]||0,progress());persist();if(practice){practiceRespawn=true;P.x=checkpointX;P.size=P.mini?24:34;P.y=FLOOR-P.size;P.vy=0;P.mode="cube";P.gravity=1;P.mirror=false;P.grounded=true;camera=Math.max(0,P.x-245);for(const o of world)if(o.x>=checkpointX)o.used=false;toastMsg("Practice checkpoint");return;}state="dead";}
  function win(){state="complete";sound(523,.18,"sine");if(!save.completed.includes(levelIndex))save.completed.push(levelIndex);save.unlocked=Math.min(LEVELS.length,Math.max(save.unlocked,levelIndex+2));save.best[levelIndex]=100;persist();}
  function gapAt(x){return world.some(o=>o.type==="gap"&&x>=o.x-4&&x<=o.x+o.w);}
  function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function update(dt){
    practiceRespawn=false;elapsed+=dt;const size=P.size,prev=P.x;P.x+=(P.mode==="ship"?5.7:5.45)*dt*60;camera=Math.max(0,P.x-245);
    const just=pressed;
    for(const o of world){if(o.used)continue;
      if(o.type==="portal"&&Math.abs(P.x+size/2-o.x-14)<8){o.used=true;if(o.mode==="mirror")P.mirror=!P.mirror;else if(o.mode==="mini"){P.mini=true;P.size=24;}else if(o.mode==="big"){P.mini=false;P.size=34;}else{P.mode=o.mode;if(o.mode!=="ball")P.gravity=1;if(o.mode==="ship"){P.y=Math.min(P.y,FLOOR-P.size-58);P.vy=-2.2;}}emit(o.x,FLOOR-65,o.color,8);sound(680,.08,"sine",.035);}
      if(o.type==="pad"&&P.x+size>o.x&&P.x<o.x+24&&P.gravity===1){o.used=true;P.vy=o.impulse;P.grounded=false;sound(850,.1,"sine");emit(o.x,FLOOR-8,o.color);}
      if(o.type==="orb"&&just&&Math.hypot(P.x+size/2-o.x,P.y+size/2-o.y)<56){o.used=true;P.vy=o.impulse;P.gravity=1;P.grounded=false;sound(900,.12,"sine");emit(o.x,o.y,o.color,10);}
    }
    if(just){if(P.mode==="cube"&&P.grounded){P.vy=-11.4*P.gravity;P.grounded=false;sound(510);}else if(P.mode==="ufo"){P.vy=-9.6*P.gravity;P.grounded=false;sound(570);}else if(P.mode==="ball"){P.gravity*=-1;P.grounded=false;P.vy=4.4*P.gravity;sound(760,.09,"sine");}}
    if(P.mode==="ship"){P.vy+=.43*P.gravity*dt*60;if(held)P.vy-=.88*P.gravity*dt*60;P.vy=Math.max(-7.4,Math.min(7.4,P.vy));}
    else{P.vy+= (P.mode==="ball"?.55:P.mode==="ufo"?.56:.62)*P.gravity*dt*60;P.vy=Math.max(-13,Math.min(13,P.vy));}
    P.y+=P.vy*dt*60;if(P.mode==="cube"||P.mode==="ufo")P.rot+=P.grounded?0:.11*Math.sign(P.vy||1);else if(P.mode==="ball")P.rot+=.12*P.gravity;
    const gap=gapAt(P.x+size/2);
    if(P.gravity>0&&!gap&&P.y+size>=FLOOR){P.y=FLOOR-size;P.vy=0;P.grounded=true;}else if(P.gravity<0&&P.y<=CEIL){P.y=CEIL;P.vy=0;P.grounded=true;}else P.grounded=false;
    if(P.mode==="ship"&&(P.y<CEIL||P.y+P.size>FLOOR))die();
    if(gap&&P.y+P.size>FLOOR+2)die();if(P.y>H+40||P.y+P.size< -40)die();
    if(practice&&P.grounded&&P.mode==="cube"&&P.x-checkpointX>=900){checkpointX=Math.floor(P.x/900)*900;toastMsg("Checkpoint saved");}
    const body={x:P.x+5,y:P.y+4,w:P.size-10,h:P.size-8};
    for(const o of world){if(o.type==="spike"&&overlap(body,{x:o.x+7,y:FLOOR-28,w:22,h:28}))die();if(o.type==="ceilingSpike"&&P.mode==="ship"&&overlap(body,{x:o.x+6,y:o.y,w:24,h:28}))die();if(o.type==="block"&&overlap(body,{x:o.x,y:FLOOR-o.h,w:o.w,h:o.h}))die();}
    if(practiceRespawn){pressed=false;return;}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
    if(state==="playing"&&P.x>=finishX)win();if(P.x>prev&&Math.floor(P.x/100)!==Math.floor(prev/100)&&Math.floor(P.x/100)%4===0)emit(P.x,P.y+size/2,C.green,1);
    pressed=false;
  }
  function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();}
  function cube(x,y,s,a=0,color=C.green){g.save();g.translate(x+s/2,y+s/2);g.rotate(a);g.fillStyle=color;g.strokeStyle=C.ink;g.lineWidth=3;g.fillRect(-s/2,-s/2,s,s);g.strokeRect(-s/2,-s/2,s,s);g.fillStyle=C.text;g.fillRect(-s*.28,-s*.22,s*.2,s*.22);g.fillRect(s*.08,-s*.22,s*.2,s*.22);g.fillStyle=C.ink;g.fillRect(-s*.22,-s*.15,s*.08,s*.12);g.fillRect(s*.14,-s*.15,s*.08,s*.12);g.fillStyle="#2d7541";g.fillRect(-s*.23,s*.19,s*.46,Math.max(3,s*.1));g.restore();}
  function spike(x,y,color=C.yellow,ceiling=false){g.fillStyle=color;g.strokeStyle=C.ink;g.lineWidth=2.5;g.beginPath();if(ceiling){g.moveTo(x,y);g.lineTo(x+18,y+28);g.lineTo(x+36,y);}else{g.moveTo(x,y);g.lineTo(x+18,y-30);g.lineTo(x+36,y);}g.closePath();g.fill();g.stroke();}
  function playerDraw(){const x=P.x-camera,y=P.y,s=P.size;if(P.mode==="ball"){g.save();g.translate(x+s/2,y+s/2);g.rotate(P.rot);g.fillStyle=C.yellow;g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.arc(0,0,s/2,0,Math.PI*2);g.fill();g.stroke();g.beginPath();g.moveTo(-s*.3,0);g.lineTo(s*.3,0);g.moveTo(0,-s*.3);g.lineTo(0,s*.3);g.stroke();g.restore();}else if(P.mode==="ship"){g.save();g.translate(x+s/2,y+s/2);g.rotate(Math.max(-.45,Math.min(.45,P.vy*.06)));g.fillStyle=C.blue;g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.moveTo(-s*.52,-s*.22);g.lineTo(s*.15,-s*.5);g.lineTo(s*.52,0);g.lineTo(s*.15,s*.5);g.lineTo(-s*.52,s*.22);g.closePath();g.fill();g.stroke();g.fillStyle=C.text;g.fillRect(-s*.08,-s*.12,s*.22,s*.24);g.restore();}else if(P.mode==="ufo"){g.fillStyle=C.pink;g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.ellipse(x+s/2,y+s*.56,s*.52,s*.31,0,0,Math.PI*2);g.fill();g.stroke();g.fillStyle=C.text;g.beginPath();g.arc(x+s*.5,y+s*.24,s*.22,Math.PI,0);g.fill();g.stroke();}else cube(x,y,s,P.rot);}
  function worldDraw(){
    const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,"hsl("+level.hue+",27%,25%)");sky.addColorStop(1,"hsl("+level.hue+",35%,13%)");g.fillStyle=sky;g.fillRect(0,0,W,H);
    g.strokeStyle=C.grid;g.lineWidth=1;for(let x=-(camera*.28%48);x<W;x+=48){g.beginPath();g.moveTo(x,0);g.lineTo(x,FLOOR);g.stroke();}for(let y=30;y<FLOOR;y+=48){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
    for(let i=0;i<20;i++){let x=((i*87-camera*.15)%1100+1100)%1100-60,h=30+i*37%95;g.fillStyle="rgba(5,18,29,.2)";g.fillRect(x,FLOOR-h,42,h);}
    g.fillStyle="#172b3c";g.fillRect(0,FLOOR,W,H-FLOOR);g.fillStyle=C.green;g.fillRect(0,FLOOR,W,5);g.fillStyle="#172b3c";g.fillRect(0,CEIL-8,W,8);g.fillStyle="rgba(117,209,93,.55)";g.fillRect(0,CEIL-8,W,2);
    g.save();if(P.mirror){g.translate(W,0);g.scale(-1,1);}
    for(const o of world){const x=o.x-camera;if(x< -80||x>W+80)continue;
      if(o.type==="spike")spike(x,FLOOR);else if(o.type==="ceilingSpike")spike(x,o.y,"#d6b2e8",true);
      else if(o.type==="block"){g.fillStyle="#6aa5b5";g.strokeStyle=C.ink;g.lineWidth=3;g.fillRect(x,FLOOR-o.h,o.w,o.h);g.strokeRect(x,FLOOR-o.h,o.w,o.h);g.fillStyle="rgba(255,255,255,.22)";g.fillRect(x+5,FLOOR-o.h+5,o.w-10,5);}
      else if(o.type==="gap"){g.fillStyle="#091725";g.fillRect(x,FLOOR,o.w,H-FLOOR);g.fillStyle=C.yellow;g.fillRect(x,FLOOR,o.w,4);}
      else if(o.type==="orb"){g.save();g.globalAlpha=o.used?.24:1;g.strokeStyle=o.color;g.lineWidth=5;g.beginPath();g.arc(x,o.y,13,0,Math.PI*2);g.stroke();g.fillStyle=o.color;g.globalAlpha=o.used?.08:.22;g.beginPath();g.arc(x,o.y,9,0,Math.PI*2);g.fill();g.restore();}
      else if(o.type==="pad"){g.fillStyle=o.color;g.strokeStyle=C.ink;g.lineWidth=2.5;g.beginPath();g.moveTo(x,FLOOR-2);g.lineTo(x+4,FLOOR-15);g.lineTo(x+21,FLOOR-15);g.lineTo(x+25,FLOOR-2);g.closePath();g.fill();g.stroke();}
      else if(o.type==="portal"){g.save();g.globalAlpha=o.used?.25:1;g.strokeStyle=o.color;g.lineWidth=6;g.beginPath();g.ellipse(x+13,FLOOR-48,13,35,0,0,Math.PI*2);g.stroke();g.restore();g.fillStyle=C.text;g.font="bold 10px system-ui";g.textAlign="center";g.fillText(o.mode.toUpperCase(),x+13,FLOOR-95);}
      else if(o.type==="finish"){g.fillStyle=C.green;g.fillRect(x,FLOOR-125,5,125);for(let j=0;j<5;j++){g.fillStyle=j%2?C.text:C.green;g.fillRect(x+5,FLOOR-125+j*20,24,20);}}
    }
    playerDraw();if(hitboxes){g.strokeStyle="#ff4433";g.strokeRect(P.x-camera+5,P.y+4,P.size-10,P.size-8);}g.restore();
    for(const p of particles){g.globalAlpha=Math.max(0,p.life);g.fillStyle=p.color;g.fillRect(p.x-camera,p.y,p.size,p.size);}g.globalAlpha=1;
  }
  function button(x,y,w,h,label,action,color="blue",sel=false){const colors={green:["#75d15d","#397f4c"],blue:["#6caec6","#345f78"],red:["#d9756d","#793f4a"],yellow:["#f1d56a","#92763d"],gray:["#506b7d","#273e50"]},a=colors[color]||colors.blue;g.fillStyle="#0d2030";rr(x,y+5,w,h,8);g.fill();g.fillStyle=sel?C.yellow:a[0];rr(x,y,w,h,8);g.fill();g.strokeStyle=C.ink;g.lineWidth=3;rr(x,y,w,h,8);g.stroke();g.fillStyle=sel?C.ink:C.text;g.font="900 "+Math.min(21,h*.36)+"px Trebuchet MS,system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(label,x+w/2,y+h/2-1,w-16);buttons.push({x,y,w,h,action});}
  function bg(){const a=g.createLinearGradient(0,0,0,H);a.addColorStop(0,"#304d62");a.addColorStop(1,"#172d42");g.fillStyle=a;g.fillRect(0,0,W,H);g.strokeStyle=C.grid;for(let x=0;x<W;x+=48){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}for(let y=0;y<H;y+=48){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}g.fillStyle="rgba(7,20,32,.28)";for(let x=-10;x<W;x+=64)g.fillRect(x,H-30-(x%2?10:0),46,40);}
  function title(){cube(W/2-26,36,52);g.textAlign="center";g.textBaseline="alphabetic";g.font="900 42px Trebuchet MS,system-ui";g.lineWidth=4;g.strokeStyle=C.ink;g.strokeText("GEOMETRY JUMP",W/2,125);g.fillStyle=C.text;g.fillText("GEOMETRY JUMP",W/2,125);g.fillStyle=C.green;g.font="bold 13px system-ui";g.fillText("VERSION "+VERSION+"  •  RHYTHM PLATFORMER",W/2,149);}
  function menuMain(){bg();title();buttons=[];button(345,190,270,58,"PLAY",()=>{screen="levels";selected=0;},"green",true);button(345,266,130,46,practice?"PRACTICE ON":"PRACTICE OFF",()=>{practice=!practice;toastMsg(practice?"Practice mode on":"Practice mode off");});button(485,266,130,46,muted?"SOUND OFF":"SOUND ON",()=>{muted=!muted;toastMsg(muted?"Sound off":"Sound on");});button(345,329,270,42,"OPTIONS",()=>screen="options","gray");button(345,383,270,42,"CREDITS",()=>screen="credits","gray");g.fillStyle=C.muted;g.font="13px system-ui";g.textAlign="center";g.fillText("SPACE / ↑ / W / TAP TO JUMP   •   P PAUSE   •   R RETRY",W/2,485);g.fillText("Original visuals and generated sound • Not affiliated with RobTop Games",W/2,508);}
  function menuLevels(){bg();buttons=[];g.textAlign="center";g.fillStyle=C.text;g.font="900 32px Trebuchet MS,system-ui";g.fillText("SELECT LEVEL",W/2,55);g.fillStyle=C.muted;g.font="13px system-ui";g.fillText("Complete a level to unlock the next one",W/2,79);const cols=4,bw=196,bh=93,gap=18,sx=84,sy=112;LEVELS.forEach((lv,i)=>{const x=sx+i%cols*(bw+gap),y=sy+Math.floor(i/cols)*(bh+gap),open=i<save.unlocked,done=save.completed.includes(i),best=save.best[i]||0;g.fillStyle="#0d2030";rr(x,y+4,bw,bh,8);g.fill();g.fillStyle=!open?"#344a59":done?C.green:i===selected?C.yellow:["#568da4","#6b9c8c","#9c7da4"][Math.floor(i/4)%3];rr(x,y,bw,bh,8);g.fill();g.strokeStyle=C.ink;g.lineWidth=3;rr(x,y,bw,bh,8);g.stroke();g.fillStyle=open?(i===selected?C.ink:C.text):"#82929a";g.font="900 17px Trebuchet MS,system-ui";g.fillText(open?(i+1)+". "+lv.name:"LOCKED  "+(i+1),x+bw/2,y+31,bw-14);g.font="12px system-ui";g.fillText(open?["Jump and learn","Keep the rhythm","Blue orbs and pads","Mirror sections","Flip gravity","Hold to fly","UFO impulses","Pink impulses","Mini and big"][i%9]:"Locked",x+bw/2,y+52,bw-14);g.font="bold 12px system-ui";g.fillText(done?"COMPLETE":"BEST  "+best+"%",x+bw/2,y+75);buttons.push({x,y,w:bw,h:bh,action:()=>open?start(i):toastMsg("Complete the previous level first")});});button(365,478,230,38,"BACK",()=>screen="main","red");button(365,432,230,34,"PLAY SELECTED",()=>start(selected),"green",true);}
  function menuInfo(which){bg();buttons=[];g.textAlign="center";g.fillStyle=C.text;g.font="900 34px Trebuchet MS,system-ui";g.fillText(which==="options"?"OPTIONS":"CREDITS",W/2,88);g.fillStyle=C.muted;g.font="15px system-ui";const lines=which==="options"?["Jump / fly: Space, ↑, W, mouse or touch","Pause: P   Retry: R   Sound: M   Hitboxes: H","Progress and best percentages save on this device.","Practice mode is available from the main menu."]:["An original fan-made rhythm platformer.","Broadly inspired by early-era gameplay mechanics.","Visuals and sound effects are generated in this project.","No official level layouts, sprites or songs are included.","Not affiliated with RobTop Games."];lines.forEach((s,i)=>g.fillText(s,W/2,145+i*30));button(365,385,230,45,"BACK",()=>screen="main","red");}
  function hud(){g.fillStyle="rgba(10,25,38,.72)";rr(18,15,240,48,8);g.fill();g.fillStyle=C.text;g.font="bold 15px system-ui";g.textAlign="left";g.fillText((levelIndex+1)+". "+level.name,31,35);g.fillStyle=C.muted;g.font="12px system-ui";g.fillText("ATTEMPT "+attempt+"  •  "+(practice?"PRACTICE":"NORMAL"),31,52);g.fillStyle="rgba(10,25,38,.75)";rr(315,20,330,15,7);g.fill();g.fillStyle=C.green;rr(318,23,324*progress()/100,9,4);g.fill();g.fillStyle=C.text;g.font="bold 12px system-ui";g.textAlign="center";g.fillText(progress()+"%",480,54);g.fillStyle="rgba(10,25,38,.75)";rr(878,15,64,42,8);g.fill();g.fillStyle=C.text;g.font="bold 13px system-ui";g.fillText("Ⅱ",910,41);g.fillStyle="rgba(10,25,38,.75)";rr(18,73,72,31,7);g.fill();g.fillStyle=C.text;g.fillText("MENU",54,93);}
  function overlay(head,sub,buttonsFn){g.fillStyle="rgba(7,17,27,.78)";g.fillRect(0,0,W,H);g.textAlign="center";g.fillStyle=C.text;g.font="900 42px Trebuchet MS,system-ui";g.fillText(head,W/2,185);g.fillStyle=C.muted;g.font="16px system-ui";g.fillText(sub,W/2,216);buttons=[];buttonsFn();}
  function draw(){g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle="#101f2c";g.fillRect(0,0,c.width/dpr,c.height/dpr);g.setTransform(dpr*scale,0,0,dpr*scale,dpr*ox,dpr*oy);
    if(state==="menu"&&screen==="main")menuMain();else if(state==="menu"&&screen==="levels")menuLevels();else if(state==="menu")menuInfo(screen);else{worldDraw();hud();if(state==="paused")overlay("PAUSED","Take a breather.",()=>{button(350,255,260,48,"RESUME",()=>state="playing","green");button(350,320,260,44,"LEVEL SELECT",()=>{state="menu";screen="levels";},"blue");});if(state==="dead")overlay("TRY AGAIN",progress()+"%  •  Attempt "+attempt,()=>{button(350,255,260,48,"RETRY",retry,"green");button(350,320,260,44,"LEVEL SELECT",()=>{state="menu";screen="levels";},"blue");});if(state==="complete")overlay("LEVEL COMPLETE!",level.name+"  •  "+attempt+" attempts",()=>{button(350,255,260,48,"NEXT LEVEL",()=>{if(levelIndex===LEVELS.length-1){state="menu";screen="levels";}else start(levelIndex+1);},"green");button(350,320,260,44,"LEVEL SELECT",()=>{state="menu";screen="levels";},"blue");});}
    if(toast&&performance.now()<toastUntil){g.fillStyle="rgba(10,25,38,.9)";rr(330,12,300,34,8);g.fill();g.fillStyle=C.text;g.font="bold 13px system-ui";g.textAlign="center";g.fillText(toast,480,33);}}
  function activate(){if(screen==="main"){screen="levels";selected=0;}else if(screen==="levels")start(selected);else screen="main";}
  function toLogical(x,y){return{x:(x-ox)/scale,y:(y-oy)/scale};}
  function clickMenu(x,y){for(let i=buttons.length-1;i>=0;i--){const b=buttons[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.action();return;}}}
  function down(e){const k=e.code||e.key;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(k))e.preventDefault();if(e.repeat)return;
    if(k==="Escape"||k==="Backspace"){if(state==="playing")state="paused";else if(state==="paused"||state==="dead"||state==="complete"){state="menu";screen="main";}else if(screen!=="main")screen="main";return;}
    if(k==="KeyP"){if(state==="playing")state="paused";else if(state==="paused")state="playing";return;}if(k==="KeyR"&&(state==="playing"||state==="dead")){retry();return;}if(k==="KeyM"){muted=!muted;toastMsg(muted?"Sound off":"Sound on");return;}if(k==="KeyH"){hitboxes=!hitboxes;return;}
    if(state==="menu"&&screen==="levels"){if(k==="ArrowLeft")selected=Math.max(0,selected-1);if(k==="ArrowRight")selected=Math.min(LEVELS.length-1,selected+1);if(k==="ArrowUp")selected=Math.max(0,selected-4);if(k==="ArrowDown")selected=Math.min(LEVELS.length-1,selected+4);if(k==="Enter"||k==="Space")start(selected);return;}
    if(state==="menu"&&screen==="main"&&(k==="Enter"||k==="Space")){activate();return;}
    if(state==="playing"&&["Space","ArrowUp","KeyW","ArrowRight","Enter"].includes(k)){e.preventDefault();pressed=true;held=true;}
  }
  function up(e){if(["Space","ArrowUp","KeyW","ArrowRight","Enter"].includes(e.code||e.key)){e.preventDefault();held=false;}}
  addEventListener("keydown",down,{passive:false});addEventListener("keyup",up,{passive:false});addEventListener("blur",()=>{held=false;});document.addEventListener("visibilitychange",()=>{if(document.hidden)held=false;});
  c.addEventListener("pointerdown",e=>{e.preventDefault();const p=toLogical(e.clientX,e.clientY);if(state==="playing"&&p.x>875&&p.y<70){state="paused";return;}if(state==="playing"&&p.x<100&&p.y<110){state="menu";screen="main";return;}if(state!=="playing"){clickMenu(p.x,p.y);return;}held=true;pressed=true;try{c.setPointerCapture(e.pointerId);}catch(_){}});
  c.addEventListener("pointerup",e=>{e.preventDefault();held=false;});c.addEventListener("pointercancel",()=>held=false);
  window.gameBack=()=>{if(state==="playing")state="paused";else if(state!=="menu"){state="menu";screen="main";}else if(screen!=="main")screen="main";};
  window.render_game_to_text=()=>JSON.stringify({version:VERSION,state,screen,level:level?level.name:null,progress:progress(),player:{x:Math.round(P.x),y:Math.round(P.y),mode:P.mode,gravity:P.gravity,grounded:P.grounded},attempts:attempt,deaths,unlocked:save.unlocked});
  window.advanceTime=ms=>{for(let i=0;i<Math.max(1,Math.round(ms/STEP/1000));i++)if(state==="playing")update(STEP);draw();};
  function frame(now){if(!last)last=now;const dt=Math.min(.05,(now-last)/1000);last=now;if(state==="playing"){acc+=dt;let n=0;while(acc>=STEP&&n<5){update(STEP);acc-=STEP;n++;}if(n===5)acc=0;}else{acc=0;pressed=false;}if(shake>0)shake=Math.max(0,shake-dt*30);draw();requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();