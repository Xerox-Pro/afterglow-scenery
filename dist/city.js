import * as THREE from './three.module.js';
// An original, compact interpretation of the Shibuya crossing, not a surveyed digital twin.
export function createCity(){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#3c465e');scene.fog=new THREE.FogExp2('#414c64',.0026);
 const camera=new THREE.PerspectiveCamera(43,1,.5,1500);
 const hemi=new THREE.HemisphereLight('#a7b9e3','#6b5562',2.0);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#ffd6ae',2.3);sun.position.set(-130,180,90);scene.add(sun);
 const world=new THREE.Group();scene.add(world);let seed=420;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const boxGeo=new THREE.BoxGeometry(1,1,1),matCache=new Map();
 function mat(color,em=0){const key=color+':'+em;if(!matCache.has(key))matCache.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.18,emissive:color,emissiveIntensity:em}));return matCache.get(key);}
 function box(x,y,z,w,h,d,color,em=0,parent=world){const m=new THREE.Mesh(boxGeo,mat(color,em));m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}
 box(0,-1,0,800,1,800,'#44454b');
 // Four road approaches and pale concrete sidewalks.
 box(0,-.35,0,45,.4,760,'#292b32');box(0,-.33,0,760,.4,40,'#292b32');
 const sidewalk=mat('#777978');
 for(const x of [-1,1])for(const z of [-1,1]){const m=box(x*114,-.05,z*112,180,.35,180,'#666b6f');m.material=sidewalk;}
 // Diagonal and perpendicular zebra crossings.
 function crossing(x,z,length,angle,width=9){const g=new THREE.Group();g.position.set(x,.07,z);g.rotation.y=angle;world.add(g);for(let y=-length/2;y<length/2;y+=2.5)box(0,0,y,width,.035,1.25,'#d2d4cd',.03,g);}
 crossing(0,0,68,Math.PI/4,8);crossing(0,0,68,-Math.PI/4,8);crossing(0,-23,42,Math.PI/2,8);crossing(0,23,42,Math.PI/2,8);crossing(-25,0,40,0,8);crossing(25,0,40,0,8);
 for(let i=42;i<360;i+=12){for(const s of [-1,1]){box(0,.03,s*i,.3,.02,5,'#c8bf8d');box(s*i,.03,0,5,.02,.3,'#c8bf8d');for(const k of [-12,12]){box(k,.02,s*i,.16,.02,6,'#939894');box(s*i,.02,k,6,.02,.16,'#939894');}}}
 // Window atlases provide thousands of individual lit offices in a handful of draw calls.
 function facade(base,index){const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,512);for(let y=3;y<512;y+=16)for(let x=4;x<256;x+=17){let light=rnd();ctx.fillStyle=light>.68?['#e4c18a','#9bb9cc','#d2d8c6'][index%3]:light>.3?'#344755':'#202d3a';ctx.fillRect(x,y,10,9);ctx.fillStyle='#71828b33';ctx.fillRect(x,y,1,9);}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;return tex;}
 const facades=['#424952','#485560','#3f414d','#5c5758'].map((c,i)=>facade(c,i));
 const buildingMaterials=facades.map(t=>new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:'#e9e1da',emissiveIntensity:.48,roughness:.56,metalness:.3}));
 function building(x,z,w,d,h,i){const side=buildingMaterials[i%4];const roof=mat('#525661');const m=new THREE.Mesh(boxGeo,[side,side,roof,roof,side,side]);m.position.set(x,h/2,z);m.scale.set(w,h,d);world.add(m);box(x,h+.6,z,w+1,1.2,d+1,'#657079');for(let k=0;k<3;k++){box(x+(rnd()-.5)*w*.6,h+1.5,z+(rnd()-.5)*d*.65,3+rnd()*3,2,3,'#7e8585');}return m;}
 // Dense blocks keep the characteristic open intersection at the center.
 for(let gx=-5;gx<=5;gx++)for(let gz=-5;gz<=5;gz++){if(gx===0||gz===0)continue;const x=gx*43+(rnd()-.5)*7,z=gz*43+(rnd()-.5)*7;if(Math.abs(gx)===1&&Math.abs(gz)===1)continue;building(x,z,25+rnd()*12,25+rnd()*10,22+rnd()*70,(gx+gz+20)%4);}
 building(-54,-54,52,49,49,1);building(55,-53,46,45,44,2);building(-53,55,43,44,35,3);building(54,54,46,44,58,0);
 // QFRONT-inspired large screen, cylinder recalling 109, and a distant sky deck.
 building(105,-88,32,42,115,1);box(105,116,-88,34,2,44,'#81a6b1');
 const tower=new THREE.Mesh(new THREE.CylinderGeometry(16,16,58,32),buildingMaterials[3]);tower.position.set(-102,29,61);world.add(tower);box(-102,59,61,25,2,25,'#9d8a91');
 // Original animated advertising artworks, hosted as generated canvas textures.
 const signs=[];
 function sign(x,y,z,w,h,angle,kind){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));m.position.set(x,y,z);m.rotation.y=angle;world.add(m);signs.push({c,ctx,tex,kind});box(x,y-.1,z-.3,w+.7,h+.7,.35,'#171e28');return m;}
 sign(-54,31,-28.9,42,21,0,0);sign(54,29,-30.2,36,18,0,1);sign(-30.8,21,55,27,19,Math.PI/2,2);sign(54,42,31.7,35,17,Math.PI,3);sign(-102,46,77.1,24,12,0,4);
 function textSign(text,x,y,z,w,h,angle,bg='#e4e2d5',fg='#151c28'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 58px sans-serif';ctx.fillText(text,256,67);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);m.rotation.y=angle;world.add(m);}
 textSign('SHIBUYA',-54,46,-28.7,35,5,0);textSign('109',-102,60,77.4,20,7,0,'#dad8d1','#aa274f');textSign('TOKYO',55,41,-30,29,4,0,'#153e63','#f4f2dc');
 for(const s of [-1,1])for(let i=0;i<9;i++){const x=s*(42+i*19);textSign(['珈琲','音楽','書店','渋谷','CAFE'][i%5],x,7,-28.5,10,4,0,['#d9b287','#ce575a','#476884'][i%3]);}
 // Street lamps, crossing lights, roadside greenery and rooftop details.
 const signals=[];for(const x of [-25,25])for(const z of [-24,24]){box(x,4.5,z,.22,9,.22,'#404c51');box(x,8.9,z,5,.18,.2,'#49565c');box(x+2,8.5,z,2,.6,.6,'#14242b');const light=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),new THREE.MeshBasicMaterial({color:'#82edb3'}));light.position.set(x+2,8.5,z+.35);world.add(light);signals.push(light);}
 const trees=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.1,1),mat('#344c43'),34);const dummy=new THREE.Object3D();for(let i=0;i<34;i++){const x=(i%2?1:-1)*(31+rnd()*2),z=(rnd()>.5?1:-1)*(35+rnd()*160);box(x,1.5,z,.5,3,.5,'#5a5144');dummy.position.set(x,4,z);dummy.scale.set(1,1.3,1);dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);}world.add(trees);
 // Instanced pedestrians: individually coloured torsos, heads and articulated legs.
 const count=380;const torsos=new THREE.InstancedMesh(new THREE.CylinderGeometry(.25,.31,.8,5),mat('#ffffff'),count);const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.19,5,4),mat('#e0b8a0'),count);const legs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.085,.075,.75,4),mat('#28303a'),count*2);world.add(torsos,heads,legs);const people=[];const lanes=[[-25,-24,25,24],[25,-24,-25,24],[-25,-19,-25,19],[25,-19,25,19],[-20,-24,20,-24],[-20,24,20,24]];const colors=['#b5b6b5','#263445','#46566a','#b6a28c','#794853','#e3dbc2','#6c7279','#2d343d'];
 for(let i=0;i<count;i++){const lane=lanes[i%lanes.length];people.push({lane,offset:rnd(),side:(rnd()-.5)*6,speed:.75+rnd()*.5,phase:rnd()*6.28});torsos.setColorAt(i,new THREE.Color(colors[i%colors.length]));}
 const cars=[];for(let i=0;i<26;i++){const g=new THREE.Group();const color=['#dddccf','#1e2733','#737985','#e7c352','#344b49'][i%5];box(0,.7,0,1.8,.8,4.2,color,0,g);box(0,1.3,-.2,1.6,.65,2.2,'#4a6070',0,g);box(-.55,.65,-2.13,.4,.22,.06,'#ffe9a3',2,g);box(.55,.65,-2.13,.4,.22,.06,'#ffe9a3',2,g);box(-.6,.65,2.13,.3,.18,.05,'#e55d4d',1,g);box(.6,.65,2.13,.3,.18,.05,'#e55d4d',1,g);world.add(g);cars.push({g,lane:i%4,offset:i*22+50});}
 // Batch static boxes by material to keep mobile draw calls manageable.
 const buckets=new Map();const oldBoxes=world.children.filter(o=>o.geometry===boxGeo);world.updateMatrixWorld(true);
 const pos=boxGeo.attributes.position,norm=boxGeo.attributes.normal,uv=boxGeo.attributes.uv,idx=boxGeo.index;
 for(const mesh of oldBoxes){const normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);for(let k=0;k<idx.count;k++){const group=boxGeo.groups.find(g=>k>=g.start&&k<g.start+g.count);const material=Array.isArray(mesh.material)?mesh.material[group.materialIndex]:mesh.material;if(!buckets.has(material))buckets.set(material,{p:[],n:[],u:[]});const bucket=buckets.get(material);const j=idx.getX(k);const point=new THREE.Vector3().fromBufferAttribute(pos,j).applyMatrix4(mesh.matrixWorld);const normal=new THREE.Vector3().fromBufferAttribute(norm,j).applyNormalMatrix(normalMatrix);bucket.p.push(point.x,point.y,point.z);bucket.n.push(normal.x,normal.y,normal.z);bucket.u.push(uv.getX(j),uv.getY(j));}world.remove(mesh);}
 for(const [material,b]of buckets){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));world.add(new THREE.Mesh(g,material));}
 let lastSign=-1;
 function update(t,{yaw,pitch,auto,intensity,day}){
  const n=day===2?1:day===1?0:.4;hemi.intensity=2.0-n*.9;sun.intensity=2.4-n*1.8;scene.background.set(day===1?'#8cabc0':day===2?'#171f38':'#535b75');scene.fog.color.copy(scene.background);buildingMaterials.forEach(m=>m.emissiveIntensity=.25+n*.65);
  const angle=.69+yaw*.85+(auto?Math.sin(t*.025)*.11:0);const radius=190+pitch*35;camera.position.set(Math.sin(angle)*radius,139+pitch*52,Math.cos(angle)*radius);camera.lookAt(0,9,0);
  const cycle=(t*intensity)%38;const walk=cycle<24;signals.forEach(m=>m.material.color.set(walk?'#6ff4b0':'#ed665c'));
  people.forEach((p,i)=>{let progress;if(walk){progress=Math.max(0,Math.min(1,(cycle/24*1.5-p.offset*.48)*p.speed));}else progress=1;const [ax,az,bx,bz]=p.lane;const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);const reverse=i%2===0;const q=reverse?1-progress:progress;const x=ax+dx*q-dz/len*p.side,z=az+dz*q+dx/len*p.side;const moving=walk&&progress>0&&progress<1;const step=moving?Math.sin(t*8*p.speed+p.phase)*.45:0;dummy.rotation.set(0,Math.atan2(dx,dz)+(reverse?Math.PI:0),0);dummy.scale.set(1,1,1);dummy.position.set(x,1.22+Math.abs(step)*.07,z);dummy.updateMatrix();torsos.setMatrixAt(i,dummy.matrix);dummy.position.y=1.86;dummy.updateMatrix();heads.setMatrixAt(i,dummy.matrix);for(let k=0;k<2;k++){dummy.position.set(x+(k?1:-1)*.12,.47,z);dummy.rotation.x=k?step:-step;dummy.updateMatrix();legs.setMatrixAt(i*2+k,dummy.matrix);}});torsos.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;legs.instanceMatrix.needsUpdate=true;
  cars.forEach(({g,lane,offset})=>{const move=(t*5*intensity+offset)%440-220;let d=move;if(walk&&Math.abs(d)<48)d=Math.sign(d||1)*(49+offset%65);if(lane<2){g.position.set(lane?8:-8,0,d);g.rotation.y=lane?0:Math.PI;}else{g.position.set(d,0,lane===2?8:-8);g.rotation.y=lane===2?Math.PI/2:-Math.PI/2;}});
  if(Math.floor(t*8)!==lastSign){lastSign=Math.floor(t*8);signs.forEach(({ctx,tex,kind})=>{const w=512,h=256;ctx.fillStyle=['#123f54','#cf634e','#292c65','#c4bfa9','#a62559'][kind];ctx.fillRect(0,0,w,h);ctx.save();ctx.globalAlpha=.45;for(let i=0;i<6;i++){ctx.fillStyle=['#b9e6dd','#ffd9a1','#a3a5ff'][i%3];ctx.beginPath();ctx.arc((i*110+t*24)%720-100,130+Math.sin(t*.6+i)*50,45+i*10,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.fillStyle='#fff4e3';ctx.font='bold 55px sans-serif';ctx.textAlign='center';ctx.fillText(['FEEL THE CITY','明日を、あそぼう。','SOUND / TOKYO','NEW PERSPECTIVE','SHIBUYA 109'][kind],256,130);ctx.font='16px sans-serif';ctx.fillText(['TOKYO • ALL THE POSSIBILITIES','MAKE YOUR MOMENT','LIVE IN THE MOMENT','A NEW DAY IS COMING','CULTURE / MUSIC / STYLE'][kind],256,175);ctx.fillStyle='#ffffff33';for(let y=0;y<h;y+=4)ctx.fillRect(0,y,w,1);tex.needsUpdate=true;});}
 }
 return {scene,camera,update};
}
