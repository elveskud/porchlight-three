# Reference-led Three.js sets

These reusable builders revise the nine locations visible in Episode 3, using the exact existing paintings recorded in [reference-manifest.json](reference-manifest.json). They are full-volume Three.js geometry. Reference pictures are shown in the comparison gallery, not placed behind the actors as scenery.

[Picture / episode comparisons](../../../../comparisons/episode03/revised/references.html) · [Watch revised Episode 3](../../../../comparisons/episode03/revised/) · [Orbit the sets](../../../../comparisons/episode03/revised/source/render.html?inspect=1&time=6)

| Set | Concrete revisions from the picture |
|---|---|
| Classroom | Tall left windows with foliage beyond the glass, six paired desks, wood wainscoting, green framed board, paneled teacher desk/globe/books, clock, bookcase and a closed ceiling |
| Sunset / night stoop | Lower blue paneled door, brick courses and window sills, step railings, woven bicycle basket, planted street trees, opposite houses, globe streetlights and night pools; the sunset and night use distinct palettes |
| Main Street | Blue/purple/ochre left storefronts, striped scalloped awnings, blank fascias, near notice board/bench/blue mailbox, flagstone pavement, separate asphalt road, masonry clock tower, garage shopfront and forest/hills |
| Brook’s porch | View out across the lake, right-hand siding and screened door, covered white deck, rear rail/stairs, curved rocking chair, round tea table/pitcher/glasses, grouped flower pots and paper chimes |
| Pip’s bedroom | Checked bed with finials, bedside drawers/clock/book, tree print, night window/town lights, writing desk with articulated lamp and pencil cup, stocked bookcase, open door/garage glimpse and green rug |
| Pip’s garage | Cool gray walls and concrete, paneled door with dark upper windows/hinges, vertical/overhead tracks, shelf jars and folded cloth, coiled hose, spoked bicycle, ceiling bulb and floor light pool; exactly one sealed moving box |
| Old hall | True front gable with timber joints, dark boarded windows, front porch/posts/stairs/bunting, louvered cupola, curved path, hill slope and distant lake/roofs |
| Night lake | Retained expanded 3D environment with a blue night shoreline/water/forest/architecture palette, crescent moon and modeled stars |

`applyReferenceSets(modeled,dressing)` rebuilds the scene roots before material conversion. Existing actor action coordinates, switch contact and the story’s beanbag are retained. Per-mesh `referenceColor` and `referenceSet` metadata lets `art/three/illustrated/reference-v1/` preserve each location’s surface colors instead of applying the previous generic warm room palette. The window foliage and small wall illustration are shallow modeled details on their real surfaces; the buildings, rooms, trees and furniture retain depth.

The original shared set collection and the earlier films remain available. The drawings establish visible design; dimensions, unseen sides and camera staging remain modeled interpretations. The gallery supports visual review of fidelity; technical checks do not establish a pixel-identical match.
