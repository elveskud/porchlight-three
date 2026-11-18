import {kit} from './kit.js';
import {lakeside,dressFestival} from './festival.js';
export function build({mood='dusk'}={}){const k=kit('memory_lake',mood);lakeside(k,mood==='dusk'?'sunset':mood);dressFestival(k,{storm:mood==='storm'});return k.finish();}
