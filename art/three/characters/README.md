# Porchlight character shapes — reference refinement

Open `tree.html` through the project’s local HTTP server (`http://127.0.0.1:8765/tree.html`). Source: the project-root `tree.js`.

The user asked for the 3D cast to look closer to the existing characters and less inflated. The primary reference is `art/refs/cast-for-gemini/lineup.png`; side sheets in `art/refs/side-views/` support the profile review.

Changes:

- Defined, beveled head contours replace spherical skulls. Riot and Rocco’s cheek silhouettes are part of the head geometry.
- Head depth is 0.70 units; the previous skull spheres were approximately 1.47–1.52 units deep before facial protrusions. Front character widths remain recognizable.
- Eyes, masks and muzzles sit close to the face. Smaller facial projections and restrained two-tone shading remove the glossy toy look.
- Riot has proper cat-eye glasses, his cream cheek pattern, pointed ears and jacket seams. Rocco has the dark eye mask and light forehead patch. Pip has leaf-shaped ears and connected front teeth; Bash retains his round ears and tan muzzle.
- Hoodie depth changes from 0.86 to 0.50 units with less corner rounding, thinner sleeves, flatter paws and no separate spherical shoulder joints.
- Legs increase from 0.70 to 0.97 units and are continuous skinned meshes through the knees. The foot-contact calculation uses the new bone lengths.
- Fox/raccoon tails use continuous tapered skin with actual bones and vertex-colour markings, replacing overlapping balls/cylinders.
- **View** offers front, three-quarter and side review. The control column leaves all four characters visible; scripted scene mode retains the full canvas width.

This is a revision of the standalone Three.js interpretations, not a change to the shared Blender cast or episode pipeline. Side/back surfaces remain interpretations of the 2D designs.

## Review images

- [Before / after comparison](previews/comparison.jpg)
- [New front view](previews/after-front.png)
- [New three-quarter view](previews/after-quarter.png)
- [New side view](previews/after-side.png)
- [Walk](previews/walk.png), [wave](previews/wave.png), [cheer](previews/cheer.png), [facepalm](previews/facepalm.png)
- [Verification report](verification.json)

## Verify again

Start the project HTTP server on port 8765, then run:

```sh
npm --prefix tools/three-sets install
npm --prefix tools/three-sets run verify:characters
```

The check uses installed Google Chrome (or `CHROME_PATH`) and Playwright. It checks the four rigs offline, finite geometry and transforms, head/body depths, leg lengths, skin weights, sampled bone-deformed vertices through every animation, camera views, per-character animation selection, and the lake environment. It saves the report and review poses without rendering a movie.
