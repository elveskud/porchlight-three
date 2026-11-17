// Registry of sets built for the v5 pipeline (one file per set). To add a set: create `<set_id>.js` next to this file with
//   export function build() { /* return a THREE.Group, built from the painting named in the catalog entry */ }
// then add ONE line to REGISTRY below, add its catalog entry in ../catalog.js (build: 'v5') and a light record in
// ../../illustrated/reference-v3/lighting.js. See docs/cards/add-a-set.md.
export const REGISTRY = {
  // gus_garage: () => import('./gus_garage.js'),
};
/** Build a v5 set by id, or return null if it is not a v5 set (use the old buildSet then). */
export async function buildSetV5(id) {
  const load = REGISTRY[id]; if (!load) return null;
  const mod = await load(); const root = mod.build(); root.name = root.name || id; return root;
}
