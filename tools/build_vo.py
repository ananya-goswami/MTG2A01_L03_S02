"""Renders the lesson's Hindi VO from tools/vo_script.json (clip id -> line) into assets/voiceover/<id>.ogg.

Same voice and finish as MTG2A04_L02_S01 (its VO_MANIFEST.md): edge-tts hi-IN-SwaraNeural (+0% / +0Hz), pauses inside a
line pulled in to ~0.4s, x1.028 (atempo, pitch kept), 0.28s lead / 0.36s tail, -18.5 LUFS (two-pass loudnorm),
Ogg/Opus 48 kHz mono 32 kbps. Only clips not on disk are made, unless --force (all) or ids are named:

    python tools/build_vo.py                 # the missing ones
    python tools/build_vo.py vo_g1_prompt    # just these (re-render)
    python tools/build_vo.py --force         # everything

Then run  node tools/gen_asset_sizes.js  (the preload manifest). Needs: pip install edge-tts, ffmpeg on PATH, internet.
"""
import asyncio, json, os, re, subprocess, sys, tempfile
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "voiceover")
VOICE, LEAD, TAIL, TEMPO, LUFS = "hi-IN-SwaraNeural", 0.28, 0.36, 1.028, -18.5


async def tts(text, path, sem):
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, VOICE, rate="+0%", pitch="+0Hz").save(path)
                if os.path.getsize(path) > 1000: return
            except Exception as e:
                err = e
            await asyncio.sleep(1.5 * (attempt + 1))
        raise RuntimeError(f"tts failed: {text} ({err if 'err' in dir() else ''})")


def finish(src, dst):
    core = (f"silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0:"
            f"stop_periods=-1:stop_threshold=-42dB:stop_duration=0.42:stop_silence=0.40,"
            f"areverse,silenceremove=start_periods=1:start_threshold=-46dB:start_silence=0.02,areverse,"   # the tail: trimmed to the voice
            f"atempo={TEMPO}")
    # pass 1: measure the loudness of the cleaned line
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af", core + f",loudnorm=I={LUFS}:TP=-1.5:LRA=7:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])
    ln = (f"loudnorm=I={LUFS}:TP=-1.5:LRA=7:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    af = core + "," + ln + f",aresample=48000,adelay={int(LEAD * 1000)}:all=1,apad=pad_dur={TAIL}"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", af, "-ac", "1", "-ar", "48000",
                    "-c:a", "libopus", "-b:a", "32k", "-vbr", "on", "-application", "voip", dst], check=True)


async def main(args):
    script = json.load(open(os.path.join(HERE, "vo_script.json"), encoding="utf-8"))
    force = "--force" in args
    named = [a for a in args if not a.startswith("--")]
    todo = {k: v for k, v in script.items() if (k in named) or (not named and (force or not os.path.exists(os.path.join(OUT, k + ".ogg"))))}
    os.makedirs(OUT, exist_ok=True)
    if not todo: print("VO: nothing to render"); return
    tmp = tempfile.mkdtemp(prefix="vo_")
    sem = asyncio.Semaphore(6)
    await asyncio.gather(*(tts(t, os.path.join(tmp, k + ".mp3"), sem) for k, t in todo.items()))
    loop = asyncio.get_running_loop()
    await asyncio.gather(*(loop.run_in_executor(None, finish, os.path.join(tmp, k + ".mp3"), os.path.join(OUT, k + ".ogg")) for k in todo))
    print(f"VO: {len(todo)} clips rendered")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:]))
