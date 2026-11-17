# How to make a Porchlight episode

Claude does the building and fixing. Your job is to look at things, say what's wrong and when, and say "OK" before each next step.

Never let Claude upload, post, commit or push anything.

---

## Step 1: Start

1. Open the `Porchlight` folder in VS Code.
2. Open Claude Code.
3. Paste this (change NN to the episode number, like 02):

> Read CLAUDE.md, DECISIONS.md and docs/FRIEND_GUIDE.md. Find the Blender folder (it may be at ~/Desktop/Blender.nosync). Run doctor.py. We're working on episode NN. Don't render anything yet.

4. Wait until Claude says **ALL GOOD**. If it doesn't, say: "Fix what's wrong and run it again."

---

## Step 2: Find out what's missing

Paste this:

> Check episode NN with make.py --check. Tell me what's missing (characters, places, props). For any missing picture, give me the Gemini prompt, the file name and where to save it.

If Claude says a picture is missing:

1. Copy the prompt into Gemini.
2. Make 2 or 3 versions and pick the best one.
3. It should look like the picture `lake_day_v2.jpg` (same soft painted style).
4. Throw it away if it has words or letters in it, people or animals painted in, or a different style.
5. Save the good one in `art/gemini/new/` with the name Claude gave you.
6. Tell Claude: "The picture is saved." Claude will show you a test picture. Say OK or say what's wrong.

If Claude says a **character** is missing, it will build one, show you a picture of it and play you a sample of the voice. Say OK or say what's wrong.

Do one missing thing at a time.

---

## Step 3: Make the stills (preview pictures)

Paste this:

> Make the stills for episode NN. Show me stills_sheet.png and list the shots with their numbers.

Wait a few minutes. Then open the picture and look at each shot, one by one. Ask yourself:

- Is everyone there who should be?
- Is anyone floating, sinking or standing inside something?
- Is the person talking actually in the shot?
- Are faces cut off at the edge of the screen?
- Is it the right place and time of day (day or night)?
- Is the text easy to read, spelled right, and not covering a face?
- Does it match what happens in the script?

Write down every problem with the **shot number**. Then paste it to Claude like this:

> Problems:
> 1. Shot 4: Bash is floating above the dock.
> 2. Shot 7: Rocco is talking but the camera shows Pip.
> 3. Shot 12: the text covers Riot's face.
>
> Fix these and show me new stills of only those shots.

Keep doing this until all the shots look good. Then say:

> Stills approved.

---

## Step 4: Make the video

Paste this:

> Render episode NN full with --jobs 6 and --reuse-voices. When done, read qa.txt, tell me any problems and give me the video path.

It takes about 10 minutes. Don't run heavy apps while it works.

If it stops halfway, say: "It stopped, run it again." It won't redraw what was already done.

---

## Step 5: Watch the video

Open the video (QuickTime or VLC). Watch it **two times**:

- The first time, just watch it like a normal viewer.
- The second time, go slowly and pause a lot.

Every time something looks or sounds wrong, **pause and write down the time**, like this:

> 0:42, Bash slides across the floor without walking

If the problem lasts a while, write the start and end time: **1:05 to 1:12**.

Things to look for:

- Mouth not moving when someone talks, or not matching the words
- Someone sliding, floating, jumping or flickering
- Black or frozen frames
- A voice that sounds wrong, says a word wrong, or is cut off
- Music too loud over talking
- Long weird silences
- A joke that goes too fast (needs a pause)
- Anything mean or not family-friendly

---

## Step 6: Tell Claude what to fix

Paste your list like this:

> Problems in the episode NN video:
> 1. 0:14, Riot's mouth doesn't move on "Wait, what?"
> 2. 0:42 to 0:46, Bash slides instead of walking.
> 3. 1:05, there's a black flash.
> 4. 1:31, Pip says "Friendzy" wrong.
> 5. 2:10, music is too loud, can't hear Rocco.
> 6. 2:48, cut is too fast after the joke, add a pause.
>
> Find which scene each one is in. Fix only those scenes, not the whole episode. Fix the script first; ask me before changing any shared code. Tell me if a fix will redraw the whole episode.
> Then show me stills of only the fixed shots.

When the stills look good, paste:

> Make a short preview clip of each fixed part so I can check it.

Watch the clips. If they look good, paste:

> Now render the full episode again with --reuse-voices.

Only the fixed scenes get redrawn. Everything else is reused, so this is faster.

Then go back to **Step 5** and watch again. Check that the old problems are gone and nothing new broke.

Repeat until the video has no problems.

---

## Step 7: If a scene needs new artwork

If a scene looks empty or wrong because a picture is missing, ask Claude:

> What new artwork would make this scene better? Give me the Gemini prompt, file name and where to save it.

Then do the same as in Step 2: make it in Gemini, check it, save it, and tell Claude.

---

## Step 8: Done

When the video is clean, paste:

> Episode NN is approved. Write down what we changed in DECISIONS.md. Give me the paths to the video, thumbnail and chapters.txt.

Send those paths to Lazare. **Don't upload the video anywhere.**

---

## If something goes wrong

- Claude is stuck or there's an error: say "Use the pipeline-debug skill."
- Something looks bad but you're not sure why: say "Use the anim-review skill on these stills."
- You're not sure about a decision: stop and ask Lazare.
