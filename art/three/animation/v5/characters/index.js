// Characters built for the v5 pipeline (one file per character). To add one: create `<id>.js` next to this file with
//   import {registerCharacter} from '../cast.js';
//   export function register() { registerCharacter('<id>', {base: 'bash', profile: {...}, extend: (rig) => {/* recolour + add parts */}}); }
// then add `<id>` to CHARACTERS below. See docs/cards/add-a-character.md. Never edit animation/v3 or v4.
export const CHARACTERS = [
  'walt', 'hal', 'bea',
];
export async function registerAll() { for (const id of CHARACTERS) (await import(`./${id}.js`)).register(); }
