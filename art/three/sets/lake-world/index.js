import {buildLandscape,surfaceHeight} from './landscape.js';
import {buildPlaces,groundBuildings} from './places.js';
import {populateVegetation} from './population.js';
import {SHOTS} from './layout.js';
export function buildLakeWorld(kit,spec){
 buildLandscape(kit,spec);buildPlaces(kit);populateVegetation(kit);
 const cameras={};for(const shot of SHOTS){cameras[shot.id]=shot.position;cameras[shot.id+'Target']=shot.target;}
 cameras.target=SHOTS[0].target;cameras.detailTarget=SHOTS.find(s=>s.id==='detail').target;
 return {groundHeight:surfaceHeight,cameras,groundBuildings:()=>groundBuildings(kit)};
}
