# Writing an episode (the plain-text script)

An episode is a plain `.txt` file in `episodes/`. The pipeline turns it into the episode JSON (written beside it as
`epNN.json`), directs it (shots, reaction cuts, who talks to whom, how hard each line is played) and renders it.
Anything you write yourself wins over the engine's choices.

```
# Porchlight 2: Dare House
next: Summer Homework
thumb: DON'T TOUCH IT

== Cold open | hall, night | riot
[text: Maple Hollow. Late.]
RIOT carries a flashlight.
RIOT (determined, whispers): Again.

== The dare | lake, day | riot (lifeguard), rocco, bash, pip
BASH enters left.
[game td: Touch the door of the haunted house. | bash | Easy.]
BASH (nervous): Easy. Totally easy.
ROCCO: ...
```

## The pieces
| Write | What it does |
|---|---|
| `# Porchlight 2: Dare House` | series, episode number, title (first line) |
| `next:` / `previously:` / `thumb:` | the next episode's name, a recap line, 2–4 thumbnail words |
| `grade: summer` / `grain: on` | the episode's colour grade (summer, autumn, winter, faded; lighter at night) and a soft film grain |
| `== Chapter \| place, time \| who (costume), who` | a new scene. Places: lake (day/night), stoop (sunset/night), apartment, hall. A change of time of day fades through black. The first scene gets letterbox bars (the cold open). |
| `NAME: words` | a line |
| `NAME (nervous): words` | a face: happy, hype, cocky, shocked, nervous, suspicious, sad, soft, scared, embarrassed, determined, yelling, smug, pouting, sleepy... |
| `NAME (take): words` | a move: take, laugh, cheer, nervous, yell, shrug, facepalm, wave, thumbs, present, hop, double_take, point, munch, fan, shiver, stare, cross, hips, nod, shake, clap, count, peace, horns, rock, gloom, yawn, stretch, scratch, chuckle, crouch, pockets, lean, slouch (see `Blender/characters/refs/moves_sheet.png`) |
| `NAME (whispers): words` | a quiet, emotional line (also `quietly`, `softly`) |
| `NAME (joke): words` | a punchline: snap zoom and a soft sting |
| `NAME (to pip): words` / `(looks up)` / `(looks at bash)` / `(reaction rocco)` | who it's said to, where they look, whose face we cut to after |
| `NAME: ...` | a silent beat: acted (face, look, move), not voiced |
| `NAME enters left.` / `NAME exits right.` | walking on and off |
| `NAME walks to the step.` | walking to another spot mid-scene |
| `NAME sits on the sofa l.` / `stands at the tower.` | where they are (otherwise sitters take free seats on their own) |
| `NAME is asleep.` / `NAME carries a phone.` | asleep for the scene / a phone, flashlight or cup in the paw (a phone is held up and tapped between lines) |
| `RIOT high-fives BASH.` / `bumps` / `hugs` / `puts a paw on PIP's shoulder` | two of them touching: they step to arm's length, the camera takes a two-shot |
| `BASH picks up the cup.` / `puts down` / `throws it at the lake` / `drops` / `sips` | props: thrown things fly, bounce and splash |
| `[text: ...]` `[card: Later that night.]` `[sfx: door]` | on-screen text, a time card, a sound |
| `[storm]` `[fade]` `[whip]` `[letterbox]` `[mood: tense]` `[hold: 2]` | weather, transitions (fade through black, whip pan), the scene's mood (`normal`, `tense` tilts the camera, `party`, `soft` = piano), seconds to hold at the end |
| `[intro]` | the Porchlight title with the full theme |
| `[camera: close riot]` | frame the scene yourself (the engine then leaves this scene's camera alone) |
| `[chat]` then `Riot: LIGHT'S ON` lines, then a blank line | the group chat |
| `[game nhie: prompt \| target \| confession]` | Never Have I Ever (also `mlt: prompt \| target`, `td: dare \| player \| performance`). Real app prompts only. |
| `[fx snow]` `[fx door box_px=[420,150,560,430] at=1]` | a big effect (table below). Words are `key=value` with no spaces; in text, `_` stands for a space |
| `[vo: rocco]` `[radio]` | heard, not seen, in this scene (over other shots), and the voice comes through a small speaker. Keep them in the scene's cast list |
| `[grade: autumn]` / `ending_leaves: on` (header) | this scene's colour grade / leaves falling through the last porch-light glow |
| `[json: {...}]` | anything else from `docs/ANIMATION_TODO.md`, as JSON |
| `--` | a new beat in the same scene |
| `// note` | a comment |

## The big effects (`[fx ...]`, code in `Blender/templates/episode_fx.py`)
All times are seconds from the start of the scene. `_px` values are painting pixels (1024x572). Effects last the scene unless it says otherwise.
| Effect | Options |
|---|---|
| `snow`, `fog`, `leaves` | `n`, `at`; fog: `top`, `clear=true`; leaves: `size` |
| `breath` | `who=["bash"]` (default everyone) |
| `clouds` | flat storm clouds hiding the sky: `sky_px` (the skyline; default is the lake painting), `leave` (seconds, they roll away). `rain` adds them by itself on the lake sets; add them to `[storm]` scenes at the lake |
| `rain` | a storm you control: `loop=1.8` repeats exactly, `freeze=10` stops the drops in the air, `stop_at=2` ends it. Use instead of `[storm]` for those |
| `echo` | the gold memory look: `at`, `n` (people), `run=4` (a child runs through us), `flash=9` (white, gone) |
| `crowd` | townsfolk: `row_px=[x0,y,x1]`, `n`, `size`, `mood=bob/cheer/run`, `run_at` |
| `swarm` | fireflies along `path=[[px,py,seconds],...]`: `n`, `spread`, `at` |
| `porch_ring` | porch lights on, one by one, on the land: default is the lake; `points=[[px,py,by_water],...]` for other sets; `at`, `every`, `room` |
| `lantern`, `lake_fill` | the last lantern (`from_px`, `to_px`, `at`, `dur`, `size`) and every lantern off the water (`water_px=[x0,y,x1]`, `n`, `at`) |
| `door` | opens by itself: `box_px=[x0,y0,x1,y1]`, `at`, `dur`, `hinge=left/right`, `color`, `open` |
| `die` | rolls along `path`, always lands on the lantern: `size` |
| `hop` | a critter hops along `path`: `piece`, `width`, `scarf=true` |
| `paw`, `tail` | only a paw (`at`, `to=[x,y]`, screen units) or the edge of a tail (`at`, `y`) |
| `insert` | a paper object fills the frame: `kind=calendar/program/notebook/postcard/paper/sign` (sign = wooden board on a stake, painted letters), `head`, `big`, `lines=[...]`, `smudge=[line numbers]` (those lines are never drawn), `faded=[line numbers]` (old pencil), `mark=true` (the lantern drawing), `address=[...]` (postcard), `image=path`, `at`, `for` |
| `grade_shift` | colour changes during a scene: `from`, `to`, `from_a`, `to_a`, `at`, `dur` |

## Checking a draft in seconds
`python3 make.py episode --script ../../Porchlight/episodes/ep02.txt --format horizontal --check` prints the length,
the chapters, every shot the engine picked (and why), and anything it noticed (very long lines, scenes where
nobody does anything physical). Nothing is voiced or rendered.

## Rules from the Ep 3 review (9 Nov 2026), enforced by `--check`
- **No dead holds.** `[hold: N]` over 2.5 s with nothing moving stops the check. `//` notes are never animated, so act the moment out with silent lines (`DOT (stare): ...`, `BROOK (chuckle): ...`), an exit or walk, or an `[fx insert ...]`. Only a truly intended still moment may use `[json: {"quiet_ok": true}]`.
- **No silent scenes.** A beat with no spoken line needs a walk, an exit, an fx or a voice-over. Pip reading his notes aloud beats 16 s of Pip on a bed.
- **No seats that face away.** A spot marked `"away"` in the set JSON (6th value) can't be sat on. Have the character stand instead (Mrs. Brook's rocking chair).
- **Every scene needs a reason the audience can see.** If a scene exists for a hidden hint (Pip's moving box), connect it to the scene before (Pip looks at the garage door, walks out, and we follow him) and give the character a visible reaction.

## Animation QA (12 Nov 2026, `Blender/templates/animqa.py`)
`--check` now also prints `WARN anim` / `STOP anim` lines, and the full render stops on the same STOP lines with real voice timings:
- **Still stretch (STOP over 8 s, warning over 5 s):** nobody moves: no `do:` move, walk, effect or standing speaker (seated people talking are only mouths). Fix with a move on a line (`ROCCO (nod): ...`), a small action, an insert, or `[json: {"quiet_ok": true}]` when stillness is the point. This is the Ep 4 stoop scene.
- Warnings: shots under 1.2 s or close-ups over 8 s, jump cuts (same framing twice), gaps over 1.5 s between lines with nothing happening, a reaction too fast or too late after a punchline, a set with no background life, a face that fights its line (a shout with a soft face), a held prop that vanishes in the next scene at the same place.

After the render, `qa.txt` gets an `anim:` line per check, `animqa.txt` lists every flagged moment with its time, and `problem_reel.mp4` strings those moments together (labelled) so they can be watched in a minute. Checked from the bake's own record: listeners who don't react to a 2.5 s+ line, eyelines (speaker looks away from who they talk to), faces that never change in a scene, a big move pulling focus mid-line, two characters doing the same move on the same frame, a gesture or move repeated too often, feet floating or sinking, sliding (skating) walks, position jumps, a sitter who isn't seated, bodies standing inside each other. From the saved scene and video: heads cut off by the top of the frame, faces behind foreground layers, people swapping sides across a cut, props disappearing mid-scene, a face much brighter than a night/sunset set (sticker look). From the voice files: a shut mouth on loud speech or an open one in silence.

During the render (`liveqa.py`): a check gate stops serious problems before drawing starts, every frame is checked as it lands, and each finished scene gets a preview in `previews/` (watch with Porchlight `tools/progress.py`).

Voices are now heard by speech recognition right after voicing; a garbled line (missing words, a mumble) is retaken automatically up to 3 times (`voice_check.txt`).
