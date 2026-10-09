"""Draws the lesson's character portraits as flat SVG avatars (assets/char_<who>.svg).

The SME decks ask for "Tara's photo", "Kabir's photo", "Pari's photo" ... - no character art was supplied, so each one
is drawn here in one shared style: a round portrait (white rim, soft coloured ground), head and shoulders, bold simple
shapes, no outlines thinner than 3px so it reads at 70-120px. One file per character; re-run after a change:

    python tools/make_avatars.py            (writes into ../assets)

Both MTG2A01_L03_S01 and MTG2A01_L03_S02 ship this script; each writes only the characters its card names
(card.json -> CHARS below).
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# who -> look. skin / hair / cloth / bg colours, hair style, extras
LOOKS = {
    "tara":  dict(skin="#F2C29B", shade="#E3A97E", hair="#3B2416", cloth="#FF6FA8", trim="#FFD1E3", bg="#FFE3EE",
                  hair_style="pigtails", ribbon="#FF3D8B"),
    "kabir": dict(skin="#E6B087", shade="#D39770", hair="#2A1A10", cloth="#3D8BFF", trim="#BFDBFF", bg="#DDEEFF",
                  hair_style="short"),
    "maa":   dict(skin="#E9B48C", shade="#D49A70", hair="#22150D", cloth="#2FAE6B", trim="#FFD23F", bg="#E3F7EA",
                  hair_style="bun", bindi=True, earrings=True, saree=True),
    "pari":  dict(skin="#DDA57D", shade="#C98D64", hair="#2B1A12", cloth="#9B6BFF", trim="#E1D3FF", bg="#EFE6FF",
                  hair_style="braid", band="#FFC21A"),
    "aaru":  dict(skin="#C98E66", shade="#B47952", hair="#1E120B", cloth="#FF9A3C", trim="#FFE0BF", bg="#FFEBD6",
                  hair_style="curly"),
    "amma":  dict(skin="#D9A076", shade="#C2875D", hair="#1F140D", cloth="#D63384", trim="#FFC94A", bg="#FFE0EC",
                  hair_style="lowbun", bindi=True, earrings=True, saree=True),
}


def avatar(L):
    sk, sh, hr, cl, tr, bg = L["skin"], L["shade"], L["hair"], L["cloth"], L["trim"], L["bg"]
    st = L["hair_style"]
    back, front = "", ""
    if st == "pigtails":
        back = (f'<circle cx="46" cy="112" r="19" fill="{hr}"/><circle cx="154" cy="112" r="19" fill="{hr}"/>'
                f'<circle cx="58" cy="96" r="7" fill="{L["ribbon"]}"/><circle cx="142" cy="96" r="7" fill="{L["ribbon"]}"/>')
        front = (f'<path d="M57 100 Q52 46 100 44 Q148 46 143 100 Q136 70 104 62 L100 70 L96 62 Q64 70 57 100Z" fill="{hr}"/>')
    elif st == "short":
        front = (f'<path d="M56 98 Q50 44 100 40 Q150 42 145 98 Q140 72 126 66 Q112 78 92 70 Q78 80 66 72 Q60 82 56 98Z" fill="{hr}"/>')
    elif st == "curly":
        bumps = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{hr}"/>' for x, y, r in
                        [(62, 76, 14), (74, 58, 15), (92, 50, 16), (110, 49, 16), (128, 56, 15), (140, 72, 14), (60, 92, 10), (142, 90, 10)])
        front = bumps
    elif st == "braid":
        back = "".join(f'<ellipse cx="{148 - i*1}" cy="{120 + i*17}" rx="11" ry="10" fill="{hr}"/>' for i in range(5))
        front = (f'<path d="M57 102 Q50 44 100 42 Q150 44 143 102 Q140 72 118 62 Q92 70 72 70 Q62 82 57 102Z" fill="{hr}"/>'
                 f'<path d="M62 74 Q100 48 140 74" stroke="{L["band"]}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    elif st == "bun":
        back = f'<circle cx="100" cy="42" r="21" fill="{hr}"/>'
        front = (f'<path d="M57 104 Q52 50 100 48 Q148 50 143 104 Q138 74 104 64 L100 70 L96 64 Q62 74 57 104Z" fill="{hr}"/>')
    elif st == "lowbun":
        back = f'<circle cx="146" cy="74" r="20" fill="{hr}"/>'
        front = (f'<path d="M57 104 Q52 50 100 48 Q148 50 143 104 Q138 74 104 64 L100 70 L96 64 Q62 74 57 104Z" fill="{hr}"/>')
    bindi = '<circle cx="100" cy="78" r="3.6" fill="#E0242F"/>' if L.get("bindi") else ""
    ear_rings = ('<circle cx="58" cy="116" r="4.5" fill="#FFC21A"/><circle cx="142" cy="116" r="4.5" fill="#FFC21A"/>'
                 if L.get("earrings") else "")
    if L.get("saree"):
        body = (f'<path d="M24 214 Q28 160 100 152 Q172 160 176 214Z" fill="{cl}"/>'
                f'<path d="M64 160 Q100 150 132 156 L176 214 L128 214Z" fill="{tr}" opacity=".95"/>'
                f'<path d="M70 158 Q100 150 128 156 L170 214 L136 214Z" fill="{cl}"/>')
    else:
        body = (f'<path d="M24 214 Q28 160 100 152 Q172 160 176 214Z" fill="{cl}"/>'
                f'<path d="M80 153 Q100 172 120 153" stroke="{tr}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
<defs><clipPath id="c"><circle cx="100" cy="100" r="91"/></clipPath></defs>
<circle cx="100" cy="100" r="99" fill="#FFFFFF"/>
<circle cx="100" cy="100" r="91" fill="{bg}"/>
<g clip-path="url(#c)">
{back}
{body}
<rect x="87" y="126" width="26" height="32" rx="10" fill="{sh}"/>
<circle cx="58" cy="102" r="11" fill="{sh}"/><circle cx="142" cy="102" r="11" fill="{sh}"/>
<ellipse cx="100" cy="98" rx="42" ry="45" fill="{sk}"/>
{front}
{bindi}
<path d="M77 88 Q85 83 93 88" stroke="{hr}" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M107 88 Q115 83 123 88" stroke="{hr}" stroke-width="4" fill="none" stroke-linecap="round"/>
<ellipse cx="85" cy="101" rx="6" ry="7.5" fill="#2B1B14"/><ellipse cx="115" cy="101" rx="6" ry="7.5" fill="#2B1B14"/>
<circle cx="87.2" cy="98.4" r="2.3" fill="#FFFFFF"/><circle cx="117.2" cy="98.4" r="2.3" fill="#FFFFFF"/>
<path d="M97 110 Q100 113 103 110" stroke="{sh}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<ellipse cx="74" cy="117" rx="8" ry="5" fill="#FF7A8A" opacity=".38"/><ellipse cx="126" cy="117" rx="8" ry="5" fill="#FF7A8A" opacity=".38"/>
<path d="M87 120 Q100 133 113 120 Q100 125 87 120Z" fill="#B23A3A" stroke="#B23A3A" stroke-width="3" stroke-linejoin="round"/>
{ear_rings}
</g>
</svg>
'''


def main():
    card = json.load(open(os.path.join(ROOT, "card.json"), encoding="utf-8"))
    names = set()
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k == "who" and isinstance(v, str): names.add(v)
                elif k == "who" and isinstance(v, list): names.update(v)
                else: walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(card)
    names &= set(LOOKS)
    # characters with supplied art (assets/char_<who>.webp, pv-addition-kit/make_characters.py) are not drawn
    names = {n for n in names if not os.path.exists(os.path.join(ROOT, "assets", "char_" + n + ".webp"))}
    for n in sorted(names):
        with open(os.path.join(ROOT, "assets", "char_" + n + ".svg"), "w", encoding="utf-8", newline="\n") as f:
            f.write(avatar(LOOKS[n]))
    print("avatars:", ", ".join(sorted(names)))


if __name__ == "__main__":
    main()
