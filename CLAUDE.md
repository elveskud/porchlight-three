# CLAUDE.md — Porchlight Three

Animated series Porchlight (Riot 🦊, Rocco 🦝, Bash 🐻, Pip 🐰, Maple Hollow), Three.js only. Started 17 Nov 2026 from the old `~/Desktop/Porchlight.nosync`, which stays an untouched archive (read it only if the user asks; same for `~/Desktop/Blender`).

**Read in this order, and nothing else until a task needs it:** `AGENTS.md` (rules) → `INDEX.md` (where things are) → the one card in `docs/cards/` for your task. `DECISIONS.md` (short) and `HANDOFF.md` when you need status. Full history: `docs/archive/DECISIONS_FULL.md`.

## Binding (short)
- Process: decide with the user (numbered questions, options, a recommendation; "you decide" = decide and say what you picked) → write it into `DECISIONS.md` at once. Scripts approved by the user; build in illustrated Three.js; read the QA and fix before handing over. Never post, schedule, commit or push unless asked.
- Look: modeled 3D, painted-storybook 2D feel (held on twos, ink boil, paper, painted shadows, squash and stretch). **No occluder/painted-card pipeline** (user, 17 Nov). The pictures in `art/gemini/sets` govern layout, furniture, colour and light. The code-drawn cast is the cast. Hold group shots; cut only for a story reason.
- Reuse versioned modules; do not rewrite finished ones. Current: `art/three/animation/v5`, `art/three/illustrated/reference-v3`, template build `comparisons/episode04/source/episode-v5.js`.
- Voices: Kokoro + Chatterbox, settings in `voice/speak.py`, **never change per episode**. All sound and music generated.
- Writing: laugh with, never at; no cringe, sarcasm or romance; all four friends are boys; Friendzy natural and real, never "download now"; fans must not solve the secret before the finale; the porch light clicking off ends every episode.
- User: lives in Tbilisi (UTC+4), targets EU and US; often dictates, so read generously and confirm anything ambiguous; likes plain, short language.
