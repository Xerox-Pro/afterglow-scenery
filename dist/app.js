import * as THREE from './three.module.js';
import {vertex,fragment} from './ocean.js';
import {createCity} from './city.js';
import {createFallback} from './fallback.js';
const $=id=>document.getElementById(id);
const data=[
 {en:'THE OPEN OCEAN',title:'ただ、<br>眺めていたい。',desc:'光をほどく波。どこまでも続く水平線。<br>少しだけ、時間を忘れて。',tag:'果てしない海',label:'GOLDEN HOUR',note:'光と波がつくる、一度きりの表情。',day:0,caption:'A LITTLE ESCAPE, ANYTIME.'},
 {en:'LIGHTS ON THE WATER',title:'夜空に、<br>心がほどける。',desc:'海の向こうから、ひとすじの光。<br>夜空と水面に、花がひらく。',tag:'海上の花火大会',label:'NIGHT BLOSSOMS',note:'打ち上げるたび、海まで色づく。',day:2,caption:'画面をタップして、花火を打ち上げる。'},
 {en:'WHERE THE WAVES RETURN',title:'波の数だけ、<br>深呼吸。',desc:'裸足で歩く、やわらかな砂浜。<br>寄せては返す波に、身をまかせて。',tag:'静かなビーチ',label:'SLOW TIDE',note:'何もない時間が、ちょうどいい。',day:1,caption:'LET THE WAVES SET YOUR PACE.'},
 {en:'ABOVE THE NEVER-SLEEPING CITY',title:'この街は、<br>止まらない。',desc:'交差する足音。流れつづける光。<br>いつもの渋谷を、少し高い場所から。',tag:'渋谷・スクランブル交差点',label:'CITY IN MOTION',note:'幾千もの時間が、交差する場所。',day:0,caption:'渋谷をモチーフにしたリアルタイムCG'}
];
let renderer,waterScene,waterCamera,uniforms,city,fallback=false;
let scene=0,t=12,last=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,auto=true,intensity=1,day=0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,quality='auto',pixelScale=1,audioOn=false,immersed=false;
let W=innerWidth,H=innerHeight;const fx=$('effects'),ctx=fx.getContext('2d');
const launchers=[],sparks=[],smoke=[];let nextLaunch=0;let pointer=null,dragDistance=0,toastTimer;
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2500);}
function init(){
 try{
 try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.outputColorSpace=THREE.SRGBColorSpace;$('viewport').append(renderer.domElement);}catch{fallback=true;renderer=createFallback($('viewport'));}
 waterScene=new THREE.Scene();waterCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);uniforms={uTime:{value:t},uAspect:{value:W/H},uScene:{value:0},uDay:{value:0},uStrength:{value:1},uYaw:{value:0},uPitch:{value:0}};const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,depthTest:false,depthWrite:false});waterScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
 resize();events();const fromHash=Number(location.hash.replace('#',''));if(Number.isInteger(fromHash)&&fromHash>=1&&fromHash<=4)selectScene(fromHash-1,false);setPauseUI();requestAnimationFrame(frame);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;$('error').hidden=false;$('error').querySelector('h1').textContent='描画が中断されました';$('error').querySelector('p').textContent='再読み込みすると風景を開き直せます。';});
 }catch(err){console.error(err);$('error').hidden=false;$('loading').hidden=true;}
}
function resize(){W=$('experience').clientWidth;H=$('experience').clientHeight;const low=quality==='low',high=quality==='high';const max=high?1.8:low?.75:1.25;renderer.setPixelRatio(Math.min(devicePixelRatio,max)*pixelScale);renderer.setSize(W,H);uniforms.uAspect.value=W/H;fx.width=Math.floor(W*Math.min(devicePixelRatio,1.5));fx.height=Math.floor(H*Math.min(devicePixelRatio,1.5));fx.style.width=W+'px';fx.style.height=H+'px';ctx.setTransform(fx.width/W,0,0,fx.height/H,0,0);if(city){city.camera.aspect=W/H;city.camera.updateProjectionMatrix();}}
function selectScene(i,updateHash=true){scene=i;const d=data[i];day=d.day;$('scene-number').textContent=String(i+1).padStart(2,'0');$('scene-en').textContent=d.en;$('scene-title').innerHTML=d.title;$('scene-desc').innerHTML=d.desc;$('scene-tag').textContent=d.tag;$('detail-label').textContent=d.label;$('detail-note').textContent=d.note;$('caption').textContent=d.caption;$('time').value=String(day);$('time').disabled=i===1;$('launch').hidden=i!==1;
 document.querySelectorAll('[data-scene]').forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',String(i===j));});
 if(i===3&&!city&&!fallback){city=createCity();resize();}sparks.length=0;smoke.length=0;launchers.length=0;nextLaunch=t+.15;targetYaw=targetPitch=0;
 if(updateHash)history.replaceState(null,'','#'+(i+1));updateAudio();
 if(i===1&&paused)toast('一時停止中です。再生すると花火が始まります');
}
function setPauseUI(){$('pause').setAttribute('aria-pressed',String(paused));$('pause').setAttribute('aria-label',paused?'アニメーションを再生':'アニメーションを一時停止');$('pause-symbol').textContent=paused?'▷':'Ⅱ';$('pause-label').textContent=paused?'再生':'一時停止';}
function setImmersed(v){immersed=v;$('experience').classList.toggle('immersed',v);$('restore-ui').hidden=!v;if(v){$('settings').hidden=true;$('settings-toggle').setAttribute('aria-expanded','false');}}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if($('experience').requestFullscreen)await $('experience').requestFullscreen();else toast('このブラウザーでは全画面に対応していません');}catch{toast('全画面表示を開始できませんでした');}}
function events(){
 addEventListener('resize',resize);document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>selectScene(Number(b.dataset.scene))));
 $('pause').onclick=()=>{paused=!paused;setPauseUI();updateAudio();};$('sound').onclick=toggleAudio;$('fullscreen').onclick=toggleFullscreen;$('hide-ui').onclick=()=>setImmersed(true);$('restore-ui').onclick=()=>setImmersed(false);
 $('settings-toggle').onclick=()=>{$('settings').hidden=!$('settings').hidden;$('settings-toggle').setAttribute('aria-expanded',String(!$('settings').hidden));};$('settings-close').onclick=()=>{$('settings').hidden=true;$('settings-toggle').setAttribute('aria-expanded','false');};
 $('time').onchange=e=>{day=Number(e.target.value);$('detail-label').textContent=['GOLDEN HOUR','DAYLIGHT','AFTER DARK'][day];};$('intensity').oninput=e=>intensity=Number(e.target.value);$('quality').onchange=e=>{quality=e.target.value;pixelScale=1;resize();};$('auto-camera').onchange=e=>auto=e.target.checked;$('volume').oninput=updateAudio;$('launch').onclick=()=>{if(paused){paused=false;setPauseUI();}launchFirework();};
 const c=renderer.domElement;c.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch,id:e.pointerId};dragDistance=0;c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;dragDistance=Math.hypot(dx,dy);targetYaw=Math.max(-1.8,Math.min(1.8,pointer.yaw+dx/W*2));targetPitch=Math.max(-.7,Math.min(.7,pointer.pitch-dy/H*1.4));});c.addEventListener('pointerup',e=>{if(pointer&&dragDistance<8&&scene===1){if(paused){paused=false;setPauseUI();}launchFirework(e.clientX/W);}pointer=null;});c.addEventListener('pointercancel',()=>pointer=null);
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key>='1'&&e.key<='4')selectScene(Number(e.key)-1);if(e.code==='Space'){e.preventDefault();paused=!paused;setPauseUI();updateAudio();}if(e.key.toLowerCase()==='h')setImmersed(!immersed);if(e.key.toLowerCase()==='f')toggleFullscreen();if(e.key.toLowerCase()==='m')toggleAudio();if(e.key==='Escape'){setImmersed(false);$('settings').hidden=true;$('settings-toggle').setAttribute('aria-expanded','false');}});
 document.addEventListener('visibilitychange',()=>{last=0;updateAudio();});
}
// Fireworks: ballistic shells, drag, gravitational sparks, trails, smoke and rippled reflections.
const palette=[[255,196,125],[173,211,255],[255,135,169],[161,247,210],[255,235,171],[206,172,255]];
function launchFirework(x){const startX=x??(.28+Math.random()*.52);const height=.13+Math.random()*.19;launchers.push({x:startX,y:.54,target:height,speed:.16+Math.random()*.04,color:palette[Math.floor(Math.random()*palette.length)],trail:[],size:.055+Math.random()*.045,style:Math.random()});}
function explode(l){const count=quality==='low'?90:180;const aspect=H/W;for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,z=Math.random()*2-1;const speed=Math.sqrt(1-z*z)*l.size*(.6+Math.random()*.45);sparks.push({x:l.x,y:l.y,px:l.x,py:l.y,vx:Math.cos(angle)*speed*aspect,vy:Math.sin(angle)*speed,life:2.3+Math.random()*1.9,max:4.2,color:l.color,size:.8+Math.random()*.9,twinkle:Math.random(),trail:[],willow:l.style>.65});}smoke.push({x:l.x,y:l.y,life:6,color:l.color,size:30});boom(l.size);}
function renderFireworks(dt){ctx.clearRect(0,0,W,H);if(scene!==1)return;if(t>nextLaunch){launchFirework();if(Math.random()>.6)launchFirework();nextLaunch=t+1.1+Math.random()*1.5;}
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=smoke.length-1;i>=0;i--){const s=smoke[i];s.life-=dt;s.x+=dt*.002;s.size+=dt*8;const g=ctx.createRadialGradient(s.x*W,s.y*H,0,s.x*W,s.y*H,s.size);g.addColorStop(0,`rgba(${s.color.join(',')},${Math.max(0,s.life)*.005})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(s.x*W-s.size,s.y*H-s.size,s.size*2,s.size*2);if(s.life<0)smoke.splice(i,1);}
 for(let i=launchers.length-1;i>=0;i--){const l=launchers[i];l.trail.push([l.x,l.y]);if(l.trail.length>20)l.trail.shift();l.y-=l.speed*dt;l.x+=Math.sin(t*13)*.0036*dt;for(let j=1;j<l.trail.length;j++){ctx.strokeStyle=`rgba(255,211,153,${j/l.trail.length*.6})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l.trail[j-1][0]*W,l.trail[j-1][1]*H);ctx.lineTo(l.trail[j][0]*W,l.trail[j][1]*H);ctx.stroke();}if(l.y<l.target){explode(l);launchers.splice(i,1);}}
 for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];if(dt>0){s.px=s.x;s.py=s.y;s.trail.push([s.x,s.y]);if(s.trail.length>(s.willow?12:5))s.trail.shift();s.vx*=Math.exp(-dt*.55);s.vy=s.vy*Math.exp(-dt*.4)+dt*.018;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;}if(s.life<=0||s.y>.545){sparks.splice(i,1);continue;}const a=Math.min(1,s.life*.6)*(s.life<1.3?.55+.45*Math.sin(t*38+s.twinkle*10):1);ctx.lineWidth=s.size;ctx.strokeStyle=`rgba(${s.color.join(',')},${a*.7})`;ctx.beginPath();if(s.trail.length){ctx.moveTo(s.trail[0][0]*W,s.trail[0][1]*H);for(const p of s.trail)ctx.lineTo(p[0]*W,p[1]*H);}ctx.lineTo(s.x*W,s.y*H);ctx.stroke();ctx.fillStyle=`rgba(255,245,221,${a})`;ctx.fillRect(s.x*W,s.y*H,s.size,s.size);
  // Broken horizontal streaks, vertically compressed by perspective.
  if(i%3===0){const ry=.56+(.54-s.y)*.65;const ripple=Math.sin(ry*H*.18+t*3.7)*.007;ctx.fillStyle=`rgba(${s.color.join(',')},${a*.17})`;ctx.fillRect((s.x+ripple)*W-3,ry*H,6+Math.sin(t+s.x*80)*3,1.3);}
 }
 ctx.restore();
}
function renderAmbient(){if(scene===1)return;ctx.clearRect(0,0,W,H);if(scene===3)return;
 // Distant seabirds, with gentle wing beats and independent trajectories.
 ctx.strokeStyle=day===2?'#aab5c355':'#263f4f99';ctx.lineWidth=.9;for(let i=0;i<5;i++){const x=((t*.009+i*.195)%1.2-.1)*W,y=(.26+Math.sin(t*.16+i)*.026+i*.009)*H;const f=Math.sin(t*3+i)*3;ctx.beginPath();ctx.moveTo(x-6,y-f);ctx.quadraticCurveTo(x-2,y-2,x,y+1);ctx.quadraticCurveTo(x+3,y-2,x+7,y-f);ctx.stroke();}
 if(scene===0){const x=(.72+Math.sin(t*.006)*.09)*W,y=.535*H;ctx.fillStyle=day===2?'#405466':'#333f48';ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.lineTo(x+6,y+3);ctx.lineTo(x-6,y+3);ctx.fill();ctx.fillStyle='#dcd8be';ctx.beginPath();ctx.moveTo(x,y-23);ctx.lineTo(x,y-1);ctx.lineTo(x+11,y-1);ctx.fill();}
}
// Opt-in locally synthesized ambience; never requests microphone permission.
let audioCtx,master,windGain,cityGain,noiseBuffer;
async function toggleAudio(){try{if(!audioCtx){audioCtx=new AudioContext();master=audioCtx.createGain();master.connect(audioCtx.destination);master.gain.value=0;noiseBuffer=audioCtx.createBuffer(1,audioCtx.sampleRate*4,audioCtx.sampleRate);const a=noiseBuffer.getChannelData(0);let b=0;for(let i=0;i<a.length;i++){b=(b+Math.random()*.04-.02)/1.02;a[i]=b*4;}const noise=audioCtx.createBufferSource();noise.buffer=noiseBuffer;noise.loop=true;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=800;windGain=audioCtx.createGain();noise.connect(filter);filter.connect(windGain);windGain.connect(master);noise.start();const low=audioCtx.createOscillator();low.type='triangle';low.frequency.value=54;cityGain=audioCtx.createGain();low.connect(cityGain);cityGain.connect(master);low.start();}await audioCtx.resume();audioOn=!audioOn;$('sound').setAttribute('aria-pressed',String(audioOn));$('sound').setAttribute('aria-label',audioOn?'環境音をオフ':'環境音をオン');$('sound').innerHTML=audioOn?'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8m3-11q8 7 0 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6m0-6l-4 6"/></svg>';updateAudio();}catch{toast('環境音を開始できませんでした');}}
function updateAudio(){if(!audioCtx)return;const audible=audioOn&&!paused&&!document.hidden;master.gain.setTargetAtTime(audible?Number($('volume').value)*.5:0,audioCtx.currentTime,.2);cityGain.gain.setTargetAtTime(scene===3?.13:0,audioCtx.currentTime,.5);windGain.gain.setTargetAtTime(scene===3?.25:.65,audioCtx.currentTime,.5);}
function boom(size){if(!audioOn||!audioCtx||paused)return;const src=audioCtx.createBufferSource();src.buffer=noiseBuffer;const filt=audioCtx.createBiquadFilter();filt.type='lowpass';filt.frequency.value=140+size*1000;const g=audioCtx.createGain();g.gain.setValueAtTime(.001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.6,audioCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+1.6);src.connect(filt);filt.connect(g);g.connect(master);src.start();src.stop(audioCtx.currentTime+1.7);src.onended=()=>{src.disconnect();filt.disconnect();g.disconnect();};}
let frames=0,elapsed=0,ready=false;
function frame(now){requestAnimationFrame(frame);const delta=last?Math.min((now-last)/1000,.05):0;last=now;if(document.hidden)return;const dt=paused?0:delta;t+=dt;
 yaw+=(targetYaw-yaw)*.06;pitch+=(targetPitch-pitch)*.06;
 if(fallback){renderer.draw(scene,t,day,intensity,yaw+(auto?Math.sin(t*.04)*.08:0),pitch);}else if(scene===3){city.update(t,{yaw,pitch,auto,intensity,day});renderer.render(city.scene,city.camera);}else{uniforms.uTime.value=t;uniforms.uScene.value=scene;uniforms.uDay.value=day;uniforms.uStrength.value=intensity;uniforms.uYaw.value=yaw+(auto?Math.sin(t*.04)*.08:0);uniforms.uPitch.value=pitch;renderer.render(waterScene,waterCamera);}
 if(scene===1)renderFireworks(dt*intensity);else renderAmbient();
 if(audioCtx&&audioOn&&!paused){windGain.gain.setTargetAtTime((scene===3?.25:.5+Math.sin(t*.48)*.22),audioCtx.currentTime,.3);}
 if(!ready){ready=true;$('loading').classList.add('ready');setTimeout(()=>$('loading').hidden=true,900);}
 frames++;elapsed+=delta;if(frames>=150){const fps=frames/elapsed;if(quality==='auto'&&fps<27&&pixelScale>.6){pixelScale=Math.max(.6,pixelScale*.8);resize();}frames=0;elapsed=0;}
}
init();
