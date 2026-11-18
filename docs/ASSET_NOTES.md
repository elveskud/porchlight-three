# Asset review — Part A

Reference paintings and sheets govern these models. Geometry is inferred in depth; voices are untouched. Review PNGs show the actual illustrated renderer.

## gus_garage
- Paintings 28/29: broadcast desk and vintage microphone on the left; radios/reel decks on steel shelves, concrete grey floor, muted taupe plaster. Daylight enters rear/right; cool grey-blue shadows. At night a warm desk lamp pools over the kettle, equipment shelves fill both walls and rear doors close.
- `build({mood:"night"})` selects the night arrangement; default is day. No story text added to props.

## walt_garage
- Painting 26: cream plaster, grey-beige concrete, low exposed timber ceiling. Open raised rear garage door is the daylight source, cool mauve shadows below the green wood-sided wagon on the right. Shelves, canoe and workbench left; two bicycles right, boxes and paint cans at floor level; single ceiling lamp.

## archive
- Painting 27: deep symmetrical central aisle, steel shelving on both sides and inner rows, file boxes and rolled plans. Grey-green walls/floor, low ceiling joists, small high rear window. Soft cream pendant pools; shadow stays slate grey. Reel recorder on the right-hand foreground table.

## city_street / city_canal
- Paintings 33/34: brick and grey stone street canyon, cold blue-grey windows, raised paving, bus shelter and clothes rack. White-grey snow banks, soft overcast light; no warm practical pool. Canal variant has a foreground wooden bench, bare tree, lamp, metal railing and a frozen canal to the left; mid-rise skyline beyond.
## motel
- Paintings 35/36: two teal-covered single beds against the left wall, one bedside lamp between them, snowy window and brown door at rear, desk/chair right, heater below window. Pale cream walls, slate grey-green carpet; daylight from rear, cool shadows. Night variant adds warm bedside pool and deep blue exterior.
## town_line
- Painting 30: forked road and blank central wooden board. Golden summer grass and leafy trees on left, grey dry verge/bare trees/puddles on right; no text invented. Light is diffuse, cool grey-blue shadows, no lamps. The abrupt boundary stays exactly as drawn; its explanation is left to the script.
## memory_lake
- Paintings 31/32: existing lake-world terrain/vegetation reused, central low platform with plain cloth between two poles, three bench tables each side, festoon strings. Dusk: gold sand, pink-yellow light from behind platform, cool violet shadows. Storm: blue-violet light, torn cloth, tipped tables, modelled rain/wave crests. No symbols or secret props added.
## car — NEEDS PAINTING
- No painting exists. The brief explicitly authorizes a simple provisional interior: two front seats, rear bench, dashboard, windscreen frame/mirror and scrolling road outside. Neutral sage upholstery and grey dash borrow the visible wagon exterior without asserting an approved interior design. Review and replace colours/layout when user supplies a painting.
- `root.userData.update(t)` scrolls the road deterministically; episode code must call it per drawing. No voice or music is generated here.
## city_archive
- Painting 38: cream tall room, arched rear windows, oak catalogue drawers around walls, two central reading tables with green lamps, front-left desk. Grey floor, diffuse cool daylight from windows, soft purple-grey shadow, no dominant warm cast.
## festival_stage
- Paintings 39/40: timber roof/post stage centred on lakeshore; picnic tables and bench seats on both sides, small four-chair table foreground, festoons and bulbs overhead. Blue dusk with peach horizon, muted sand, cool shadow. Storm variant tips/damages benches and adds rain/waves; plain scenery only.
## city_pool
- Painting 37: six-lane turquoise indoor pool, black T stripes and white lane floats, bleachers on right, wooden foreground bench. High glass walls and steel truss roof, trees beyond. Cool slate/blue lighting, no decorative warm lamps; deck stays clear for actors.

## APIs and alternate paintings
`buildSetV5(id, options)` returns a group. Normal preview IDs also include `gus_garage_night`, `motel_night`, `memory_lake_storm`, `festival_stage_storm`, and `city_canal`; each has its own catalog painting and light record. Existing default IDs remain stable.

## Characters
The seven sheets were inspected, plus the five supplied pose sheets. Shared existing rigs and performance profiles keep all face/mouth and walk controls available. Existing materials are cloned before recolouring.
- **Walt** (`riot`): muted orange fox, cream muzzle/grey brows, olive jumper, brown trousers, white shoulder towel; Riot’s yellow glasses hidden. Calm 0.6 amplitude, slower tempo.
- **Hal** (`bash`): big dark brown bear, tan muzzle/trousers, green ranger shirt, badge, brimmed olive hat and chin cord; 0.72 amplitude with slow broad timing.
- **Bea** (`bash`): tiny warm brown bear, pink dress/collar and pink bow; 0.67 scale and fast, small-character timing.
- **Pip’s mom** (`pip`): cream rabbit, muted inner ears, teal cardigan, white collar, charcoal skirt and brown flats; quiet 0.48 amplitude.
- **Pip’s dad** (`pip`): cream rabbit, blue shirt, brown waistcoat and low round glasses; gentle 0.5 amplitude. Bare fur legs match the sheet.
- **Ledger** (`mayor`): calico cat patches, round low spectacles with chain, green cardigan and grey skirt; Mayor’s sash and pearls hidden. Quiet 0.38 amplitude. Patch shapes are simplified for the shared sculpted head; compare side/back views.
- **Coach** (`bash`): brown otter adaptation with small ears, pale muzzle, tapered tail, navy tracksuit, white piping and stopwatch; 0.88 amplitude. The shared bear head is the nearest base, so the muzzle silhouette needs especially close user review.
- No character voice files/settings were changed. Look remains for user review, not declared approved.

## Review limits / decisions for the user
- Car is the only asset without an approved painting; keep it provisional until you supply one.
- Coach’s otter muzzle and Ledger’s calico patches are the weakest character matches; both retain the shallow shared rig, as requested.
- The festival/memory environments reuse the actual lake terrain and wooded banks, so their far-shore silhouette differs from the simpler paintings. Tables, stage/cloth and lighting variants are modelled from the supplied references.
- The exterior city buildings and bare branches use simple modelling primitives; window views are modelled, not painted cards. The archive has real arched openings along the rear and both side walls.
- Review the supplied comparisons before approving any look. No asset look is labelled user-approved.
