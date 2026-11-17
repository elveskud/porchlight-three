# Ten approved art-direction improvements

This reusable second illustrated pass adds to the earlier 20 rendering treatments. Episode 2 uses it for every 3D picture. It is isolated from the previously delivered Episode 1 sources and films.

| # | Improvement | Saved implementation |
|---|---|---|
| 1 | Group the forest | `art-direction.js` gives the lake forest coherent density openings, varied heights and grouped colors. The hall has four deliberately placed background clusters. Trunks and canopies retain matching transforms. |
| 2 | Stronger lake composition | A continuous pale shoreline sweep emphasizes the curve of the bank; a second curved sandy path leads toward the lookout. Existing terrain, water and staging anchors remain aligned. |
| 3 | Foreground framing | Side groups of shaped leaves, reeds and rounded rocks frame lake and hall views, outside the dialogue stage. |
| 4 | Balanced color areas | Coordinated sand/grass patches break up broad ground areas; the semantic palette lowers the large beach area’s saturation and groups forest greens. |
| 5 | Less rigid architecture | Small deterministic changes to roof/post/wall contours soften straight model shapes. Episode 2’s hall also has an actual doorway, working hinge and corrected stair heights. |
| 6 | Recognizable plants | Thin volumetric tapered leaves, curved stems and delicate midribs replace the simple oval leaves on the saved potted plants and framing groups. |
| 7 | Lived-in rooms | The apartment gains soft cushions, a curved draped throw with folds, framed botanical pictures, ceramics and shelf details. Bash’s room gains modest personal dressing and a functioning drawer for the scripted action. |
| 8 | Selective outlines | Thinner, lighter environment ink and stronger cast contours; painted patches, leaf midribs and cloth folds avoid extra ID-pass outlines. Structural lines remain limited to useful edges. |
| 9 | Shot-specific character appeal | `performance.js` adds deliberate cocky/scared/embarrassed/soft expressions, restrained hands, ears and silhouettes. Episode 2 adds the knock, door contact, seated landing and quiet paw reaction. |
| 10 | Emotional lighting | `look.js` authors warm apartment/desk pools, muted gold outside the hall, quiet cool lake nights and the final lamp transition. Matte two-tone rendering remains in place. |

The source modules are `art-direction.js`, `look.js`, `shaders.js`, `palette.js`, `shapes.js` and `performance.js`. Construct sets and props, call `installArtDirection(modeled)`, then call `createIllustratedLook(...)`. Reset actors before posing each frame, update the look after posing, and render through its color/ID/composite passes. The Episode 2 adapter is a complete integration example.

[Episode 2 and scene explorer](../../../../comparisons/episode02/index.html) · [Apartment proof frame](../../../../comparisons/episode02/reviews/apartment-upgraded.png)

This is authored visual direction based on the approved art. The motion uses deterministic staging, IK and keyed actions; hidden architectural sides remain inferred production geometry.
