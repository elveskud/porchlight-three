// Per-set light and shadow, read from the saved paintings (art/gemini/sets). One record per set id.
// There is no global warm palette: every set gets its own key light direction, shadow colour and tint.
//   light      world-space direction TOWARD the key light (sun, moon or lamp side)
//   shadowMul  multiplied into a surface colour to get its painted shadow colour (cool grey-blue in daylight,
//              purple at sunset, warm brown indoors, deep blue at night)
//   tint       multiplied into everything lit (the colour of the air)
//   pool       a warm pool of light on the ground (lamp or sun glow): position, strength (bigger = tighter), colour
//   bg         flat background behind the sky dome
// CHECKED BY EYE against the painting (17 Nov): park, lake, main_street, stoop_sunset, stoop_night, apartment, lake_night.
// The other 13 records (storm sets, hall, school, Walt's rooms, Pip's and Bash's rooms, classroom, garage, porches) keep the
// values the old look used or are estimates from the set name: compare each with its painting when that set is first built.
//   notes      what in the painting this comes from
const DAY = {tint: [1, .99, .97], shadowMul: [.78, .86, .94], distant: '#a5bb99', bg: '#8fd0f2'};
export const LIGHTING = {
  gus_garage_night:{tint:[.36,.46,.61],shadowMul:[.54,.63,.83],light:[-.6,.65,.4],distant:'#3d515e',bg:'#293c50',inside:true,night:true,pool:{pos:[-2.55,1.15,.35],power:.14,color:[1,.82,.5]},notes:'29: closed doors, desk-lamp pool, deep blue-grey shelves'},
  gus_garage: {tint:[.96,.99,1],shadowMul:[.71,.77,.84],light:[.65,.7,-.4],distant:'#9db8a8',bg:'#91cce5',inside:true,notes:'28: neutral concrete and plaster; daylight through rear and right opening'},
  park:        {...DAY, light: [-.45, .85, .35], notes: '23_park_day: high sun from the left, soft green-blue shadows under the oak'},
  lake:        {...DAY, light: [-.45, .85, .35], notes: 'lake_day_v2: same sun as the park'},
  main_street: {tint: [.98, 1, 1.02], shadowMul: [.70, .79, .96], light: [-.60, .70, .40], distant: '#9db8a8', bg: '#8fd0f2', notes: '55_main_street_day_mailbox: strong sun from the left, hard cool grey-blue shadows on the paving'},
  stoop_sunset:{tint: [1, .88, .76], shadowMul: [.78, .64, .88], light: [-.75, .35, .50], distant: '#d9a47a', bg: '#f2b36e',
                pool: {pos: [3.25, 2.55, -.65], power: .16, color: [1, .72, .46]}, notes: 'stoop_sunset_v2: low orange sun from the left, purple shadows, brick stays red'},
  stoop_night: {tint: [.46, .56, .78], shadowMul: [.58, .66, .92], light: [-.30, .70, .25], distant: '#345169', bg: '#203d60',
                pool: {pos: [3.25, 2.55, -.65], power: .16, color: [1, .83, .59]}, notes: 'stoop_night_v2: cool moonlight, warm lantern pool'},
  apartment:   {tint: [1, .94, .84], shadowMul: [.80, .68, .70], light: [-.60, .55, .60], distant: '#d9bfa0', bg: '#d5b894', inside: true,
                pool: {pos: [-2, 1, -1.7], power: .045, color: [1, .83, .59]}, notes: 'apartment_night_v2: warm lamp at the left, string lights; shadows warm brown'},
  lake_night:  {tint: [.38, .50, .68], shadowMul: [.55, .64, .92], light: [.40, .65, -.25], distant: '#345169', bg: '#203d60', night: true,
                pool: {pos: [-.4, .5, 1], power: .055, color: [1, .83, .59]}, notes: 'lake_night_v2: moon from behind-left, dark blue shadows'},
  lake_storm:  {tint: [.30, .38, .52], shadowMul: [.50, .58, .84], light: [.25, .5, -.2], distant: '#2a3d52', bg: '#18283d', night: true, notes: 'storm: darker than night, nearly shadowless'},
  hall:        {tint: [.18, .27, .34], shadowMul: [.55, .62, .85], light: [0, .8, .3], distant: '#345169', bg: '#203d60', night: true, inside: true, notes: 'old festival hall, torch-lit'},
  hall_outside:{tint: [.86, .78, .68], shadowMul: [.76, .66, .86], light: [-.7, .4, .5], distant: '#c9a87c', bg: '#eac995', notes: 'hall_outside_sunset'},
  classroom:   {tint: [1, .99, .91], shadowMul: [.82, .82, .94], light: [-.5, .8, .3], distant: '#c9bda0', bg: '#d5b894', inside: true, pool: {pos: [-3, 2, 0], power: .045, color: [1, .9, .7]}, notes: 'classroom: daylight through windows'},
  bash_home:   {tint: [.53, .66, .82], shadowMul: [.58, .64, .88], light: [-.4, .7, .4], distant: '#345169', bg: '#34495e', inside: true, pool: {pos: [2, 1.5, -2.7], power: .25, color: [1, .83, .59]}, notes: 'bash_room_night: cool room, warm lamp'},
  pip_home:    {tint: [.65, .73, .85], shadowMul: [.62, .68, .90], light: [-.4, .7, .4], distant: '#345169', bg: '#30485a', inside: true, pool: {pos: [1.8, 1.5, -2.7], power: .18, color: [1, .83, .59]}, notes: 'pip_room_night'},
  pip_garage:  {tint: [.65, .76, .78], shadowMul: [.62, .70, .86], light: [-.3, .8, .4], distant: '#345169', bg: '#2f434c', inside: true, notes: 'garage: cool concrete, one bulb'},
  brook_porch: {...DAY, tint: [1, .96, .9], light: [-.6, .5, .5], pool: {pos: [-1, 1, 0], power: .035, color: [1, .83, .59]}, notes: 'brook_porch'},
  school_gym:  {tint: [1, .98, .92], shadowMul: [.80, .80, .92], light: [-.2, .9, .3], distant: '#c9bda0', bg: '#d5b894', inside: true, notes: 'school gym: overhead lights'},
  walt_dining: {tint: [1, .92, .80], shadowMul: [.80, .68, .70], light: [-.4, .7, .5], distant: '#d9bfa0', bg: '#d5b894', inside: true, notes: 'walt_dining_evening'},
  walt_dining_storm: {tint: [.62, .66, .78], shadowMul: [.58, .64, .86], light: [-.3, .6, .4], distant: '#2a3d52', bg: '#18283d', inside: true, notes: 'storm outside the window'},
  walt_hallway:{tint: [.95, .9, .82], shadowMul: [.78, .70, .78], light: [-.3, .7, .5], distant: '#d9bfa0', bg: '#d5b894', inside: true, notes: 'hallway'},
  walt_porch:  {tint: [1, .9, .78], shadowMul: [.78, .66, .86], light: [-.6, .4, .5], distant: '#d9a47a', bg: '#eac995', notes: 'walt_porch_evening'},
};
const FALLBACK = DAY;
/** The record for a set id; unknown ids still render (day light) but print one warning. */
const warned = new Set();
export function lightingFor(id) {
  const rec = LIGHTING[id];
  if (!rec) {
    if (!warned.has(id)) { warned.add(id); console.warn(`[look v3] no lighting record for set "${id}"; using day light. Add it to reference-v3/lighting.js`); }
    return {...FALLBACK, light: [-.45, .85, .35]};
  }
  return rec;
}
