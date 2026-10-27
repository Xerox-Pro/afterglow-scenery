// Original procedural water and atmospheric sky. No image or video dependencies.
export const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const fragment = `
precision highp float;
varying vec2 vUv;
uniform float uTime,uAspect,uScene,uDay,uStrength,uYaw,uPitch;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(17.3,9.2);a*=.5;}return s;}
float water(vec2 p){float t=uTime*.68;float h=0.;float a=.32;float f=.38;vec2 d=vec2(.86,.51);for(int i=0;i<7;i++){float q=dot(p,d)*f+t*(.8+float(i)*.12);h+=sin(q+sin(q*.53)*.5)*a;d=mat2(.8,-.6,.6,.8)*d;f*=1.87;a*=.46;}return h*uStrength;}
vec3 sky(vec3 rd,vec3 sun,float night,float day){float y=max(rd.y,0.);vec3 zen=mix(vec3(.19,.32,.43),vec3(.20,.48,.69),day);vec3 hor=mix(vec3(.82,.66,.49),vec3(.68,.82,.85),day);zen=mix(zen,vec3(.016,.026,.065),night);hor=mix(hor,vec3(.08,.11,.18),night);vec3 col=mix(hor,zen,pow(y,.42));float s=max(dot(rd,sun),0.);col+=mix(vec3(1.,.56,.24),vec3(.95,.84,.63),day)*(pow(s,55.)*.44+pow(s,500.)*.9)*(1.-night);col+=vec3(1.,.91,.70)*smoothstep(.99965,.99985,s)*(1.-night)*1.4;col+=vec3(.76,.83,1.)*smoothstep(.9996,.99985,s)*night;vec2 cloud=rd.xz/(abs(rd.y)+.14)*1.25+vec2(uTime*.004,0.);float c=fbm(cloud*2.);float shape=smoothstep(.50,.76,c)*smoothstep(.0,.22,y);col=mix(col,mix(vec3(.81,.76,.68),vec3(.92,.95,.95),day),shape*.38*(1.-night));col+=vec3(.17,.23,.32)*shape*night;vec2 star=rd.xz/(rd.y+.6)*270.;float stars=pow(hash(floor(star)),80.)*smoothstep(.99,1.,noise(star*.06));col+=stars*night*smoothstep(.02,.35,y)*.65;return col;}
void main(){
 float night=uDay>1.5?1.:0.;float day=(uDay>.5&&uDay<1.5)?1.:0.;if(uScene>.5&&uScene<1.5){night=1.;day=0.;}
 vec2 uv=vUv;float pitch=uPitch*.23;vec3 ro=vec3(0.,uScene>1.5?5.5:3.4,4.);vec3 rd=normalize(vec3((uv.x-.5)*uAspect*.92,(uv.y-.54)*.92+pitch,-1.25));float a=uYaw*.28;rd.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*rd.xz;
 vec3 sun=normalize(vec3(.22*uAspect,day>.5?.55:.085,-1.4));vec3 col=sky(rd,sun,night,day);
 if(rd.y<-.003){
  float dist=-ro.y/rd.y;dist=min(dist,1400.);vec3 p=ro+rd*dist;
  for(int i=0;i<5;i++){float h=water(p.xz);dist+=(h-p.y)/(rd.y-.005);dist=clamp(dist,0.,1400.);p=ro+rd*dist;}
  float e=.035+min(dist,1200.)*.006;float h=water(p.xz);vec3 n=normalize(vec3(h-water(p.xz+vec2(e,0.)),e,h-water(p.xz+vec2(0.,e))));
  vec3 refl=reflect(rd,n);refl.y=abs(refl.y);float fres=pow(1.-max(dot(-rd,n),0.),4.);vec3 deep=mix(vec3(.035,.16,.20),vec3(.025,.27,.34),day);deep=mix(deep,vec3(.008,.025,.049),night);col=mix(deep,sky(refl,sun,night,day),.28+fres*.68);
  float spec=pow(max(dot(reflect(-sun,n),-rd),0.),day>.5?160.:260.);col+=mix(vec3(1.,.55,.23),vec3(1.,.91,.71),day)*spec*(1.-night)*1.9;col+=vec3(.45,.55,.72)*spec*night*.5;
  float shimmer=pow(max(dot(reflect(-sun,n),-rd),0.),24.);col+=vec3(.52,.32,.15)*shimmer*(1.-night)*.16;
  if(uScene>1.5){
   // Shore profile in world space; the swash advances and retreats continuously.
   float coast=-23.+.004*p.x*p.x+sin(p.x*.11)*.6;float tide=sin(uTime*.48)*1.5+sin(p.x*.16+uTime*.6)*.35;float shore=p.z-coast-tide;float grit=noise(p.xz*90.)*.06+fbm(p.xz*6.)*.08;
   vec3 sand=mix(vec3(.54,.40,.25),vec3(.83,.72,.53),day*.5+.5)+grit; sand=mix(sand,vec3(.12,.12,.15)+grit*.15,night);vec3 wet=sand*.64;
   float shallow=smoothstep(-12.,1.,shore);col=mix(col,mix(vec3(.12,.38,.36),wet,shallow),shallow*.67);
   float foamNoise=noise(p.xz*8.+uTime*.3);float foam=(1.-smoothstep(.08,.65,abs(shore+foamNoise*.43)))*(.65+noise(p.xz*32.)*.35);
   float backwash=sin(shore*3.7+uTime*1.2+noise(p.xz)*2.);foam+=pow(max(backwash,0.),14.)*smoothstep(-9.,-1.,shore)*(1.-smoothstep(-1.,0.,shore))*.7;
   col=mix(col,mix(vec3(.80,.87,.81),vec3(.17,.22,.28),night),clamp(foam,0.,.9));
   float dry=smoothstep(.12,.8,shore);col=mix(col,mix(wet,sand,smoothstep(0.,5.,shore)),dry);
   float lace=pow(noise(p.xz*20.),3.)*.12;col+=lace*dry*(1.-night);
  }
  float haze=1.-exp(-dist*.004);col=mix(col,sky(vec3(rd.x,.007,rd.z),sun,night,day),haze*.82);
 }
 col*=1.-.16*pow(length((uv-.5)*vec2(.8,1.)),1.5);col=pow(max(col,vec3(0.)),vec3(.94));gl_FragColor=vec4(col,1.);
}`;
