# Maple Hollow — completed town master plan

Claude’s lake, street grid, creek, railway, mountains, and original landmark anchors form the basis of this plan. The completed atlas adds the missing story homes, connects every physical site, and accounts for every discovered story location. It is a proposed production layout for review, not an approved survey of story geography.

## Open the town

From the project root:

```sh
python3 tools/three-sets/serve.py --page town
```

Open `http://127.0.0.1:8765/maple%20hollow%20tree.js/index.html`. The viewer uses the locally bundled Three.js runtime and needs no network connection or npm installation.

- [3D overview](output/town-overview.png)
- [Top-down plan](output/town-plan-view.png)
- [Printable PDF master plan](output/master-plan.pdf)
- [Printable vector master plan](output/master-plan.svg)
- [Printable PNG master plan](output/master-plan-print.png)
- [Complete plan, roads, routing graph, and location evidence](output/master-plan.json)
- [Editable town GLB](output/maple-hollow.glb)
- [Town GLB including optional drafts and erected festival stage](output/maple-hollow-with-drafts.glb)
- [Browser verification](output/verification.json)
- [Blender import verification](output/blender-verification.json)

## What is laid out

35 physical sites: 27 sourced sites or landscape features plus 8 retained draft additions. The map accounts for 50 local story locations by grouping rooms under their actual buildings. It catalogues 15 off-town locations and one mobile car interior separately. The town has 196 background homes, 1,100 trees, and four creek bridges.

| District | Layout |
|---|---|
| Lake & park | Swimming beach, lookout, east dock, large rock, snack shack, lakeside park and festival shore. The apartment sits on the eastern approach. |
| Hall hill | The old festival hall is north of the lake, with front and back entrances and one back room. A completed hill approach reaches it. |
| West woods | Mrs. Brook’s lakeshore home, forest walks and Big Hal’s ranger station. |
| Main Street | Civic building and basement archive, square, notice board, Gus’s radio garage and small shop frontage. |
| Family neighbourhoods | Bash, Pip, Walt and Grandpa have distinct plots. Classroom and gym share one school campus. |
| Town edge | The town line and outward roads; retained draft infrastructure stays labelled optional. |

The apartment, hall, lookout, Brook’s porch and Walt’s porch reuse exterior geometry from the first-six episode set pack. Every one of that pack’s 20 variants has a link from its corresponding town site. Other rooms are mapped to buildings and linked to source evidence; this task does not create complete new interiors for the remaining season.

## Story continuity

- The old hall remains a single building, with its back room and both doors; no second haunted house is introduced.
- Memory lake is a temporal variant of the same physical lake.
- The festival shore exists in the early-season map; its erected stage appears only when **Later-season festival stage** is enabled.
- Summer vegetation stays inside the town. Turning trees are confined to the outer edge. **Night** changes lighting, not the season.
- The town-hall archive is grouped with the Mayor’s civic building. No second municipal building is required by the plan.
- The road-trip city and Pip’s new bedroom stay outside Maple Hollow. The car is mobile. Their travel distances are not invented.
- The source names and evidence come from the existing `maple_hollow_locations.json`, scripts and bible. That Blender staging catalog is unchanged: its isolated room coordinates are not town-map coordinates.

## Optional ideas from Claude’s draft

The mill, lumber yard, marina, campground, fire lookout, train depot, water tower and berry farm remain draft additions. They are hidden by default and shown with draft labels when **Claude’s draft additions** is enabled. Their presence in the model does not approve them as story canon. No new business names, family histories or plot events were added.

## Coordinates and routes

The layout spans roughly 1,500 × 1,000 proposed planning metres. Map X goes east; map Y goes south. The renderer maps one planning metre to 0.02 Three.js units, centred at map coordinate (750, 500). GLB export restores metre scale by applying a factor of 50 to the model and camera. Buildings remain stylized interpretations; dimensions, orientation, street labels and hidden sides are inferred.

Routes use a graph split at actual road/trail intersections and site access points. Every site is reachable. Road centre lines are checked against the lake, and background homes are checked against landmark parcels. Route distance is measured along this proposed network. Displayed walk time uses an illustrative 1.3 m/s; it does not establish travel timing in the scripts.

Only Main Street is an established road name. Labels such as “Lakeshore loop” and “Family-home lane” describe this plan’s connections and are not new official street names. Roads copied from the draft were repaired where disconnected, and the Main Street endpoint that projected into the lake was trimmed to the loop.

## Site register

| # | Site | Planning coordinate | Story locations in this plot | Status |
|---|---|---|---|---|
| 01 | Riot & Rocco’s apartment | 675.0, 312.0 | apartment, stoop, apartment_kitchen | Sourced location; proposed layout |
| 02 | Old festival hall | 470.0, 108.0 | hall, hall_outside, back_room, back_door, front_door, town_hill | Sourced location; proposed layout |
| 03 | Lifeguard lookout | 370.1, 563.0 | lifeguard_tower | Sourced location; proposed layout |
| 04 | Lakeside park | 555.2, 630.2 | park | Sourced location; proposed layout |
| 05 | Festival shore | 600.8, 520.8 | festival_stage | Sourced location; proposed layout |
| 06 | Mrs. Brook’s house | 142.1, 400.0 | brook_porch | Sourced location; proposed layout |
| 07 | Big Hal’s ranger station | 118.0, 150.0 | ranger_station | Sourced location; proposed layout |
| 08 | Town square | 840.0, 510.0 | town_square | Sourced location; proposed layout |
| 09 | Town hall & archive | 842.0, 450.0 | town_hall, mayor_office, archive | Sourced location; proposed layout |
| 10 | Gus’s radio garage | 990.0, 450.0 | gus_garage | Sourced location; proposed layout |
| 11 | School & gym | 1000.0, 590.0 | school, classroom, school_gym | Sourced location; proposed layout |
| 12 | The town line | 1458.0, 430.0 | town_line | Sourced location; proposed layout |
| 13 | Old mill | 830.0, 190.0 | — | Draft addition |
| 14 | Lumber yard | 868.0, 262.0 | — | Draft addition |
| 15 | Marina | 666.4, 442.0 | — | Draft addition |
| 16 | Lake church | 760.0, 670.0 | church | Sourced location; proposed layout |
| 17 | Campground | 85.0, 690.0 | — | Draft addition |
| 18 | Fire lookout | 1250.0, 262.0 | — | Draft addition |
| 19 | Train depot | 900.0, 950.0 | — | Draft addition |
| 20 | Water tower | 1320.0, 750.0 | — | Draft addition |
| 21 | Berry farm | 612.0, 910.0 | — | Draft addition |
| 22 | Bash’s family home | 775.0, 755.0 | bash_house, bash_home, bash_kitchen, bash_bathroom, bash_hallway | Sourced location; proposed layout |
| 23 | Pip’s family home | 975.0, 755.0 | pip_home, pip_garage, pip_kitchen, pip_hallway | Sourced location; proposed layout |
| 24 | Walt’s house | 515.0, 680.0 | walt_dining, walt_hallway, walt_porch, walt_garage | Sourced location; proposed layout |
| 25 | Grandpa’s house | 350.0, 685.0 | grandpa_house | Sourced location; proposed layout |
| 26 | East dock | 643.8, 472.1 | dock | Sourced location; proposed layout |
| 27 | Lake snack shack | 489.1, 589.5 | snack_shack | Sourced location; proposed layout |
| 28 | Lake & beach | 424.7, 573.0 | lake, lake_shore, memory_lake | Sourced location; proposed layout |
| 29 | Big rock by the dock | 631.6, 483.9 | big_rock | Sourced location; proposed layout |
| 30 | The forest | 115.0, 320.0 | forest | Sourced location; proposed layout |
| 31 | Forest trails | 220.0, 190.0 | forest_trails | Sourced location; proposed layout |
| 32 | Main Street | 1120.0, 470.0 | main_street | Sourced location; proposed layout |
| 33 | Road out of town | 1505.0, 446.0 | road_out | Sourced location; proposed layout |
| 34 | Main Street shops | 1170.0, 510.0 | main_street_shops | Sourced location; proposed layout |
| 35 | Town notice board | 857.0, 496.0 | notice_board | Sourced location; proposed layout |

## Use the atlas

Search for a place, a room (for example “bathroom”), or an episode (“ep03”). Select a map landmark or a location-list item, then inspect the rooms and episode-set links. **Plan view** provides north-up panning and zooming; **3D town** supports orbiting. **Fit town** restores the overview. Other controls show labels, parcels, optional draft sites, the festival stage, and vegetation. Choose endpoints and enable **Show route** to draw the road/trail path.

**Save map PNG** saves the current rendered view. **Plan JSON** exports the complete catalog and route graph. **Town GLB** exports the current scene/layer state, named objects, metre scale, current camera and lights. Forest instances become ordinary editable meshes for Blender. Labels, parcel outlines and route overlays are UI aids and are omitted from GLB. Import with Blender’s **File → Import → glTF 2.0**.

## Rebuild and verify

```sh
npm --prefix tools/three-sets install
npm --prefix tools/three-sets run verify:town
python3 tools/three-sets/draw-town-plan.py
```

The verifier uses installed Google Chrome; set `CHROME_PATH` for another Chromium binary. It starts a temporary local server and blocks external requests. It tests all 66 location assignments, every site’s route reachability and symmetry, submerged roads, parcel conflicts, first-six set links, focus and map picking, room/episode search, district and off-town filters, layer controls, day/night, actual PNG/JSON/GLB downloads, export scale and forest instances, mobile layout, and invalid URLs. It saves reproducible previews, both GLBs, the master-plan JSON and a verification report.

Source files: `plan.json` (sites, room grouping, evidence), `geography.js` (lake and roads), `routes.js` (road graph), `world.js` (Claude’s massing plus completed town), `landmarks.js` (new and reused exterior geometry), `town.js` / `town.css` / `index.html` (atlas). The source `plan.json` is the editable master; `output/` is generated.

The delivered printable PNG and PDF were rendered from the SVG using CairoSVG. The SVG generator itself needs only Python’s standard library.
