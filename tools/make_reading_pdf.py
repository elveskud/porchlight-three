#!/usr/bin/env python3
# Builds the reading copy of the season (scripts/Porchlight_Reading_Script.pdf) from episodes/epNN.txt: a plain screenplay
# for people, with the timecodes, staging cues, sounds and camera notes left out. Needs reportlab (pip install reportlab).
#   python3 tools/make_reading_pdf.py [output.pdf]
import glob, json, os, re, sys
from xml.sax.saxutils import escape

from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Flowable, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = "/System/Library/Fonts/Supplemental"
DATE = "2 November 2026"

NAMES = {"BROOK": "MRS. BROOK", "MAYOR": "THE MAYOR", "HIKER": "THE HIKER", "OWL": "MR. HOOT", "HAL": "BIG HAL",
         "BASHMOM": "BASH'S MOM", "PIPMOM": "PIP'S MOM", "PIPDAD": "PIP'S DAD", "COACH": "COACH REYES", "LEDGER": "MS. LEDGER"}
SPEAKERS = set("RIOT ROCCO BASH PIP WALT PRESTON GUS DOT BEA MARLO".split()) | set(NAMES)
PLACES = {"hall, night": "THE HAUNTED HOUSE, NIGHT", "hall outside, sunset": "OUTSIDE THE HAUNTED HOUSE, SUNSET",
          "hall outside, night": "OUTSIDE THE HAUNTED HOUSE, NIGHT", "apartment": "RIOT AND ROCCO'S APARTMENT",
          "stoop, sunset": "THE STOOP, SUNSET", "stoop, night": "THE STOOP, NIGHT", "lake, day": "THE LAKE, DAY",
          "lake, night": "THE LAKE, NIGHT", "park": "THE PARK", "main street": "MAIN STREET", "gus garage": "GUS'S GARAGE",
          "brook porch": "MRS. BROOK'S PORCH", "motel": "THE MOTEL", "bash home": "BASH'S HOUSE",
          "bash home, night": "BASH'S HOUSE, NIGHT", "archive": "THE TOWN ARCHIVE", "walt garage": "WALT'S GARAGE",
          "town line": "THE TOWN LINE", "pip home": "PIP'S HOUSE", "gym": "THE SCHOOL GYM", "festival stage": "THE FESTIVAL STAGE",
          "city street": "CITY STREET", "walt porch": "WALT'S PORCH", "walt dining": "WALT'S DINING ROOM",
          "walt hallway": "WALT'S HALLWAY", "memory lake": "THE LAKE, THE STORM NIGHT", "city pool": "THE CITY POOL",
          "city archive": "THE CITY ARCHIVE", "car": "THE CAR", "classroom": "THE CLASSROOM"}
# Acting notes worth keeping for a reader; poses, gestures and the rest are the animators' business.
NOTES = {"quietly": "quietly", "whispers": "whispering", "soft": "softly", "yelling": "yelling", "yell": "yelling",
         "deadpan": "deadpan", "nervous": "nervous", "shocked": "shocked", "scared": "scared", "sad": "sad", "gloom": "gloomy",
         "laughing": "laughing", "laugh": "laughing", "chuckle": "chuckling", "sleepy": "sleepy", "asleep": "asleep",
         "yawn": "yawning", "shiver": "shivering", "smug": "smug", "embarrassed": "embarrassed", "cocky": "cocky"}
ARCS = {1: "Summer as Usual", 6: "The Festival Nobody Remembers", 11: "Everybody's Got One", 16: "The House",
        21: "Bring It Back", 26: "Outside", 31: "Everything at Once", 36: "Last Lantern"}
SKIP = ("[hold", "[mood", "[sfx", "[grade", "[storm", "[camera", "[radio", "--")
ACTION_CUE = re.compile(r"^([A-Z]+) (hugs|bumps) ([A-Z]+)\.$|^([A-Z]+) cannonballs\.$")
SEEN_STAGING = re.compile(r"^[A-Z]+ [a-z]")  # "PIP enters left.": engine staging, left out


def cap(word):
    return NAMES.get(word.upper(), word.upper()).title().replace("'S", "'s")


def cue(raw):
    """The (…) of a spoken line, trimmed to one short note for the reader."""
    if not raw:
        return ""
    bits = [b.strip() for b in raw.split(",")]
    kept = [NOTES[b] for b in bits if b in NOTES]
    if "softly" in kept and ("quietly" in kept or "whispering" in kept):
        kept.remove("softly")
    to = [f"to {cap(b[3:])}" for b in bits if b.startswith("to ")]
    return ", ".join((to + kept)[:2])


def insert(line):
    """[fx insert ...] paper, photo and calendar close-ups: what the viewer reads on screen."""
    head = re.search(r"head=(\S+)", line)
    big = re.search(r"big=(\d+)", line)
    words = re.search(r"lines=(\[.*?\])", line)
    out = []
    if head:
        out.append((head.group(1).replace("_", " ") + (f" {big.group(1)}" if big else "")))
    if words:
        out += [w.replace("_", " ") for w in json.loads(words.group(1))]
    return out


def parse(path):
    """One episode as a list of (kind, ...) items, in script order."""
    items, meta, chat, vo = [], {"previously": "", "next": "", "leaves": False}, None, False
    for raw in open(path, encoding="utf-8").read().splitlines():
        line = raw.strip()
        if chat is not None:
            if line and not line.startswith("["):
                chat.append(line)
                continue
            items.append(("screen", "Group chat", chat))
            chat = None
        if not line:
            continue
        if line.startswith("# "):
            meta["title"] = line.split(":", 1)[1].strip()
        elif re.match(r"(next|previously):", line):
            meta[line.split(":")[0]] = line.split(":", 1)[1].strip()
        elif line.startswith("ending_leaves"):
            meta["leaves"] = True
        elif re.match(r"(thumb|grade):", line):
            pass
        elif line.startswith("=="):
            parts = [p.strip() for p in line[2:].split("|")]
            items.append(("scene", parts[0], PLACES[parts[1]]))
            vo = False
        elif line == "[intro]":
            items.append(("intro",))
        elif line.startswith("[vo:"):
            vo = True
        elif line.startswith(SKIP):
            pass
        elif "painting exists" in line:  # a note to ourselves, not a stage direction
            pass
        elif line.startswith("//"):
            items.append(("action", line[2:].strip()))
        elif line.startswith("[chat"):
            chat = []
        elif line.startswith("[text:"):
            items.append(("screen", "On screen", [line[6:-1].strip()]))
        elif line.startswith("[card:"):
            items.append(("card", line[6:-1].strip()))
        elif line.startswith("[game"):
            fields = [f.strip() for f in line.strip("[]").split(":", 1)[1].split("|")]
            items.append(("screen", "Friendzy card", [fields[0]]))
            if line.startswith("[game mlt"):
                items.append(("action", f"Everyone points at {cap(fields[1])}."))
            else:
                items.append(("line", fields[1].upper(), "", fields[2]))
        elif line.startswith("[fx insert"):
            items.append(("screen", "On screen", insert(line)))
        elif line.startswith("[fx"):
            pass
        elif line.startswith("[json:"):
            d = json.loads(line[6:-1].strip())
            g = d.get("game")
            if g:
                items.append(("screen", "Friendzy", [g.get("word") or {"roadtrip": "Road Trip games", "rooms": "A Friendzy room"}.get(g.get("feature"), g.get("feature"))]))
                for k, who in (("clue", "describer"), ("guess", "guesser"), ("say", "who")):
                    if g.get(k):
                        items.append(("line", g.get(who, "riot").upper(), "", g[k]))
            for f in d.get("fx", []):
                if f.get("type") == "label":
                    items.append(("screen", "On screen", [f["text"]]))
        else:
            m = re.match(r"([A-Z]+)\s*(?:\(([^)]*)\))?\s*:\s*(.+)$", line)
            a = ACTION_CUE.match(line)
            if m and m.group(1) in SPEAKERS:
                items.append(("line", m.group(1), "V.O." if vo else cue(m.group(2)), m.group(3)))
            elif a:
                items.append(("action", f"{cap(a[4])} cannonballs." if a[4] else f"{cap(a[1])} {a[2]} {cap(a[3])}."))
            elif not SEEN_STAGING.match(line):
                print(f"{os.path.basename(path)}: not used: {line[:70]}", file=sys.stderr)
    return meta, items


# Styles
for name, file in (("Mono", "Courier New.ttf"), ("Mono-B", "Courier New Bold.ttf"), ("Mono-I", "Courier New Italic.ttf"),
                   ("Mono-BI", "Courier New Bold Italic.ttf"), ("Serif", "Georgia.ttf"), ("Serif-B", "Georgia Bold.ttf"),
                   ("Serif-I", "Georgia Italic.ttf"), ("Serif-BI", "Georgia Bold Italic.ttf")):
    pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, file)))
pdfmetrics.registerFontFamily("Mono", normal="Mono", bold="Mono-B", italic="Mono-I", boldItalic="Mono-BI")
pdfmetrics.registerFontFamily("Serif", normal="Serif", bold="Serif-B", italic="Serif-I", boldItalic="Serif-BI")

INK, AMBER, GREY = "#222018", "#B5761B", "#77705F"
S = lambda name, **k: ParagraphStyle(name, textColor=INK, **k)
ACTION = S("action", fontName="Mono", fontSize=11, leading=14, spaceBefore=8, spaceAfter=2)
SCENE = S("scene", fontName="Mono-B", fontSize=11, leading=14, spaceBefore=18, spaceAfter=2, keepWithNext=1)
WHO = S("who", fontName="Mono-B", fontSize=11, leading=14, leftIndent=62*mm-30*mm, spaceBefore=10, keepWithNext=1)
NOTE = S("note", fontName="Mono", fontSize=11, leading=14, leftIndent=46*mm-30*mm+6*mm, keepWithNext=1)
SAY = S("say", fontName="Mono", fontSize=11, leading=14, leftIndent=20*mm, rightIndent=22*mm)
SCREEN = S("screen", fontName="Mono", fontSize=11, leading=14, leftIndent=8*mm, rightIndent=8*mm)
SCREEN_HEAD = S("screenhead", fontName="Mono-B", fontSize=9.5, leading=12, leftIndent=8*mm, spaceBefore=10, keepWithNext=1)
CENTER = S("center", fontName="Mono", fontSize=11, leading=14, alignment=TA_CENTER, spaceBefore=14)
EP_NUM = S("epnum", fontName="Mono", fontSize=11, leading=14, alignment=TA_CENTER, spaceBefore=10)
EP_TITLE = S("eptitle", fontName="Serif-B", fontSize=24, leading=30, alignment=TA_CENTER, spaceBefore=4, spaceAfter=8)
PREV = S("prev", fontName="Serif-I", fontSize=10.5, leading=15, alignment=TA_CENTER, spaceAfter=4, leftIndent=12*mm, rightIndent=12*mm)
H1 = S("h1", fontName="Serif-B", fontSize=20, leading=26, spaceAfter=8)
H2 = S("h2", fontName="Serif-B", fontSize=12.5, leading=17, spaceBefore=13, spaceAfter=3)
BODY = S("body", fontName="Serif", fontSize=10.5, leading=15.5, spaceAfter=5)
CAST = S("cast", fontName="Serif", fontSize=10, leading=14)
TOC = S("toc", fontName="Serif", fontSize=9.5, leading=12)
TOC_NO = S("tocno", fontName="Serif", fontSize=9.5, leading=12, alignment=2)
TOC_ARC = S("tocarc", fontName="Serif-B", fontSize=9.5, leading=12)


class Mark(Flowable):
    """Invisible: a bookmark, a link target and a note of the page it lands on."""
    pages = {}

    def __init__(self, key, title, level=0):
        super().__init__()
        self.key, self.title, self.level = key, title, level
        self.width = self.height = 0

    def wrap(self, *a):
        return 0, 0

    def draw(self):
        c = self.canv
        c.bookmarkPage(self.key)
        c.addOutlineEntry(self.title, self.key, self.level, closed=self.level == 0)
        Mark.pages[self.key] = c.getPageNumber()
        if self.level == 1:
            c._running_head = self.title


def p(text, style):
    return Paragraph(escape(text), style)


def episode(n, meta, items):
    out = [PageBreak(), Mark(f"ep{n}", f"{n}. {meta['title']}", 1)]
    out.append(p(f"EPISODE {n}", EP_NUM))
    out.append(p(meta["title"], EP_TITLE))
    if meta["previously"]:
        out.append(p(f"Previously: {meta['previously']}", PREV))
    i = 0
    while i < len(items):
        it = items[i]
        if it[0] == "scene":
            out.append(p(f"{it[2]} — {it[1]}".upper(), SCENE))
        elif it[0] == "intro":
            out.append(p("PORCHLIGHT TITLE AND THEME. EPISODE CARD.", CENTER))
        elif it[0] == "action":
            out.append(p(it[1], ACTION))
        elif it[0] == "card":
            out.append(p(f"TITLE CARD: {it[1]}", CENTER))
        elif it[0] == "screen":
            out.append(p(it[1].upper() + ":", SCREEN_HEAD))
            out += [p(x, SCREEN) for x in it[2]]
        elif it[0] == "line":
            who, note = it[1], it[2]
            said = [it[3]]
            while i + 1 < len(items) and items[i + 1][:3] == ("line", who, note):  # one speech, not a line per breath
                i += 1
                said.append(items[i][3])
            out.append(p(NAMES.get(who, who) + (" (V.O.)" if note == "V.O." else ""), WHO))
            if note and note != "V.O.":
                out.append(p(f"({note})", NOTE))
            out.append(p(" ".join(said), SAY))
        i += 1
    out.append(p("The porch light clicks off. Autumn leaves fall through its last glow." if meta["leaves"] else "The porch light clicks off.", CENTER))
    out.append(p(f"NEXT: {meta['next']}".upper(), CENTER))
    return out


def front(eps):
    out = [PageBreak(), p("Before you read", H1)]
    out.append(p("Porchlight is an animated series. This is a read of all 40 episodes of season one, in story order, about three to four minutes each. Everything here is a first draft, and nothing is locked yet.", BODY))
    out.append(p("The story", H2))
    out.append(p("Maple Hollow is a small lake-and-forest town where everyone is an animal. Riot, a 20-year-old fox lifeguard, his roommate Rocco and their younger friends Bash and Pip spend a long summer on game nights, dumb plans and small mysteries, until the small mysteries start to connect.", BODY))
    out.append(p("It should feel warm, funny and sometimes spooky, never truly creepy: the mystery and summer adventure of Gravity Falls, the quiet moments of Adventure Time, and plans that escalate out of control like American Dad. After an episode you should want to play a game with your friends.", BODY))
    out.append(p("The porch light on Riot and Rocco's stoop means game night tonight. Every episode ends with it clicking off.", BODY))
    out.append(p("The script gives away the whole season, including the ending, so this page stops short of it. Please keep it to yourself.", BODY))
    out.append(p("How to read it", H2))
    out.append(p("It's laid out like a screenplay: scene headings, what we see, then who speaks. Anything marked ON SCREEN or GROUP CHAT is text the viewer reads. A FRIENDZY CARD is a prompt from Friendzy, the real party-game app the friends play on.", BODY))
    out.append(p("The cast", H2))
    cast = [("Riot, 20, fox", "The heart. Lifeguard, big talker, starts the plans."),
            ("Rocco, 20, raccoon", "The noticer. Deadpan, always snacking, “between jobs”."),
            ("Bash, 17, bear", "The push. Competitive, big energy, hasn't won yet."),
            ("Pip, 17, rabbit", "The listener. Nervous on the surface, sees people clearly."),
            ("Mrs. Brook, turtle", "Old neighbour by the lake. Iced tea, wind chimes, a lot of watching."),
            ("Walt, fox", "Riot's dad. Tells the stories about Riot's grandpa."),
            ("Dot, 8, rabbit", "Pip's little sister. Notices odd things nobody listens to."),
            ("Gus, goat", "Runs the town radio from his garage."),
            ("The Mayor, cat", "Runs the town. Means well, can't decide."),
            ("Preston, peacock", "Developer who wants to buy the park."),
            ("Big Hal, bear", "Park ranger. Calm and big-hearted."),
            ("Mr. Hoot, owl", "Bash and Pip's teacher. Sincerely assigns summer homework."),
            ("The hiker, human", "Passes through town. Says it's November."),
            ("Lord Puddles, frog", "Riot and Rocco's pet. Sits by the porch light.")]
    t = Table([[Paragraph(f"<b>{escape(a)}</b>", CAST), p(b, CAST)] for a, b in cast], colWidths=[50*mm, 105*mm], hAlign="LEFT")
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 1.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5)]))
    out.append(t)
    return out


def contents(eps):
    rows, arcs = [], []
    for n, meta, _ in eps:
        if n in ARCS:
            arcs.append(len(rows))
            rows.append([Paragraph(f"Arc {(n + 4) // 5}: {escape(ARCS[n])}", TOC_ARC), ""])
        rows.append([Paragraph(f'<a href="#ep{n}">{n}. {escape(meta["title"])}</a>', TOC), Paragraph(str(Mark.pages.get(f"ep{n}", "")), TOC_NO)])
    t = Table(rows, colWidths=[140*mm, 15*mm], hAlign="LEFT")
    style = [("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0.6), ("BOTTOMPADDING", (0, 0), (-1, -1), 0.6)]
    style += [("TOPPADDING", (0, r), (-1, r), 5) for r in arcs]
    t.setStyle(TableStyle(style))
    return [PageBreak(), p("Contents", H1), t]


class Cover(Flowable):
    def wrap(self, w, h):
        self.w, self.h = w, h
        return w, h

    def draw(self):
        c, cx = self.canv, self.w / 2
        c.setFillColor(AMBER)
        c.circle(cx, self.h * 0.72, 7*mm, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("Serif-B", 44)
        c.drawCentredString(cx, self.h * 0.60, "Porchlight")
        c.setFont("Serif-I", 15)
        c.drawCentredString(cx, self.h * 0.55, "Season One: reading script")
        c.setFont("Serif", 12)
        c.drawCentredString(cx, self.h * 0.50, "Episodes 1–40")
        c.setFillColor(GREY)
        c.setFont("Serif", 10.5)
        c.drawCentredString(cx, self.h * 0.10, f"First draft, {DATE}")
        c.drawCentredString(cx, self.h * 0.10 - 16, "Confidential. Contains the full story and its ending.")


def furniture(c, doc):
    n = c.getPageNumber()
    if n == 1:
        return
    c.saveState()
    c.setFillColor(GREY)
    c.setFont("Serif", 8.5)
    c.drawString(30*mm, 12*mm, "Porchlight · first draft · confidential")
    c.drawRightString(A4[0] - 25*mm, 12*mm, str(n))
    head = getattr(c, "_running_head", "")
    if head:
        c.setFont("Serif-I", 8.5)
        c.drawRightString(A4[0] - 25*mm, A4[1] - 13*mm, head)
    c.restoreState()


def build(eps, path):
    doc = BaseDocTemplate(path, pagesize=A4, title="Porchlight, Season One: reading script", author="Porchlight", subject=f"First draft, {DATE}")
    frame = Frame(30*mm, 20*mm, A4[0] - 55*mm, A4[1] - 40*mm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPageEnd=furniture)])
    story = [Cover()] + front(eps) + contents(eps)
    for n, meta, items in eps:
        if n in ARCS:
            story.append(Mark(f"arc{n}", f"Arc {(n + 4) // 5}: {ARCS[n]}", 0))
        story += episode(n, meta, items)
    doc.build(story)


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "scripts/Porchlight_Reading_Script.pdf")
    eps = []
    for f in sorted(glob.glob(os.path.join(ROOT, "episodes/ep[0-9][0-9].txt"))):
        meta, items = parse(f)
        eps.append((int(re.search(r"ep(\d+)", f).group(1)), meta, items))
    build(eps, path)  # first pass finds the page numbers, second prints them in the contents
    build(eps, path)
    print(path, sum(1 for e in eps for i in e[2] if i[0] == "line"), "lines")


if __name__ == "__main__":
    main()
