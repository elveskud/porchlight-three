import {kit} from './kit.js';
import {lakeside,dressFestival} from './festival.js';
export function build({mood='dusk'}={}){const k=kit('festival_stage',mood);lakeside(k,mood==='dusk'?'sunset':mood);dressFestival(k,{roof:true,storm:mood==='storm'});return k.finish();}
