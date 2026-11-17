export const vertex=`
#include <common>
#include <skinning_pars_vertex>
attribute float illustratedId;
varying vec3 vInkColor;varying vec3 vWorld;varying vec3 vNormalWorld;varying vec2 vPaintUv;varying float vIdentifier;varying float vDistance;
uniform float uNormalControl;uniform vec3 uStage;
void main(){
 #include <beginnormal_vertex>
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 objectNormal=normalize(mix(objectNormal,vec3(0.,0.,1.),uNormalControl));
 #include <defaultnormal_vertex>
 #include <begin_vertex>
 #include <skinning_vertex>
 #include <project_vertex>
 vec4 worldPoint=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 worldPoint=instanceMatrix*worldPoint;
 #endif
 worldPoint=modelMatrix*worldPoint;vWorld=worldPoint.xyz;
 vNormalWorld=normalize((vec4(transformedNormal,0.)*viewMatrix).xyz);
 vPaintUv=uv;vIdentifier=illustratedId;vDistance=length(worldPoint.xz-uStage.xz);
 vInkColor=vec3(1.);
 #ifdef USE_COLOR
 vInkColor*=color;
 #endif
 #ifdef USE_INSTANCING_COLOR
 vInkColor*=instanceColor;
 #endif
}`;
export const fragment=`
uniform vec3 uShadowMul;uniform vec3 uPoolColor;uniform vec3 uFill;uniform vec3 uShadow;uniform vec3 uTint;uniform vec3 uDistant;uniform vec3 uLight;uniform vec3 uPool;
uniform float uPass;uniform float uKind;uniform float uShade;uniform float uOpacity;uniform float uMapMix;uniform float uFarFade;uniform float uPoolPower;uniform float uEmission;uniform float uTime;
uniform sampler2D uMap;
varying vec3 vInkColor;varying vec3 vWorld;varying vec3 vNormalWorld;varying vec2 vPaintUv;varying float vIdentifier;varying float vDistance;
vec3 encodeId(float id){return vec3(mod(id,255.),mod(floor(id/255.),255.),mod(floor(id/65025.),255.))/255.;}
void main(){
 vec4 tex=texture2D(uMap,vPaintUv);float alpha=mix(1.,tex.a,uMapMix)*uOpacity;if(alpha<.04)discard;
 if(uPass>.5){if(uKind<.01)discard;gl_FragColor=vec4(encodeId(vIdentifier),uKind*(1.-smoothstep(85.,160.,vDistance)));return;}
 vec3 base=uFill*vInkColor;vec3 brush=mix(vec3(1.),tex.rgb,uMapMix);base*=brush;
 // Two painted bands: lit, and shadow with a deeper core. The shadow colour is set per location (lighting.js).
 float nl=dot(normalize(vNormalWorld),normalize(uLight));
 float edgeWobble=(sin(vWorld.x*7.3+vWorld.y*5.1)+sin(vWorld.z*6.7-vWorld.y*4.3))*.035;
 float lit=step(.16,nl+edgeWobble);float deep=step(nl+edgeWobble,-.32);
 vec3 shadowCol=uShadow*uShadowMul;
 vec3 shade=mix(mix(shadowCol,shadowCol*.86,deep),uFill,lit);base=mix(base,shade*vInkColor*brush,uShade);
 vec3 tinted=base*uTint;float pool=exp(-dot(vWorld.xz-uPool.xz,vWorld.xz-uPool.xz)*uPoolPower);
 tinted=mix(tinted,base*uPoolColor,pool*.85);
 tinted=mix(tinted,base,uEmission);
 float distanceBand=floor(smoothstep(28.,160.,vDistance)*5.)/5.;tinted=mix(tinted,uDistant,distanceBand*uFarFade);
 if(uKind>.65&&uKind<.75){float band=sin(vWorld.x*.09+vWorld.z*.7+uTime*.18);tinted=mix(tinted,tinted*vec3(.90,.97,1.02),step(.72,band)*.55);}
 gl_FragColor=vec4(tinted,alpha);
 #include <colorspace_fragment>
}`;
export const screenVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const screenFragment=`
uniform sampler2D colorBuffer;uniform sampler2D idBuffer;uniform vec2 resolution;uniform vec3 ink;uniform float uSeed;uniform float uPaper;uniform float uBoil;varying vec2 vUv;
float differs(vec3 a,vec3 b){return step(.0025,length(a-b));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
 // Boiling line: the id taps are shifted by a noise field that changes with each held drawing (uSeed = 0,1,2 repeating),
 // so the outline wobbles like a hand-inked frame. The centre sample is not shifted, so there are no holes in the line.
 vec2 px=gl_FragCoord.xy;vec2 warp=(vec2(vnoise(px*.045+uSeed*17.3),vnoise(px*.045+31.7+uSeed*11.1))-.5)*2.*uBoil;
 vec4 center=texture2D(idBuffer,vUv);float actor=step(.85,center.a);float radius=mix(1.1,2.4,actor)*(.82+.36*vnoise(px*.03+uSeed*5.));float edge=0.;
 for(int i=0;i<8;i++){float angle=float(i)*.78539816;vec2 offset=(vec2(cos(angle),sin(angle))*radius+warp)/resolution;vec4 other=texture2D(idBuffer,vUv+offset);edge=max(edge,differs(center.rgb,other.rgb)*step(.03,center.a)*step(.03,other.a));
 // Grow the silhouette inward only: no ink halo in empty sky.
 edge=max(edge,differs(center.rgb,other.rgb)*step(.03,center.a)*(1.-step(.03,other.a)));
 }
 vec3 color=texture2D(colorBuffer,vUv).rgb;
 // The line is a very dark version of the colour under it (not one flat grey), strong on the cast, softer on the sets.
 vec3 lineColor=mix(ink,color*.28,.45);float amount=mix(.58,.92,actor);color=mix(color,lineColor,edge*amount*clamp(center.a*3.,0.,1.));
 // Static paper: screen-locked grain and fibres, the same on every drawing, multiplied over the picture.
 float grain=hash(floor(px*.5))*.5+vnoise(px*.09)*.35+vnoise(px*.013)*.15;color*=1.-uPaper*(grain-.5)*1.4;
 gl_FragColor=vec4(color,1.);
#include <colorspace_fragment>
}`;
