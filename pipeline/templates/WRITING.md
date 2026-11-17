# Writing Friendzy Videos

In short-form video the joke matters more than the animation. Use this for every new video or template.

## The rules
1. **Hook in the first second.** Caption plus motion on frame 1, and no logo intro. If the first second
   doesn't make someone curious, nothing after it matters.
2. **One joke per video.** A setup, a turn (the twist) and a payoff (the reaction). Cut everything else.
3. **12–16 seconds.** Long enough for a twist, short enough to rewatch. The QA check fails anything outside 8–20s.
4. **The punchline lands in under 2 seconds** after the turn. Hold the reaction for at least 1 second so it reads.
5. **Silence before the reveal.** Drop the music for the tense beat (templates do this automatically) and
   bring it back on the payoff.
6. **It must work on mute.** The story has to read from faces, captions and the card alone. Captions appear
   word by word for every spoken line, except the prompt, which is already on the card.
7. **Riot drives it.** He sets it up or he's the twist. The friends react in character (see CHARACTERS.md).
8. **Laugh with, never at.** The target always laughs along at the end. Nobody is mocked.
9. **Marketing-safe prompts only.** `prompts.py` filters out anything about fire, fake accounts, dating,
   drinking, fighting and so on. The game has those for older groups; ads don't.

## Hooks that work (`nhie_script.HOOKS`)
- Recognition: "every friend group has one", "it's always the quiet ones", "that one friend who never lies"
- Tension: "the silence said everything", "game night went too far", "we found out more than we wanted to"
- POV: "POV: you asked the wrong question"
- Meme: "nobody:\n{target}:"

Write hooks in lowercase on two short lines. Make up to 3 versions of the same video with different hooks
and see which performs best.

## Picking prompts
`python3 prompts.py nhie 10` lists the best unused prompts from the app's 999. It ranks them by:
- **Length:** 95 characters at most, so the prompt reads aloud in about 4 seconds.
- **Relatability:** words like "accidentally", "pretending" and "secretly" rank higher.

Prompts already in `videos/tracker.csv` are never picked twice.

Good prompts are universal and slightly embarrassing, not scandalous. For example: "walked into a room and
completely forgotten why", "sent a text to the wrong person".

## Making videos
```bash
cd Blender/templates
python3 prompts.py nhie 10                                  # browse prompts
python3 make.py nhie --prompt "Never have I ever ..." --target pip --stills 20,200,300   # quick look
python3 make.py nhie --prompt "Never have I ever ..." --target pip                       # full video
python3 make.py nhie --batch 5                              # 5 videos, rotating Bash / Pip / Rocco
```

Each video lands in `Blender/videos/<name>/`. It contains:
- `<name>.mp4`, plus `<name>_silent.mp4` for posting with a trending sound
- `qa.txt` and `qa_sheet.png`: one frame per second, with TikTok's UI zones shaded red
- `scene.blend`, for hand tweaks

## The feedback loop (`videos/tracker.csv`)
Every video adds a row automatically. After posting, fill in these columns:
- `posted`, `platform`
- `views_24h`, `likes`, `shares`, `comments`
- `avg_watch_pct`, from the platform's analytics

Once a week:
1. Sort by `avg_watch_pct`. That shows which hooks and targets hold attention.
2. Sort by shares. That shows which prompts people send to friends.
3. Move the winning hooks to the top of `HOOKS`, and retire the hooks and prompts that flop.
