// Registry of sets built for the v5 pipeline (one file per set). To add a set: create `<set_id>.js` next to this file with
//   export function build() { /* return a THREE.Group, built from the painting named in the catalog entry */ }
// then add ONE line to REGISTRY below, add its catalog entry in ../catalog.js (build: 'v5') and a light record in
// ../../illustrated/reference-v3/lighting.js. See docs/cards/add-a-set.md.
export const REGISTRY = {
  city_pool: () => import('./city_pool.js'),
  city_archive: () => import('./city_archive.js'),
  car: () => import('./car.js'),
  town_line: () => import('./town_line.js'),
  motel: () => import('./motel.js'),
  city_street: () => import('./city_street.js'),
  archive: () => import('./archive.js'),
  walt_garage: () => import('./walt_garage.js'),
  gus_garage: () => import('./gus_garage.js'),
};
/** Alternate paintings share geometry while remaining selectable by the normal preview and episode API. */
export const VARIANTS = {
  gus_garage_night: {base:'gus_garage', options:{mood:'night'}},
  motel_night: {base:'motel', options:{mood:'night'}},
  city_canal: {base:'city_street', options:{view:'canal'}},
};
/** Build a v5 set by id, or return null to use the existing set builder. */
export async function buildSetV5(id, options={}) {
  const variant=VARIANTS[id],load=REGISTRY[variant?.base||id];if(!load)return null;
  const mod=await load(),root=mod.build({...variant?.options,...options});
  root.name=id;root.userData.id=id;return root;
}
