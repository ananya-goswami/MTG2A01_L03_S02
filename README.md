# MTG2A01_L03_S02 — संख्या जोड़, नई दहाई बनाकर (Add horizontally with regrouping)

**Grade:** G2 · **LO:** MTG2A01_L03 · **Attribute:** A01 · **Type:** CORE
**Slides:** 15 · Tutorial 7 / Guided 3 / Practice 5 (the celebration counts as practice)
**Source:** `MTG2A01_L03_S02_review_v2.pptx` (SME review deck, 18 pages, "same pattern as MTG2A01_L03_S01") - every
page's instructions and VO followed.

## Built on MTG2A04_L02_S01's engine, shared with MTG2A01_L03_S01
Same shell as MTG2A04_L02_S01, unchanged (landing, header + Swiftie, buttons, standard SFX + background music, the
peek phase-transition gate, confetti, nudge hand, loader, xAPI bridge, end screen), and the same place-value kit as
MTG2A01_L03_S01 - the two games differ only in `card.json`. Regrouping is not a separate engine: every screen makes a
new ten whenever its ones reach ten. Source: `../pv-addition-kit/` (see its README); rebuild as in S01's README.

## The lesson, page by page
| slide | deck page | kind | what happens |
|---|---|---|---|
| landing | 1 | — | Title "संख्या जोड़, नई दहाई बनाकर"; Pari and Aaru with their blocks and "26 + 18 = ?"; VO "नमस्ते दोस्त! मैं हूँ स्विफ्टी! आज हम ऐसी संख्याओं को जोड़ना सीखेंगे, जिनमें इकाइयों से नई दहाई बनती है।" |
| T1 | 2 | PV_MAKE_TEN | "10 इकाइयाँ = 1 दहाई": 13 cubes in the ones column; counted एक … दस, each lighting as it is named; at ten the ten are ringed and "दहाई बनाओ" appears and pulses; the child taps it: the ten come together into one rod; it moves to the tens column; the three left are counted; "1 दहाई और 3 इकाइयाँ यानी कुल 13" lights the rod, the cubes, the column digits and "13" |
| T2 | 2b (new) | STORY ask | "कुल कितने ब्लॉक्स?" Pari 27, Aaru 15, "= ?" |
| T3 | 3 | PV_DEMO | Swifty's hand builds 27; the child builds 15; ones tapped across (12); ten of them ringed, the child taps "दहाई बनाओ", the new ten stands beside the table; "नई दहाई को दहाई की जगह रखिए।" - the target place pulses in the tens column and a ghost drag shows the move; the child drags it there (a miss: it returns, "फिर से सोचिए…", then the ghost again); tens tapped across; "2 दहाई, 1 दहाई और 1 नई दहाई … 4 दहाइयाँ"; 42 |
| T4 | 4 | STORY sum | On "27 जोड़ 15 बराबर 42" every block moves into the third column, the ten ones there turn into a new rod, "?" → 42 |
| T5 | 5a | STORY ask | "एक और उदाहरण देखते हैं।" Pari 36, Amma gives 25 |
| T6 | 5b | PV_DEMO | The child builds 36 and 25, adds ("पहले इकाइयों को जोड़िए"), makes the ten - the ghost drag only after 5s idle (deck: "no automatic ghost-drag this time") - 61 |
| T7 | 6 | STORY sum | 36 + 25 = 61 |
| G1–G3 | 7, 8, 9 | PV_MERGE_MCQ | 28+15 / 46+24 / 58+36; "दहाई बनाओ" shown from the start, alive (gold, pulsing) once the sum has ten ones; idle 7s - the hint that fits (the waiting ten's ghost drag, the live button, or the blocks pulsing + the hand); then three answers (33 16 43 / 70 61 60 / 84 94 81) |
| P1–P2 | 10, 11 | PV_NUMPAD | 24+46 / 39+26, answer typed on the number pad |
| P3–P4 | 12, 13 | MENTAL_MCQ | 37+9 / 18+14, only the equation and three answers |
| CEL | 18 | CELEBRATION | MTG2A04's end screen exactly, no text - only the VO "शाबाश! अब आप नई दहाई बनाकर संख्याएँ जोड़ सकते हैं।" (review 2026-10-08) |
Pages 14, 15, 16, 17: deleted (deck).

### Wrong answers (deck WA1–WA3)
- **G1–G3:** 1 "ब्लॉक्स को गिनिए और सही जोड़ चुनिए।" · 2 "ध्यान से देखिए, नई दहाई को मिलाकर कुल 4 दहाइयाँ / और 3 इकाइयाँ हैं।" (rods, then cubes light) · 3 the others fade and lock, the right one glows + the hand (`vo_hint_tap`).
- **P1–P2:** 1 "ब्लॉक्स को गिनिए और सही जोड़ टाइप करिए।" · 2 the blocks move by themselves into a third table - the ten made and put in its place too - the two tables go, the sum table takes the centre + "नई दहाई को मिलाकर कुल 7 दहाइयाँ और 0 इकाई हैं।" · 3 the right digit keys light in turn (7, then 0) with the hand.
- **P3–P4:** 1 the two tables come in, built block by block + "ध्यान से देखिए, क्या इकाइयों से नई दहाई बन रही है?" · 2 the answers hide, the blocks move into a third table (the ten made), the sum table takes the centre, the answers return + "ब्लॉक्स को गिनिए और सही जोड़ चुनिए।" · 3 the right answer glows, the others lock, the hand.
- Right: green card / box, SFX + confetti + cheer + the CR line; the answer flies into the "?".

### Deck slips corrected (FIX in `lessons.py`)
- Page 12: its picture shows "37 + 5" with 316 / 42 / 19, its text "37 + 9 = ?", CR 46 - the text wins (46 must be an answer). The answers are the sheet's misconceptions for 37 + 9: **316** (wrote 16 in the ones), **46**, **36** (forgot the new ten).
- Page 5a's boxes say "Pari's 27 / Amma's 15", its VO 36 / 25 - the VO wins. Heading "देखते है" → "देखते हैं".
- Page 5b gives no heading; it shows "आइए, 36 और 25 को जोड़ते हैं।" (text only).
- "अम्मा" is drawn as Pari's mother (the deck's parallel of S01's "माँ").

## Assets
- **Blocks:** `pv_rod.webp`, `pv_cube.webp` (the deck's art).
- **People:** Pari and Aaru are the supplied character art ("Village World Chronicles.pdf", 2026-10-08), made into the game's
  files by `../pv-addition-kit/make_characters.py` from the cut-outs kept in `../pv-addition-kit/art_src/`:
  `char_pari.webp` / `char_aaru.webp` - round head-and-shoulders portraits for the story pages (Pari waving, Aaru standing),
  `char_pari_full.webp` / `char_aaru_full.webp` - the whole waving figures, standing on the first screen beside their blocks.
  Amma has no art yet: `char_amma.svg` is drawn by `tools/make_avatars.py` in the same round frame. Supplied art always wins
  (app.js `pvChar`: `char_<who>.webp` if it ships, else the drawn `.svg`).
- **Shell (from MTG2A04_L02_S01):** as S01, + the counting clips `vo_num_1`…`vo_num_9` and `vo_hint_dd_1` (the Drag & Drop retry line). `vo_num_10` ("दस") is new, same voice.
- **VO:** 80 new clips, see `VO_MANIFEST.md`. Every file in `assets/` is used.

## Status: 🧪 for SME review (2026-10-07)
Played end to end in Chrome by script, with real clicks and drags and every wrong-answer layer (including a missed
drop of the new ten): all 15 slides complete, no script errors, no failed requests.
