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
uniform vec3 uFill;uniform vec3 uShadow;uniform vec3 uTint;uniform vec3 uDistant;uniform vec3 uLight;uniform vec3 uPool;
uniform float uPass;uniform float uKind;uniform float uShade;uniform float uOpacity;uniform float uMapMix;uniform float uFarFade;uniform float uPoolPower;uniform float uEmission;uniform float uTime;
uniform sampler2D uMap;
varying vec3 vInkColor;varying vec3 vWorld;varying vec3 vNormalWorld;varying vec2 vPaintUv;varying float vIdentifier;varying float vDistance;
vec3 encodeId(float id){return vec3(mod(id,255.),mod(floor(id/255.),255.),mod(floor(id/65025.),255.))/255.;}
void main(){
 vec4 tex=texture2D(uMap,vPaintUv);float alpha=mix(1.,tex.a,uMapMix)*uOpacity;if(alpha<.04)discard;
 if(uPass>.5){if(uKind<.01)discard;gl_FragColor=vec4(encodeId(vIdentifier),uKind*(1.-smoothstep(85.,160.,vDistance)));return;}
 vec3 base=uFill*vInkColor;vec3 brush=mix(vec3(1.),tex.rgb,uMapMix);base*=brush;
 float lit=step(.18,dot(normalize(vNormalWorld),normalize(uLight)));
 vec3 shade=mix(uShadow,uFill,lit);base=mix(base,shade*vInkColor*brush,uShade);
 vec3 tinted=base*uTint;float pool=exp(-dot(vWorld.xz-uPool.xz,vWorld.xz-uPool.xz)*uPoolPower);
 tinted=mix(tinted,base*vec3(1.,.83,.59),pool*.85);
 tinted=mix(tinted,base,uEmission);
 float distanceBand=floor(smoothstep(28.,160.,vDistance)*5.)/5.;tinted=mix(tinted,uDistant,distanceBand*uFarFade);
 if(uKind>.65&&uKind<.75){float band=sin(vWorld.x*.09+vWorld.z*.7+uTime*.18);tinted=mix(tinted,tinted*vec3(.90,.97,1.02),step(.72,band)*.55);}
 gl_FragColor=vec4(tinted,alpha);
 #include <colorspace_fragment>
}`;
export const screenVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const screenFragment=`
uniform sampler2D colorBuffer;uniform sampler2D idBuffer;uniform vec2 resolution;uniform vec3 ink;varying vec2 vUv;
float differs(vec3 a,vec3 b){return step(.0025,length(a-b));}
void main(){
 vec4 center=texture2D(idBuffer,vUv);float radius=mix(.85,2.1,step(.85,center.a));float edge=0.;
 for(int i=0;i<8;i++){float angle=float(i)*.78539816;vec2 offset=vec2(cos(angle),sin(angle))*radius/resolution;vec4 other=texture2D(idBuffer,vUv+offset);edge=max(edge,differs(center.rgb,other.rgb)*step(.03,center.a)*step(.03,other.a));
 // Grow the silhouette inward only: no ink halo in empty sky.
 edge=max(edge,differs(center.rgb,other.rgb)*step(.03,center.a)*(1.-step(.03,other.a)));
 }
 vec3 color=texture2D(colorBuffer,vUv).rgb;
 float amount=mix(.40,.90,step(.85,center.a));color=mix(color,ink,edge*amount*clamp(center.a*3.,0.,1.));
 // Small fixed paper variation and a common warm finish; never temporal noise.
 float paper=sin(gl_FragCoord.x*.37+sin(gl_FragCoord.y*.19))*sin(gl_FragCoord.y*.43);color+=paper*.00012;
 color=color*vec3(1.008,1.,.987)+vec3(.001,.0005,0.);
 gl_FragColor=vec4(color,1.);
#include <colorspace_fragment>
}`;
