import * as THREE from 'three';
import {createKit} from './primitives.js';
import {exteriors} from './exteriors.js';
import {sky} from './sky.js';
import {interiors} from './interiors.js';

export function buildSet(spec) {
  const root=new THREE.Group();root.name=spec.id;
  root.userData={id:spec.id,name:spec.name,reference:spec.reference,episodes:spec.episodes,mood:spec.mood,anchors:[],assetErrors:[],units:'metres',geometry:'Modeled from a single painting; unseen sides and dimensions are inferred.'};
  const kit=createKit(root,spec.mood);
  const builders={...exteriors(kit),...interiors(kit)};
  if(!builders[spec.build])throw new Error(`Unknown set builder: ${spec.build}`);
  const cameras=builders[spec.build](spec);root.userData.cameras=cameras;sky(kit,spec);
  // Recompute world positions after every parent transform has been applied.
  root.updateMatrixWorld(true);
  root.userData.anchors=[];
  root.traverse(o=>{if(o.userData.anchor)root.userData.anchors.push({name:o.name,position:o.getWorldPosition(new THREE.Vector3()).toArray()});});
  return root;
}

export function disposeSet(root) {
  if(!root)return;
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)) {
      materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);
    }
  });
  for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();
  root.removeFromParent();root.clear();
}
