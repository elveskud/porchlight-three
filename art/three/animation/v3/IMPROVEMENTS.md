# The 100 animation improvements

This register maps every approved item to the saved implementation. Episode 3 uses the shared acting, speech, locomotion, interaction, follow-through and camera systems. Actions absent from its script have silent, seekable examples in the motion library. Existing episode films and earlier style modules remain preserved.

[Watch Episode 3](../../../../comparisons/episode03/index.html) · [Explore the motion library](../../../../comparisons/episode03/source/render.html?library=1) · [Machine-readable register](improvements.json)

| # | Improvement | Implementation | Application |
|---|---|---|---|
| 1 | Stronger key poses | `performance.js` / `poseAt`: Authored character poses and phrase envelopes. | Episode 3 dialogue; `listen` study |
| 2 | Clearer anticipation | `performance.js` / `poseAt`: Pre-line negative-time anticipation pulse. | Episode 3 dialogue; `listen` study |
| 3 | Better weight shifts | `locomotion.js` / `applyGait`: Pelvis translation/lean follows the supporting gait phase. | Dot and Pip walking; `walk` study |
| 4 | Asymmetric resting poses | `performance.js` / `poseAt`: Different arm rests, brow offsets and head tilts. | Episode 3 dialogue; `listen` study |
| 5 | Smoother pose transitions | `performance.js` / `poseAt`: Smooth enter/leave envelopes and persistent prior emotions. | Episode 3 dialogue; `listen` study |
| 6 | Body-led movement | `performance.js` / `poseAt`: Eyes lead head movement; hips lead gait; torso leads rises. | Episode 3 dialogue; `listen` study |
| 7 | Controlled overshoot | `performance.js` / `poseAt`: Short anticipation/accent/recovery curves around the key pose. | Episode 3 dialogue; `listen` study |
| 8 | Better settling | `performance.js` / `poseAt`: Diminishing post-line arm and ear recovery. | Episode 3 dialogue; `listen` study |
| 9 | Clearer silhouettes | `performance.js` / `poseAt`: Separated elbow and hand targets keep gestures readable around the body. | Episode 3 dialogue; `listen` study |
| 10 | Persistent emotions | `performance.js` / `poseAt`: Previous emotion fades over 2.2 seconds instead of resetting. | Episode 3 dialogue; `listen` study |
| 11 | Riot’s movement style | `performance.js` / `poseAt`: Riot profile: quick timing and broad gestures. | Episode 3 dialogue; `listen` study |
| 12 | Rocco’s movement style | `performance.js` / `poseAt`: Rocco profile: low amplitude and delayed looks. | Episode 3 dialogue; `listen` study |
| 13 | Bash’s movement style | `performance.js` / `poseAt`: Bash profile: broad confidence, nervous/scared contraction. | Episode 3 dialogue; `listen` study |
| 14 | Pip’s movement style | `performance.js` / `poseAt`: Pip profile: restrained gestures and thoughtful delays. | Episode 3 dialogue; `listen` study |
| 15 | Mood-dependent movement | `performance.js` / `poseAt`: Quiet/soft beats reduce gesture amplitude and alter posture. | Episode 3 dialogue; `listen` study |
| 16 | Delayed listening reactions | `performance.js` / `poseAt`: Per-character processing delay before a listening nod. | Episode 3 dialogue; `listen` study |
| 17 | Interrupted gestures | `performance.js` / `poseAt`: Most-recent active event and interrupted-gesture study. | Episode 3 dialogue; `interrupt` study |
| 18 | Staggered laughter | `performance.js` / `poseAt`: Delayed second-actor laugh pulses in the study. | Silent motion study; `laugh` study |
| 19 | Purposeful silent acting | `performance.js` / `poseAt`: Silent faces, listening and held reactions retain breathing. | Episode 3 dialogue; `listen` study |
| 20 | Emotional recovery | `performance.js` / `poseAt`: Emotion hold and gesture recovery use separate durations. | Episode 3 dialogue; `listen` study |
| 21 | Sharper eye movements | `performance.js` / `attention / lookAtObject`: Eyes move deliberately between actual scene targets. | Episode 3 dialogue; `listen` study |
| 22 | Eyes before head turns | `performance.js` / `attention / lookAtObject`: Eye attention begins 0.10 seconds before the head. | Episode 3 dialogue; `listen` study |
| 23 | Accurate gaze targets | `performance.js` / `attention / lookAtObject`: World-space head-to-head gaze targets. | Episode 3 dialogue; `listen` study |
| 24 | Close-object focus | `performance.js` / `attention / lookAtObject`: Bounded eye convergence toward nearby notebook/props. | Episode 3 dialogue; `listen` study |
| 25 | Thought-driven blinking | `performance.js` / `blinkAt`: Blinks around speech starts/ends and thought changes. | Episode 3 dialogue; `blink` study |
| 26 | Varied blink timing | `performance.js` / `blinkAt`: Character-specific periods plus short/double thought blinks. | Episode 3 dialogue; `blink` study |
| 27 | More expressive eyelids | `performance.js` / `expression / poseAt`: Separate sleepy, suspicious, soft and frightened lid values. | Episode 3 dialogue; `listen` study |
| 28 | Independent eyebrows | `performance.js` / `expression / poseAt`: Independent left/right brow offsets. | Episode 3 dialogue; `listen` study |
| 29 | Expressive mouth corners | `performance.js` / `expression / poseAt`: Smile/frown and asymmetry remain under speech shapes. | Episode 3 dialogue; `listen` study |
| 30 | Facial tension changes | `cast.js` / `applyActor`: Muzzle patches tighten subtly with tense expressions. | Episode 3 dialogue; `listen` study |
| 31 | More precise speech timing | `performance.js` / `speechShape / applyActor`: Local Rhubarb sound cues and a short next-cue anticipation blend. | Episode 3 dialogue; `speech` study |
| 32 | Word emphasis | `performance.js` / `speechShape / applyActor`: Actual WAV RMS energy adjusts syllable mouth/jaw emphasis; phrase gesture accents remain authored. | Episode 3 dialogue; `speech` study |
| 33 | Clear lip closures | `performance.js` / `speechShape / applyActor`: Closed A/X mouth shapes cover bilabial closures. | Episode 3 dialogue; `speech` study |
| 34 | Better rounded vowels | `performance.js` / `speechShape / applyActor`: E/F rounded shapes retain different widths and heights. | Episode 3 dialogue; `speech` study |
| 35 | Jaw participation | `cast.js` / `speechShape / applyActor`: Lower skull vertices, muzzle and mouth move with the jaw value. | Episode 3 dialogue; `speech` study |
| 36 | Natural speech pauses | `performance.js` / `speechShape / applyActor`: Rest shape is selected when no active speech cue exists. | Episode 3 dialogue; `speech` study |
| 37 | Cleaner sentence endings | `performance.js` / `speechShape / applyActor`: Speech stops at the recording end, with a clean rest mouth. | Episode 3 dialogue; `speech` study |
| 38 | Whisper-specific animation | `performance.js` / `speechShape / applyActor`: Quiet dialogue reduces mouth/jaw amplitude and body gestures. | Episode 3 dialogue; `speech` study |
| 39 | Visible breathing | `performance.js` / `speechShape / applyActor`: Small character-specific torso breath cycles. | Episode 3 dialogue; `speech` study |
| 40 | Laugh synchronization | `performance.js` / `speechShape / applyActor`: Recorded speech energy and laugh/chuckle pulses drive facial/body rhythm. | Episode 3 dialogue; `laugh` study |
| 41 | Progressive finger curls | `interactions.js` / `shapeHand / reachContact`: Finger closure uses three delayed curl envelopes. | Prop interactions and motion studies; `transfer` study |
| 42 | Useful thumb movement | `interactions.js` / `shapeHand / reachContact`: Thumb opposition varies by grip type. | Prop interactions and motion studies; `transfer` study |
| 43 | Better wrist angles | `interactions.js` / `shapeHand / reachContact`: Grip-specific wrist angles and bounded pose values. | Prop interactions and motion studies; `transfer` study |
| 44 | Curved hand paths | `interactions.js` / `shapeHand / reachContact`: Pickup/transfer paths include a controlled vertical arc. | Prop interactions and motion studies; `transfer` study |
| 45 | Speech-driven gestures | `performance.js` / `poseAt`: Gesture accents are modulated by actual speech energy. | Episode 3 dialogue; `point` study |
| 46 | Cleaner gesture endings | `performance.js` / `poseAt`: Gesture envelopes leave time to lower and rest the paw. | Episode 3 dialogue; `point` study |
| 47 | Reliable contact | `interactions.js` / `shapeHand / reachContact`: IK follows world-space knob, drawer, switch and notebook targets. | Prop interactions and motion studies; `transfer` study |
| 48 | Object-specific grips | `interactions.js` / `shapeHand / reachContact`: Phone, pencil, cup, notebook, clipboard and knob grip profiles. | Prop interactions and motion studies; `transfer` study |
| 49 | Two-handed interactions | `interactions.js` / `twoHanded`: Both wrists support the notebook at measured edge targets. | Pip writing and reading; `two-hands` study |
| 50 | Grip adjustments | `interactions.js` / `adjustGrip`: Timed loosening/regripping pulse adjusts fingers and thumb. | Prop interactions and motion studies; `transfer` study |
| 51 | Foot rolls | `locomotion.js` / `gait / applyGait / solveLeg`: Heel/toe pitch uses the actual ellipse sole height to keep contact. | Dot and Pip paths; motion studies; `walk` study |
| 52 | Planted feet | `locomotion.js` / `gait / applyGait / solveLeg`: Stance feet use fixed world anchors and analytic two-bone IK. | Dot and Pip paths; motion studies; `walk` study |
| 53 | Walking hip motion | `locomotion.js` / `gait / applyGait / solveLeg`: Pelvis height, lateral translation and lean follow the gait phase. | Dot and Pip paths; motion studies; `walk` study |
| 54 | Varied stride rhythm | `locomotion.js` / `gait / applyGait / solveLeg`: Slow, ordinary, jogging and panic studies have different timing/stride/lift. | Dot and Pip paths; motion studies; `walk` study |
| 55 | Planted turning pivots | `locomotion.js` / `pivotTurn`: The root turns around a fixed left-foot pivot; right foot steps around. | Pip turns toward his bedroom door; `turn` study |
| 56 | Matched walking speed | `locomotion.js` / `gait / applyGait / solveLeg`: Foot phase comes from world travel distance, not elapsed time alone. | Dot and Pip paths; motion studies; `walk` study |
| 57 | Better starts and stops | `locomotion.js` / `gait / applyGait / solveLeg`: Path progress eases into/out of motion; feet keep distance-based timing. | Dot and Pip paths; motion studies; `walk` study |
| 58 | Terrain-aware stepping | `locomotion.js` / `gait / applyGait / solveLeg`: Gait accepts a sampled ground-height function for each foot. | Ground-sampling API and walking studies; `walk` study |
| 59 | Leg clearance | `locomotion.js` / `gait / applyGait / solveLeg`: Separated left/right tracks and knee-forward IK keep legs clear. | Dot and Pip paths; motion studies; `walk` study |
| 60 | Distinct running styles | `locomotion.js` / `gait / applyGait / solveLeg`: Run-specific stance, hip height, lift, arms and frightened acting. | Dot and Pip paths; motion studies; `panic-run` study |
| 61 | Complete sitting actions | `locomotion.js` / `seatPose / settleSeat / risePose`: Body lowers onto a chair while planted feet remain on the floor. | Episode 3 seating and motion studies; `sit` study |
| 62 | Complete standing actions | `locomotion.js` / `seatPose / settleSeat / risePose`: Forward lean and leg extension coordinate with root height. | Episode 3 seating and motion studies; `stand` study |
| 63 | Seat response | `secondary.js` / `seatResponse`: Reusable cushion compression/recovery is driven by seat weight. | Episode 3 seating and motion studies; `sit` study |
| 64 | Seated foot placement | `locomotion.js` / `seatPose / settleSeat / risePose`: Classroom foot rails, Brook’s stool and stoop support; intentional dangle where appropriate. | Episode 3 seating and motion studies; `sit` study |
| 65 | Seated posture changes | `locomotion.js` / `seatPose / settleSeat / risePose`: Seated study changes torso lean/sideways balance without moving the chair. | Episode 3 seating and motion studies; `seated-shift` study |
| 66 | Floor-level pickups | `locomotion.js` / `crouchPose`: Deep hip/knee crouch reaches the top of a floor-level object. | Silent motion study; `pickup` study |
| 67 | Convincing knocking | `interactions.js` / `knock`: World-space knocking target with repeated contact/retraction. | Silent motion study; `knock` study |
| 68 | Door-following hands | `interactions.js` / `followHinge`: The hand follows the moving knob until a timed release. | Silent motion study; `door` study |
| 69 | Better die rolling | `interactions.js` / `rollingCube`: The cube rotates around successive contact edges and settles on a face. | Silent motion study; `die` study |
| 70 | Drawer coordination | `interactions.js` / `followDrawer`: The gripping paw follows the actual moving drawer handle. | Silent motion study; `drawer` study |
| 71 | Prop inertia | `interactions.js` / `heldLag / transfer / placeOnSurface`: Bounded acceleration-derived prop lag with a smaller cup limit. | Episode 3 props and motion studies; `transfer` study |
| 72 | Seamless object transfers | `interactions.js` / `heldLag / transfer / placeOnSurface`: Transfers keep a canonical world size and follow absolute world trajectories. | Episode 3 props and motion studies; `transfer` study |
| 73 | Object settling | `interactions.js` / `placeOnSurface / settleObject`: Short damped landing offsets follow a surface placement. | Episode 3 props and motion studies; `pickup` study |
| 74 | Careful carrying | `interactions.js` / `carryOrientation / heldLag`: Cup orientation cancels wrist rotation and permits only tiny carrying tilt. | Episode 3 props and motion studies; `carry-cup` study |
| 75 | Visible prop reveals | `episode.js` / `readBook / notebookInsert`: A held notebook insert exposes its text before the strikeout. | Pip’s notebook insert; `two-hands` study |
| 76 | Hoodie follow-through | `secondary.js` / `followThrough`: Small deterministic hem deformation responds to movement. | Episode 3 props and motion studies; `wave` study |
| 77 | Tail follow-through | `secondary.js` / `followThrough`: Tail chain response follows speed and authored turn rate. | Episode 3 props and motion studies; `wave` study |
| 78 | Ear follow-through | `secondary.js` / `followThrough`: Ear response lags the turn/body accent. | Episode 3 props and motion studies; `wave` study |
| 79 | Stable accessories | `cast.js` / `spectacles / attached head geometry`: Glasses remain attached to the 3D head at their reference position. | Episode 3 props and motion studies; `turn` study |
| 80 | Secondary-motion collisions | `secondary.js` / `followThrough`: Tail samples test furniture bounds and adjust the chain root. | Episode 3 props and motion studies; `wave` study |
| 81 | Cleaner action arcs | `interactions.js` / `transfer / pickupArc`: Gesture, pickup and transfer paths use controlled curves. | Episode 3 acting and motion studies; `pickup` study |
| 82 | Stronger speed contrast | `performance.js` / `poseAt / ease`: Preparation, accent, hold and recovery use different timing. | Episode 3 acting and motion studies; `point` study |
| 83 | Selective extra drawings | `performance.js` / `sampleClock`: Default whole drawings hold at 12 fps; marked fast windows use 24 fps. | Episode 3 acting and motion studies; `wave` study |
| 84 | Directional smears | `secondary.js` / `orientSmears`: Smears follow wrist action and are rotated by wave/point direction. | Episode 3 acting and motion studies; `wave` study |
| 85 | Volume-preserving squash | `secondary.js` / `volumeScale`: Squash changes transverse scale by the reciprocal square root of height. | Episode 3 acting and motion studies; `laugh` study |
| 86 | Camera-aware reaches | `interactions.js` / `cameraAwareHands`: Small hand-width compensation improves camera-facing reaches. | Episode 3 acting and motion studies; `point` study |
| 87 | Better three-quarter poses | `performance.js` / `attention`: Head-width compensation and shallow volumetric facial shapes remain readable. | Episode 3 acting and motion studies; `turn` study |
| 88 | Readable extreme turns | `performance.js` / `attention`: Head turns are bounded; body turns preserve actual side/back volume. | Episode 3 acting and motion studies; `turn` study |
| 89 | Varied group reactions | `secondary.js` / `groupReaction`: Other characters react with small staggered pulses. | Episode 3 acting and motion studies; `laugh` study |
| 90 | Coordinated discoveries | `secondary.js` / `stagedDiscovery`: Eyes and heads turn toward a shared world target in sequence. | Silent motion study; `discover` study |
| 91 | Motivated camera movement | `direction.js` / `setCamera / frameActors / authoredMove`: Camera moves support Pip’s final essay line and important inserts. | Episode 3 shot plan; `listen` study |
| 92 | Matched eyelines between shots | `performance.js` / `attention`: Eye targets use the actual partner’s world-space face position. | Episode 3 shot plan; `listen` study |
| 93 | Cuts during actions | `direction.js` / `setCamera / frameActors / authoredMove`: Camera cuts sample the same absolute actor/action clock. | Episode 3 shot plan; `listen` study |
| 94 | Consistent screen direction | `direction.js` / `setCamera / frameActors / authoredMove`: Fixed scene coordinates, facing and authored camera sides preserve travel direction. | Episode 3 shot plan; `listen` study |
| 95 | Better camera easing | `direction.js` / `setCamera / frameActors / authoredMove`: Camera moves use a smooth deterministic easing curve. | Episode 3 shot plan; `listen` study |
| 96 | Breathing room around actions | `prepare.py` / `timing / path contacts / cues`: Quiet dialogue and physical actions receive authored pauses and recovery time. | Episode 3 timeline and soundtrack; `listen` study |
| 97 | Footstep synchronization | `prepare.py` / `timing / path contacts / cues`: Footstep audio times come from the same path distance/easing as foot plants. | Episode 3 timeline and soundtrack; `listen` study |
| 98 | Interaction sound synchronization | `prepare.py` / `timing / path contacts / cues`: Click and notebook sounds use the actual interaction clock. | Episode 3 timeline and soundtrack; `listen` study |
| 99 | Automated motion checks | `verify-episode03.cjs` / `all-frame / visibility / seek / action checks`: All-frame transforms, foot anchors, volume, face visibility and seek repeatability are checked. | Saved verification reports; `listen` study |
| 100 | An approved motion library | `library.js` / `MOTIONS / createMotionLibrary`: A curated, tested library of 24 editable examples across eight actors, ready for user review. | Motion-library viewer; `walk` study |

The motion is authored procedural animation with analytic IK, controlled deformations and sampled collision checks. The tests establish technical behavior; the final artistic judgment remains with the user. Ground-aware walking accepts a height sampler; Episode 3 uses the actual flat stage heights and a planted turn. Speech emphasis uses the original WAV energy and authored phrase accents rather than a new word-alignment model.
