const CARD = JSON.parse(document.getElementById('cardData').textContent);
  const AUDIO_EXT = (CARD.assets && CARD.assets.audio_ext) || "ogg";  // Ogg/Opus (every lesson's audio since 2026-10-06; Chrome/Edge/Firefox, Safari 18.4+)
  const IMG_EXT   = (CARD.assets && CARD.assets.img_ext)   || "webp"; // WebP (all still art; Chrome/Edge/Firefox/Safari 14+) — twin of AUDIO_EXT (fixes A3)
  const ENGINE_VERSION = "2026.07.16i-r4-unified";  // ENGINE STAMP — the receipt (verify_bundle.py) asserts a built game carries THIS exact string; a stale/divergent engine → hard FAIL, so the wrong engine can never silently ship. BUMP IN LOCKSTEP with engine_guard.py + swiftpal_build.py + unified_build.py + verify_bundle.py on EVERY engine change (r2: drag/pattern feedback standard + PHASE_TRANSITION; r3c: off-white toybox bg, dual-coded counting options numeral+hand, full-body landing mascot, true-corner square/rect; r3d: Swiftie mouth-stops-when-silent (still frame), Arabic display numerals 1/2/3, landing shows full 1..n hand row, volume-chip aligned in header pill); r4: additive number-sequence path modules MEET_SEQUENCE + SEQUENCE_COMPLETE + SEQUENCE_NEXT (MTKGA01_L02_S04 "completes a number sequence within 20") — purely additive, existing lessons untouched. r4-landing (16c): landing recomposed to match reference — small corner mascot (230px, was 300), content re-centered (dropped padding-left:300 right-shift hack), VO chip moved from top-right to the mascot's shoulder (left:150/bottom:34, 58px). CSS-only; supersedes the 16b right-shift overlap fix.; 16d: TRUNK MERGE — unified the two diverged engine lines at base 12d: the 15e mechanics trunk (CONSERVE_COUNT + COUNT_ACTION + COUNT_DRAG_MATCH + ORDER_BY_WEIGHT + PICK_SET_BY_NUMBER, per_row/dense count-set grouping, bigNumCell numeral-only test options, title_first landing order) + the 16c r4 design trunk (boot loader, peek phase-transition, concept-strip landing, DS header, flat CTAs, sunburst/star-burst celebration, recomposed corner-mascot landing). Nothing dropped from either line. 16e: landing count-hero hand sizing FIXED — the .sg-hero sizing selectors never matched (template uses .sg-art); hands rendered natural-size, overflowing the card (title pushed outside the box, numeral-1 hidden behind the mascot — user-visible on MTKGA01_L02_S01). Retargeted to .sg-art .sg-hand/.sg-hand-cell/.sg-hand-num (112px; image-hero landings untouched). CSS-only. 16f: INTRO strip fit-or-wrap — old sizing assumed 1220px + a -100px breakout and punched wide strips (10 numerals, 7+ letters) through the tut-frame borders; now sized to the frame (960) and wrapping into two balanced rows below the 110px touch floor. Fixes MTKGA01_L02_S01 s00 (user-caught live) AND the HIKGH04_P2 letter-row daylight item.
  try { window.SWIFTPAL_ENGINE = ENGINE_VERSION; } catch(e){}
const $ = id => document.getElementById(id);

/* ---------- 1. SCALE THE 1333x750 STAGE - ON EVERY SCREEN ----------
   [responsive] (review 2026-10-01: "make my game all screen responsive"). The lesson is ONE fixed 1333x750 stage,
   scaled as a whole to the largest size the screen holds (contain-fit) and never re-laid-out: in a measuring game
   the sizes ARE the content (each object is exactly n blocks long), so nothing may reflow on a phone. Every other
   shape of screen is handled AROUND the stage:
   - viewport-fit=cover (index.html): the page fills the whole screen, notch and home bar included, and the STAGE is
     fitted inside the safe area (env(safe-area-inset-*)) - no button ever sits under a notch or the home bar.
   - the bands a stage leaves (above and below it on a 4:3 iPad, beside it on a 20:9 phone) show the slide's OWN
     backdrop, mirrored at the stage's edge (bleed below): the room, the yard, the fridge door simply carry on.
   - a phone or tablet held upright: a "turn it" card over the lesson (html.ask-rotate); a voice line that was
     speaking waits for the turn back, then goes on.
   - a phone/tablet BROWSER goes full screen on the play tap, and stays landscape where it can (Android).
   Pointer maths everywhere reads --scale at the moment it runs, so drags stay exact at every size. */
const Screen = (function(){
  const root = document.documentElement;
  let probe = null, asking = false, heldVO = false, bleedQueued = false;
  function safe(){
    if(!probe){ probe = document.createElement("div"); probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
        "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
      (document.body || root).appendChild(probe); }
    const cs = getComputedStyle(probe);
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  function touch(){ try{ return matchMedia("(pointer: coarse)").matches; }catch(e){ return false; } }
  function fit(){
    const vw = (window.visualViewport ? window.visualViewport.width  : root.clientWidth)  || window.innerWidth;
    const vh = (window.visualViewport ? window.visualViewport.height : root.clientHeight) || window.innerHeight;
    const sa = safe(), aw = Math.max(1, vw - sa.l - sa.r), ah = Math.max(1, vh - sa.t - sa.b);
    // contain-fit, scaling UP to fill the screen (no 1x cap, no margin) so a 16:9 viewport is covered edge-to-edge
    const s = Math.min(aw / 1333, ah / 750);
    root.style.setProperty("--scale", s);
    root.style.setProperty("--safe-dx", (sa.l - sa.r) / 2 + "px");   // centred in the safe area, not the whole screen
    root.style.setProperty("--safe-dy", (sa.t - sa.b) / 2 + "px");
    root.classList.toggle("bands-x", vw - 1333 * s > 1);              // (QA hooks: which bands the bleed fills)
    root.classList.toggle("bands-y", vh - 750 * s > 1);
    rotate(touch() && vh > vw * 1.1);
  }
  function rotate(on){
    if(on === asking) return;
    asking = on; root.classList.toggle("ask-rotate", on);
    try{                                                              // (voEl: the one VO element, below - not there yet on the first fit)
      if(on && !voEl.paused && !voEl.ended){ voEl.pause(); heldVO = true; }
      else if(!on && heldVO){ heldVO = false; voEl.play().catch(()=>{}); }
    }catch(e){}
  }
  /* a phone/tablet browser: full screen, landscape-locked where the browser can (Android Chrome). Called from a tap.
     Never on a desktop, inside an embedding page, or in a host app's WebView - those run the screen themselves. */
  function fullscreen(){
    try{
      const bridge = window.SwiftPAL && window.SwiftPAL._platform;
      if(!touch() || window.self !== window.top || (bridge && bridge !== "web") || /; wv\)/.test(navigator.userAgent)) return;
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if(!req || document.fullscreenElement || document.webkitFullscreenElement) return;
      const lock = ()=>{ try{ screen.orientation.lock("landscape").catch(()=>{}); }catch(e){} };
      const p = req.call(root, { navigationUI: "hide" });
      if(p && p.then) p.then(lock, ()=>{}); else lock();
    }catch(e){}
  }
  /* the bands: 8 mirrored copies of the stage's own backdrop around it (index.html #stageBleed), kept in step with every
     change of it - a slide's data-bg and --horizon, the tutorial's white, the landing's and the end's transparency.
     While a hint card dims the stage, they dim with it (.dim). */
  function bleed(){
    bleedQueued = false;
    const st = document.getElementById("stage"), b = document.getElementById("stageBleed");
    if(!st || !b) return;
    /* (review 2026-10-07 "fix these line cuts": at a fractional --scale the stage's background COLOUR was painted to its
       very edge but its picture stopped short of the last device column, so the colour - the floor's, under every room
       picture - showed as a 1px line down the stage's right side. The colour now lies on an underlay 1px inside the
       stage (.stage-wrap.bg-under::before, --stage-bg) and the stage's own is transparent: the edge column is picture
       + band only. The wrap is not observed, so toggling its class to read the slide's colour starts no loop.) */
    const wrap = st.parentElement; wrap.classList.remove("bg-under");
    const cs = getComputedStyle(st), color = cs.backgroundColor;
    const css = "background-color:" + color + ";background-image:" + cs.backgroundImage + ";background-size:" + cs.backgroundSize +
                ";background-position:" + cs.backgroundPosition + ";background-repeat:" + cs.backgroundRepeat;
    wrap.style.setProperty("--stage-bg", color); wrap.classList.add("bg-under");
    if(b._css === css) return;
    b._css = css; b.dataset.bg = st.dataset.bg || "";
    for(const i of b.children) i.style.cssText = css;
  }
  function queueBleed(){ if(!bleedQueued){ bleedQueued = true; requestAnimationFrame(bleed); } }
  function watch(){
    const st = document.getElementById("stage");
    if(!st || !window.MutationObserver) return;
    const mo = new MutationObserver(queueBleed);
    mo.observe(st, { attributes: true, attributeFilter: ["class", "style", "data-bg"] });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const ra = document.getElementById("rotateAsk"); if(ra) ra.addEventListener("click", fullscreen);   // Android: the tap itself turns the screen
    queueBleed();
  }
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
  if(window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  fit(); watch();
  return { fit: fit, fullscreen: fullscreen, bleed: queueBleed };
})();

/* ---------- 2. SIGNAL BUS + OFFLINE TELEMETRY ---------- */
/* TELEMETRY: offline self-capture. Every signal is buffered to localStorage so
   the run survives a reload / works with NO host app. A full results record can
   be pulled via GameBus.downloadResults() (or the ?dev=1 button on the end
   screen). If `endpoint` is set AND the device is online, the final record is
   also POSTed — left null so the lesson is fully offline by default. */
const TELEMETRY = {
  endpoint: null,   // e.g. "https://lrs.example.com/swiftpal" — null = offline only
  storageKey: "swiftpal:run:" + CARD.skill_code + "_" + (CARD.part_label || "P1")
};
/* ===== QA CHECKLIST [14]: xAPI VERB LAYER =================================
   The engine emits 36 GameBus signals but none of the seven required xAPI
   verbs. This layer maps the ones that already have a signal and fires the
   rest explicitly. context echoes context_id / journey_id / medium straight
   off the launch URL and always carries skill_code. */
const XAPI = window.XAPI = (function(){
  var q; try{ q = new URLSearchParams(location.search); }catch(e){ q = { get:function(){ return null; } }; }
  var startedAt = Date.now();
  var ctx = { skill_code: CARD.skill_code, lo_code: CARD.lo_code,
              context_id: q.get("context_id"), journey_id: q.get("journey_id"),
              medium: q.get("medium") || CARD.medium || "hi" };
  /* [QA 14] question_format per answerable slide type (HI01's enum). */
  var QUESTION_FORMAT = { PV_MERGE_MCQ:"mcq", MENTAL_MCQ:"mcq", PV_NUMPAD:"numeric_input" };
  var log = [], fired = {};
  /* send(verb, object, result): builds the standard { verb, object, result, context } statement
     (HI01 shape) and hands it to the platform bridge - SwiftPAL.sendEvent -> Android / iOS / web.
     Falls back to a direct postMessage only if the bridge is absent (standalone dev).
     context echoes context_id / journey_id / medium off the launch URL, always carries skill_code,
     and on a slide-level verb adds question_id / question_index / template / question_format / phase. */
  function send(verb, object, result){
    var o = object || {}, sl = null;
    try{ if(o.slide_id) sl = CARD.slides.find(function(x){ return x.id === o.slide_id; }) || null; }catch(e){}
    var c = Object.assign({}, ctx, { session_ms: Date.now() - startedAt });
    if(sl){ Object.assign(c, { question_id: sl.id, question_index: CARD.slides.indexOf(sl), template: sl.type,
                               question_format: QUESTION_FORMAT[sl.type] || null, phase: sl.phase }); }
    var statement = { verb: verb, object: o, result: result || {}, context: c };
    log.push(Object.assign({ ts: Date.now() }, statement));
    try{
      if(window.SwiftPAL && typeof window.SwiftPAL.sendEvent === "function") window.SwiftPAL.sendEvent(statement);
      else window.parent && window.parent.postMessage({ type:"swiftpal:xapi", statement: statement }, "*");
    }catch(e){}
    try{ console.log("[xapi]", verb, statement); }catch(e){}
    return statement;
  }
  return { ctx:ctx, log:log, send:send,
           once:function(v,o,r){ if(fired[v]) return null; fired[v]=1; return send(v,o,r); },
           hasFired:function(v){ return !!fired[v]; } };
})();
/* signal -> verb, for the three that already have a 1:1 signal */
const XAPI_MAP = { slide_entered:"screen_viewed", hint_shown:"hint_used", audio_replay:"audio_replayed" };
const XAPI_ANSWERABLE = ["PV_MERGE_MCQ","PV_NUMPAD","MENTAL_MCQ"];   /* slide types that send question_started */

/* [QA 01] The game's internal bus is GameBus (window.GameBus). The global SwiftPAL name belongs to
   the platform bridge (swiftpal-bridge.js, loaded first), which XAPI.send() hands each statement to.
   This bus used to be called SwiftPAL itself, which took the name the host bridge needs. */
const GameBus = window.GameBus = {
  signals: [],
  validatorReport: { missing_signals: [], errors: [], passed: false },
  firedSet: new Set(),
  startedAt: Date.now(),
  emit(name, payload){
    const evt = Object.assign({
      ts: Date.now(),
      skill_code: CARD.skill_code,
      lo_code: CARD.lo_code,
      signal: name
    }, payload || {});
    this.signals.push(evt);
    this.firedSet.add(name);
    /* [14] fan the mapped signals out as xAPI verbs */
    /* a MANUAL hint_shown is a bulb tap, whose hint_used the capture listener on #hintBtn already
       sent - mapping it too would log the verb twice ([QA 14] no duplicated verbs). */
    /* [QA 14] one verb per screen, as HI01 does: an answerable slide sends question_started
       (mountSlide), everything else screen_viewed - never both for the same slide. */
    try{ if(XAPI_MAP[name] && !(name === "hint_shown" && payload && payload.manual)
            && !(name === "slide_entered" && payload && XAPI_ANSWERABLE.indexOf(payload.type) >= 0))
           XAPI.send(XAPI_MAP[name], { slide_id: payload && payload.slide_id }, payload || {}); }catch(e){}
    try{ console.log("[signal]", name, evt); }catch(e){}
    /* [QA 14] NOISE CONTROL (as HI01): the raw signal firehose is DEV-ONLY. Production hosts receive
       only the 7 xAPI verbs through the bridge. */
    if(new URLSearchParams(location.search).has("dev")){
      try{ window.parent?.postMessage({type:"swiftpal:signal", payload: evt}, "*"); }catch(e){}
    }
    this.persist();
  },
  /* full results record (used for download / POST / end-of-lesson dump) */
  exportResults(){
    const ms = (typeof state!=="undefined") ? state.masteryAttempts : 0;
    const mh = (typeof state!=="undefined") ? state.masteryHits : 0;
    return {
      skill_code: CARD.skill_code, lo_code: CARD.lo_code, part: CARD.part_label || null,
      started_at: this.startedAt, exported_at: Date.now(),
      mastery: { hits: mh, attempts: ms, score: ms ? mh/ms : 0 },
      validatorReport: this.validatorReport,
      signals: this.signals
    };
  },
  /* silent: flush the running buffer to localStorage (survives reload / offline) */
  persist(){
    try{ localStorage.setItem(TELEMETRY.storageKey, JSON.stringify(this.exportResults())); }
    catch(e){ /* private mode / quota — non-fatal, postMessage + memory still work */ }
  },
  /* pull the run as a JSON file (teacher/dev; not in the child's flow) */
  downloadResults(){
    try{
      const blob = new Blob([JSON.stringify(this.exportResults(), null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = CARD.skill_code + "_" + (CARD.part_label||"P1") + "_results.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=> URL.revokeObjectURL(url), 1000);
    }catch(e){ console.error("[telemetry] download failed", e); }
  }
};

/* ---------- 3. AUDIO ---------- */
let isPlaying=false, currentAudio=null;
function setPlaying(on){
  // the dynamic Swiftie sits header-left; the audio chips pulse to signal playback. r4/F1: share the
  // .playing toggle across the header chip AND the tut-card replay chip (the header is hidden in the
  // tut frame, so the in-card .tut-audio is the only visible affordance and must react to VO too).
  isPlaying=on;
  bgmDuck();
  /* [QA 05] only the chip the audio is actually coming FROM animates, and only one at a time.
     It used to pulse every chip for every sound - option words, feedback, the count-aloud. */
  const src = on && currentAudio ? srcOf(currentAudio) : null;
  const from = on ? chipFor(src) : null;
  document.querySelectorAll(".audio-chip, .tut-audio, .sg-vo").forEach(c => c.classList.toggle("playing", c === from));
  swApplyPose();   // freeze/unfreeze Swiftie's mouth: animate only while a clip is sounding
}
/* [QA 15] ONE reusable VO element, not a new Audio() per clip. Every clip used to get its own
   element and none was ever released: ~150 live media players by the last question, and the
   renderer crashed there on every full playthrough (Android WebViews cap players far lower).
   _playTok retires a superseded clip's callbacks, so a stopped clip can never fire onEnd late. */
const voEl = new Audio(); voEl.preload = "auto";
let _playTok = 0;
/* chipFor(src): the ONE chip a clip belongs to, or null. The landing greeting belongs to the
   landing chip; a slide's own lines (prompt / ask / conclude ...) to that slide's chip - the in-card
   tutorial chip when the tutorial frame is up, else the header chip. Feedback, option words and
   the count-aloud belong to no chip, so no chip moves for them. */
const _FEEDBACK_KEYS = { correct:1, try_again:1, hint:1, hint1:1, reveal:1, sfx:1 };
function chipFor(src){
  if(!src || typeof CARD === "undefined") return null;
  const gate = document.getElementById("startGate");
  if(gate && !gate.classList.contains("hidden")){
    const land = (CARD.assets && CARD.assets.audio && CARD.assets.audio.vo_landing) || "";
    return land && src.indexOf(land) >= 0 ? document.getElementById("sgVo") : null;
  }
  const sl = CARD.slides[state.idx];
  if(!sl || !sl.audio) return null;
  const own = Object.keys(sl.audio).some(k => !_FEEDBACK_KEYS[k] && src === audioFor(sl, k));
  if(!own) return null;
  return document.querySelector("#slideHost .tut-audio") || document.getElementById("audioChip");
}
/* [QA 11] replay-chip guard (HI01 [24a N8]): a replay tap while a clip is sounding is ignored.
   play() stops the current clip, and a paused clip never fires its end callback - so a replay
   mid-count froze DEMO_COUNT (आगे never unlocked) and mid-answer-word lost the auto-advance.
   The tap still reports audio_replayed (flagged ignored), so every tap is logged. */
function replayTap(slide, src){
  state.audioReplays++;
  const busy = isPlaying;
  GameBus.emit("audio_replay", { slide_id: slide ? slide.id : "landing", phase: slide ? slide.phase : "landing",
    count: state.audioReplays, src: src, ignored_while_playing: busy });
  return !busy;
}
function stopAudio(){
  _playTok++;
  if(currentAudio){ try{ currentAudio.pause(); }catch(e){} currentAudio=null; }
  setPlaying(false);
}
/* play(src, onEnd): real clip if the path exists; silent beat if missing/blocked. */
function play(src, onEnd){
  stopAudio(); setPlaying(true);
  const tok = _playTok;
  let done=false; const fire=()=>{ if(done || tok !== _playTok) return; done=true; currentAudio=null; setPlaying(false); if(onEnd) onEnd(); };
  if(src){
    const a = voEl; currentAudio = a;
    let retried = false;
    a.onended = fire;
    /* the clip's blob: copy failed (Assets): the file's own URL, once; anything else - a silent beat, then on */
    a.onerror = ()=>{ if(tok !== _playTok) return;
      if(!retried && /^blob:/.test(a.src)){ retried = true; a.src = src; a.play().catch(()=>{ if(tok === _playTok) setTimeout(fire, 1200); }); return; }
      setTimeout(fire, 1200); };
    a.setAttribute("data-asset", src);
    a.src = Assets.url(src); setPlaying(true);   // re-apply now the src is known, so the right chip lights
    a.play().catch(()=>{ if(tok === _playTok) setTimeout(fire, 1200); });
    /* WATCHDOG: whatever waits on this clip's end (आगे, the next line, the play button) can never be stranded by a clip
       that stalls mid-way or never reports `ended`: the clip's remaining length + 3s grace, re-armed while it is still
       really moving on. No length yet (metadata stuck): 15s. */
    let lastT = -1;
    const watch = ()=>{ if(done || tok !== _playTok) return;
      const left = isFinite(a.duration) && a.duration > 0 ? (a.duration - a.currentTime) / (a.playbackRate || 1) : 12;
      setTimeout(()=>{ if(done || tok !== _playTok) return;
        if(!a.paused && !a.ended && a.currentTime > lastT + 0.05){ lastT = a.currentTime; watch(); } else fire(); }, Math.max(0, left) * 1000 + 3000);
    };
    watch();
  } else { setTimeout(fire, 800); }
}
/* playSfx(id): fire-and-forget sound effect that can overlap the spoken VO (does NOT touch
   currentAudio / the play() chain). Two pooled elements, reused - never one per call.
   Silently no-ops if the file is missing or playback is blocked. */
const _sfxPool = [new Audio(), new Audio(), new Audio(), new Audio()]; let _sfxNext = 0;
function playSfx(id, onEnd){
  if(!id) return;
  try{
    const a = _sfxPool[_sfxNext++ % _sfxPool.length];
    a.pause(); a.volume = 0.7; a.onended = onEnd ? ()=>{ a.onended = null; onEnd(); } : null;
    const f = "assets/voiceover/" + id + "." + AUDIO_EXT;
    a.onerror = ()=>{ a.onerror = null; if(/^blob:/.test(a.src)){ a.src = f; a.play().catch(()=>{}); } };   // blob: copy failed - the file, once
    a.setAttribute("data-asset", f); a.src = Assets.url(f);
    a.play().catch(()=>{});
  }catch(e){}
}
/* ---------- game-feel: procedural SFX (no audio files) + success particle burst ----------
   WebAudio resumes on the first user tap (autoplay policy), so taps/answers always sound. */
let _juiceAC = null;
function _ac(){ if(!_juiceAC){ try{ _juiceAC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  if(_juiceAC && _juiceAC.state === "suspended"){ try{ _juiceAC.resume(); }catch(e){} } return _juiceAC; }
function _tone(freqs, type, dur, vol){ const c = _ac(); if(!c) return; const t0 = c.currentTime;
  freqs.forEach((f, i)=>{ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    const t = t0 + i*(dur/freqs.length); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur/freqs.length); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur/freqs.length); }); }
const sfxTap       = ()=> _tone([520], "sine", 0.09, 0.09);
/* ===== QA checklist 2026-10-05: the STANDARD SFX + background music, as files in assets/sfx/ =====
   sfx_correct / sfx_wrong (correct + incorrect feedback), sfx_confetti (with every confetti burst), sfx_play (the play
   button), sfx_nudge (a soft, encouraging chime with each nudge hand), bgm (the lesson's background track, from the play
   tap on) and bgm_game (the practice game's track - the lesson track carries on if it is not shipped). A file that
   is missing or blocked is silent; correct / wrong fall back to the old procedural tones so feedback is never mute. */
const SFX_DIR = "assets/sfx/";
function playSfxFile(name, vol, fallback){
  try{
    const a = _sfxPool[_sfxNext++ % _sfxPool.length];
    a.pause(); a.volume = vol == null ? 0.8 : vol;
    const f = SFX_DIR + name + "." + AUDIO_EXT;
    /* its blob: copy failed (Assets): the file's own URL, once; the file itself failed: the procedural fallback */
    a.onerror = ()=>{ if(/^blob:/.test(a.src)){ a.src = f; a.play().catch(()=>{}); return; } a.onerror = null; if(fallback) fallback(); };
    a.setAttribute("data-asset", f); a.src = Assets.url(f);
    a.play().catch(()=>{});
  }catch(e){ if(fallback) fallback(); }
}
const sfxCorrect   = ()=> playSfxFile("sfx_correct", 0.8, ()=> _tone([660, 880, 1180], "sine", 0.42, 0.13));
const sfxWrongSoft = ()=> playSfxFile("sfx_wrong", 0.6, ()=> _tone([300, 235], "triangle", 0.20, 0.08));   // gentle, never harsh
/* 2026-10-07: the team's Standard SFX pack (correct / incorrect / confetti / play / next). Its confetti is mastered
   ~8dB hotter than the kit's and lands on top of sfx_correct + the VO, so it plays lower to sit under them. */
const sfxConfetti  = ()=> playSfxFile("sfx_confetti", 0.45);
const sfxPlay      = ()=> playSfxFile("sfx_play", 0.9);
const sfxNext      = ()=> playSfxFile("sfx_next", 0.9);   // the आगे tap (a disabled आगे fires no click, so no sound)
const sfxNudge     = ()=> playSfxFile("sfx_nudge", 0.45);
/* background music: one looping element, started by the play tap (never before it), ducked under every VO clip,
   paused while the app is in the background. bgmFor(phase) picks the track: the practice game has its own. */
/* 2026-10-07: bgm.ogg is the team's "Standard Background Music 2" (bouncy, seamless 4-min loop; "1" is an 18s lo-fi loop
   that would repeat ~30x a lesson). Its quietness is BAKED INTO THE FILE (-33 LUFS, ~14.5dB under the VO's -18.5): iOS
   Safari ignores media .volume, so a loud file would play at full VO level there. VOL/DUCK only add the dip under VO
   (0.35 = -9dB, ~24dB under the voice); the dip is a short fade, not a jump, so the bed never pumps. */
var BGM = { el: null, track: "", VOL: 1, DUCK: 0.35, raf: 0 };   // (var: setPlaying, above, may reach it)
function bgmDuck(){
  if(!BGM || !BGM.el) return;
  const el = BGM.el, from = el.volume, to = isPlaying ? BGM.DUCK : BGM.VOL, ms = to < from ? 180 : 600, t0 = performance.now();
  cancelAnimationFrame(BGM.raf);
  const step = now =>{ if(BGM.el !== el) return; const k = Math.max(0, Math.min(1, (now - t0) / ms));   // (a frame's timestamp can be a little BEFORE t0: k < 0 set volume > 1 and threw - BGM duck clamp
    el.volume = from + (to - from) * k; if(k < 1) BGM.raf = requestAnimationFrame(step); };
  BGM.raf = requestAnimationFrame(step);
}
function bgmFor(phase){
  const want = phase === "practice" ? "bgm_game" : "bgm";
  if(!BGM.el || BGM.track === want) return;
  bgmPlay(want, ()=>{ if(want !== "bgm" && BGM.track !== "bgm") bgmPlay("bgm"); });          // no game track shipped: keep the lesson one
}
function bgmPlay(track, onMissing){
  /* only a track that ships (ASSET_SIZES = the files on disk): bgm.ogg / bgm_game.ogg are not in this lesson yet, and
     asking for them was a 404 on every play tap. Drop a file into assets/sfx/ and run tools/gen_asset_sizes.js. */
  if(!Object.prototype.hasOwnProperty.call(ASSET_SIZES, SFX_DIR + track + "." + AUDIO_EXT)){ if(onMissing) onMissing(); return; }
  try{
    const old = BGM.el; if(old){ old.pause(); old.onerror = null; }
    const a = new Audio(); a.loop = true; a.preload = "auto";
    a.onerror = ()=>{ a.onerror = null; if(BGM.el === a && onMissing) onMissing(); };
    a.src = Assets.url(SFX_DIR + track + "." + AUDIO_EXT);
    a.volume = isPlaying ? BGM.DUCK : BGM.VOL;   // start at the right level - a new track never fades in from 1
    BGM.el = a; BGM.track = track; bgmDuck();
    a.play().catch(()=>{});
  }catch(e){}
}
function bgmStart(){ if(!BGM.el) bgmPlay("bgm"); }
document.addEventListener("visibilitychange", ()=>{ if(!BGM.el) return;
  if(document.hidden) BGM.el.pause(); else BGM.el.play().catch(()=>{}); });
/* dynamic Swiftie buddy: swap pose + a little pop on every reaction (correct/wrong/explain/celebrate) */
// [20a mascot-01] moods -> production EXPRESSIONS (head webp), not idle-gif basenames.
//   Ported verbatim from HI01H01_L02_S04_dist (its app lines 2474-2493) together with the
//   .mascot-wrap > .mascot-circle > .mascot-img markup. The old sw_anim_*.gif scheme and the
//   isPlaying mouth-coupling go with it - heads are now driven by setSwMood alone.
const SW_POSE = { talk:"talking", point:"talking", idle:"talking", happy:"celebrate", celebrate:"celebrate",
                  hint:"hint", teach:"hint", idea:"hint", tryagain:"tryagain" };
const SW_STILL = (() => { try { const q=new URLSearchParams(location.search);
  return q.has("still") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch(e){ return false; } })();
let swMood = "point", _celebUrl = "", _celebKey = null;
function swApplyPose(){ /* [20a] retired: heads no longer couple to isPlaying (setSwMood drives them). */ }
function setSwMood(m){ swMood = m;
  const img = document.getElementById("swBuddyImg"), w = document.getElementById("swBuddy");
  if(!img) return;
  const expr = SW_POSE[m] || "talking";
  const animated = expr !== "talking" && !SW_STILL;   // resting face is the static talking head
  img.onerror = () => { img.onerror = null; img.src = "assets/mascot.webp"; };   // [mascot-10]
  const src = "assets/" + (animated ? "gif/" : "") + "sw_head_" + expr + (animated ? "_anim" : "") + ".webp";
  /* [mascot-08] replay play-once: a slide's first cheer plays from frame 0 - a fresh blob: URL of the one download
     ([loading]: it was "?r=<slide start>", a new 380KB download on every slide that cheered) */
  if(animated && expr === "celebrate"){
    if(_celebKey !== state.slideStart){ if(_celebUrl.indexOf("blob:") === 0) URL.revokeObjectURL(_celebUrl);
      _celebUrl = Assets.fresh(src); _celebKey = state.slideStart; }
    img.src = _celebUrl;
  } else img.src = src;
  if(w){ w.dataset.expr = expr; w.classList.toggle("anim", animated);
         w.classList.remove("react"); void w.offsetWidth; w.classList.add("react"); } }   // .react pop kept from MTG
/* ===== FLN ANIMATION KIT: confetti (call site) BEGIN =====
   Recipe 7 REPLACES the correct-answer celebration rather than tuning it, so the
   two-sided .conf-shot cannon below is retired to _confettiCannonOld. The kit
   gates itself to guided/practice/mastery, so the phase of the live slide is
   passed through; in tutorial the tile-level confirm (recipe 19) is the feedback.
   The old function is kept, unreferenced, so the change is reversible in one line. */
function confettiCannon(){
  var sl = CARD.slides[state.idx] || {};
  /* [13] the kit's recipe 7 with its own shapes (star 40%, rectangle, line, square), sizes, depth and fall - review
     2026-09-30: "all square-shaped and not covering the full horizontal space". It falls over the WHOLE window
     (#fxLayer, body-level: the stage is letterboxed and clips at its edges), so ~100 pieces keep the density of the
     kit's 80 across the wider field. phases:[] because the checklist asks for confetti on every correct answer,
     including tutorial. The palette is the kit's own VIBGYOR pairs. */
  /* fall: seconds to cross the window, before the depth divisor - the kit's [1.1, 1.8] made ~40% slower (review
     2026-09-30: "reduce its speed a bit"); pieces cross in ~1.4-3.5s, the burst clears in ~3.8s */
  FLNMotion.confetti.burst({
    host: "#fxLayer", phase: sl.phase, phases: [], count: 100, fall: [1.6, 2.6]
  });
  sfxConfetti();   // QA checklist 2026-10-05: the standard confetti SFX with the standard confetti
}
// pitch climbs one step per block — HEAR the count
/* slide audio path: per slide, we look at slide.audio.prompt / .phoneme / etc.
   In this v0.1 the embedded card holds short ids; the compiler would replace
   them with base64 data URIs. We resolve to assets/voiceover/{id}.mp3 with fallback. */
function audioFor(slide, key){
  if(!slide.audio || !slide.audio[key]) return null;
  return "assets/voiceover/" + slide.audio[key] + "." + AUDIO_EXT;
}
/* Play a SEQUENCE of audio sources back-to-back. Each one finishes (or
   falls back to silent beat if missing) before the next starts. */
function playChain(srcs, i, onDone){
  i = i || 0;
  if(i >= srcs.length){ if(onDone) onDone(); return; }
  play(srcs[i], () => playChain(srcs, i+1, onDone));
}
/* On slide mount, play prompt → phoneme/word_name → instruction in order.
   KG learners can't read prompt_hi — the chain gives them both the
   instruction AND the cue (letter sound or picture name) audibly.
   onDone fires after the whole chain finishes (used to gate the नav button). */
function autoPlayChain(slide, onDone){
  const order = ["prompt","phoneme","shape_name","word_name","instruction"];
  const chain = [];
  for(const k of order){
    const src = audioFor(slide, k);
    if(src) chain.push(src);
  }
  if(chain.length) playChain(chain, 0, onDone);
  else if(onDone) onDone();
}

/* nav button: enable/disable the kit-style pill. When it becomes active (the
   activity is done) but the child doesn't tap आगे, the hand-nudge points at it. */
function setNavActive(on){
  const btn = $("navBtn");
  btn.disabled = !on;
  btn.classList.toggle("active", on);
  clearTimeout(state.navNudgeTimer);
  if(on) state.navNudgeTimer = setTimeout(nudgeNavBtn, 4500);
}
function nudgeNavBtn(){
  /* [04] QA CHECKLIST: "Nudge hand only ever points at interactive tiles/objects
     - never at आगे, शुरू करें, or any other button." This pointed it straight at
     #navBtn, so it is now a no-op. Kept as a function because setNavActive()
     schedules it and several modules clear its timer. */
  return;
  /* eslint-disable no-unreachable */
  const btn = $("navBtn");
  if(!btn.classList.contains("active") || state.hintActive) return;
  const nh = $("nudgeHand");
  const r = btn.getBoundingClientRect();
  const sw = document.querySelector(".slide-stage").getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  nh.style.left = ((r.left - sw.left)/scale + r.width/scale/2 - 48) + "px";
  nh.style.top  = ((r.top  - sw.top )/scale + r.height/scale/2 - 6) + "px";
  nh.classList.add("show");
}

/* ---------- 4. STATE ---------- */
const state = {
  idx: 0,
  slideStart: Date.now(),
  attempts: 0,
  audioReplays: 0,
  hintUsed: false,
  nudgeUsed: false,
  scaffoldLevel: 0,   // 0 none, 1 nudge, 2 hint, 3 reveal
  selectedKey: null,
  locked: false,
  hintActive: false,
  masteryHits: 0,
  masteryAttempts: 0,
  nudgeTimer: null
};
/* [QA 06] SCORE = first-try correctness over every ANSWERABLE question (guided + practice here).
   It used to count only phase==="mastery" slides - this card has none, so hits/attempts stayed
   0/0 and every run scored 0. recordResult() is called once per question when it resolves
   (right tap, or the reveal), from COUNT_HOW_MANY and MAKE_SET alike; a slide can only be
   scored once, so a replayed/re-entered slide can never be double-counted (no off-by-one). */
function recordResult(slide, firstTry){
  state.scored = state.scored || {};
  if(!slide || Object.prototype.hasOwnProperty.call(state.scored, slide.id)) return;
  state.scored[slide.id] = !!firstTry;
  state.masteryAttempts++; if(firstTry) state.masteryHits++;
}

/* ---------- 5. NUDGE ----------
   target may be a CSS selector OR an element. Used ONLY for flow guidance
   (e.g. the "listen" button / prompt) — never to point at the correct answer. */
/* QA checklist 2026-10-05: "inactivity nudges are activated after 7 seconds" - one value for every idle nudge in the
   lesson (the card's nudge_timeout_ms, per phase, says the same) */
const IDLE_MS = 7000;
function startNudge(slide, target){
  clearTimeout(state.nudgeTimer);
  if(!target) return;
  const ms = (CARD.scaffold_rules.nudge_timeout_ms || {})[slide.phase] || IDLE_MS;
  if(!ms) return;
  state.nudgeTimer = setTimeout(()=>{
    if(state.locked || state.hintActive) return;
    const el = (typeof target === "string") ? document.querySelector(target) : target;
    if(!el) return;
    if(!placeNudge(el)) return;
    state.nudgeUsed = true;
    state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
    GameBus.emit("nudge_invoked", { slide_id: slide.id, phase: slide.phase });
  }, ms);
}
function stopNudge(){
  clearTimeout(state.nudgeTimer);
  $("nudgeHand").classList.remove("show");
}
/* [QA 12] THE HAND SITS BELOW ITS TARGET, NEVER ON IT, NEVER ON A BUTTON.
   #nudgeHand is 86x108 and nudge_hand_new.svg (75x94) fills it at scale 1.1467, which puts the
   fingertip at (34.2, 15.8) inside the box (kit recipe 4 geometry). The old code dropped the box
   -56px / -30px INTO the target, i.e. the fingertip 24-50px inside the tile and the hand over it.
   Now the FINGERTIP lands 8px below the target's bottom edge, and, as HI01 [28j] does, below any
   label text sitting under the target in the same column. It is clamped inside the stage
   (never flipped above - it points UP, so above a target it would point away), and if the box
   would still overlap any button other than its own target it is not shown at all.
   References .slide-stage (the nudge's positioning context), not .stage (~140px header off). */
const NH = { W:86, H:108, TIP_X:34.2, TIP_Y:15.8, GAP:8 };
function placeNudge(el){
  const nh = $("nudgeHand"), host = document.querySelector(".slide-stage");
  if(!el || !nh || !host || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect(), sw = host.getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  const cx = (r.left - sw.left)/scale + r.width/scale/2;
  let tipY = (r.bottom - sw.top)/scale + NH.GAP;
  const tile = el.closest(".opt-cell, .count-item, .ms-item, .q-cell, .tut-card") || el.parentElement;
  if(tile){
    tile.querySelectorAll(".lbl, .opt-label, .count-badge, .pic-label").forEach(t => {
      const tr = t.getBoundingClientRect();
      if(tr.width < 2 || tr.height < 2 || tr.right < r.left || tr.left > r.right) return;
      const tb = (tr.bottom - sw.top)/scale + NH.GAP;
      if(tb > tipY) tipY = tb;
    });
  }
  const stageW = sw.width/scale, stageH = sw.height/scale;
  const left = Math.max(0, Math.min(stageW - NH.W, cx - NH.TIP_X));
  const top  = Math.max(0, Math.min(stageH - NH.H, tipY - NH.TIP_Y));
  nh.style.left = left + "px"; nh.style.top = top + "px";
  // never covering a button: test the hand's final box against every button except its target
  const hr = { l: sw.left + left*scale, t: sw.top + top*scale, r: sw.left + (left + NH.W)*scale, b: sw.top + (top + NH.H)*scale };
  /* A button in the hand's box: the hand is CUT OFF 4px above that button's top edge (clip-path),
     so it reads as tucked behind the button and never draws over it. On the tutorial slides आगे
     sits right under the unit row, so a plain "hide if it overlaps" rule hid the tutorial hand
     entirely. If the cut would leave less than 40% of the hand (fingertip + finger), it is hidden. */
  let cutTop = Infinity;
  [...document.querySelectorAll("button, .nav-btn, .audio-chip, .tut-audio, .hint-btn")].forEach(b => {
    if(b === el || b.contains(el) || el.contains(b)) return;
    const br = b.getBoundingClientRect();
    if(br.width < 2 || br.height < 2 || getComputedStyle(b).visibility === "hidden") return;
    if(br.left < hr.r && br.right > hr.l && br.top < hr.b && br.bottom > hr.t) cutTop = Math.min(cutTop, br.top);
  });
  nh.style.clipPath = "";
  if(cutTop !== Infinity){
    const keep = (cutTop - 4 - hr.t) / scale;                 // design px of the hand left visible
    if(keep < NH.H * 0.4){ nh.classList.remove("show"); return false; }
    /* only the BOTTOM is cut: the tap ripple (kit recipe 4) spreads up to ~55px above and around the box */
    nh.style.clipPath = "inset(-60px -60px " + Math.max(0, NH.H - keep).toFixed(1) + "px -60px)";
  }
  if(!nh.classList.contains("show")) sfxNudge();   // QA checklist 2026-10-05: an encouraging SFX with every nudge
  nh.classList.add("show");
  return true;
}

/* ---------- 8. TAP-OPTION HELPER (shared by 5 slide types) ---------- */
function mountTapOptions({slide, host, signalName, stimulus, options, isCorrect, optionRenderer, columnsHint, mastery, hintAction, nudgeTarget, shuffle, onCorrect, onWrong, reask}){
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.audioReplays = 0; state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0;
  // idle hand-nudge target: defaults to the stimulus (re-listen), but a slide can pass
  // nudgeTarget:null to suppress it entirely (e.g. "how many?" — nothing to re-tap).
  const _nudge = (nudgeTarget !== undefined) ? nudgeTarget : (stimulus || null);
  // optional custom hint (runs on the live slide instead of a text popup), e.g. a
  // count-demonstration. Wrapped to block option taps while it plays.
  const runHint = hintAction ? (after)=>{ state.hintActive = true; hintAction(()=>{ state.hintActive = false; if(after) after(); }); } : null;

  // Shuffle options once so the correct answer isn't pinned to one position (engine-wide anti
  // positional-bias — otherwise "always tap the same spot" can pass mastery). Opt out with
  // shuffle:false for inherently-ordered options (e.g. a number line).
  const _opts = (shuffle === false) ? options.slice()
    : (function(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; })(options);

  const wrap = document.createElement("div"); wrap.className = "q-row";
  if(stimulus){ wrap.appendChild(stimulus); }
  const grid = document.createElement("div");
  const cols = columnsHint || (_opts.length <= 2 ? 2 : _opts.length <= 3 ? 3 : 4);
  grid.className = "opt-grid cols-" + cols;
  _opts.forEach((opt, i) => {
    const cell = optionRenderer(opt, i);
    cell.classList.add("opt-cell");
    cell.dataset.key = String(i);
    cell.onclick = ()=>{
      /* [10] a wrong card must stay tappable - the .crossed early-return is gone.
         .correct still blocks, because the slide is locked once it is answered. */
      if(state.locked || state.hintActive || cell.classList.contains("correct")) return;
      stopNudge();
      // SME rule: SPEAK THE TAPPED WORD on EVERY tap (right or wrong), then the feedback — never two
      // voices at once (buzz/confetti are sfx, they ride alongside the word). opt.audio = word clip id.
      // Fallback wiring for LETTER options (SME: the tapped item's own sound speaks EVERYWHERE): options
      // authored as {letter:"आ"} carry no audio id, but the slide's data.phonemes map has each letter's
      // clip — derive it here centrally so every TAP_LETTER_* / mastery module inherits speak-on-tap
      // without per-module or per-card changes. Explicit opt.audio always wins.
      const _aid = opt.audio ||
                   (opt.letter && slide.data && slide.data.phonemes && slide.data.phonemes[opt.letter]) || null;
      const _word = _aid ? ("assets/voiceover/" + _aid + "." + AUDIO_EXT) : null;
      const _afterWord = (cb)=>{ if(_word) play(_word, cb); else cb(); };
      if(isCorrect(opt, i)){
        state.locked = true; cell.classList.add("correct"); FLNMotion.correctSelect.play(cell);
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase },
             { is_correct:true, attempt: state.attempts + 1, score: state.attempts === 0 ? 1 : 0 }); }catch(e){}   /* kit recipe 19 - tile-level confirm; runs WITH the confetti, not instead of it */
        sfxCorrect(); confettiCannon(); setSwMood("happy");
        if(onCorrect) onCorrect(opt, cell);      // [kit] slide-level flourish (e.g. the result plate)
        recordResult(slide, state.attempts === 0);   // [QA 06] every answerable slide scores, not only "mastery"
        GameBus.emit(signalName, { slide_id: slide.id, phase: slide.phase, value: true,
          first_try: state.attempts === 0, attempts: state.attempts + 1,
          scaffold_level: state.scaffoldLevel, latency_ms: Date.now()-state.slideStart });
        _afterWord(()=> setTimeout(()=> completeSlide(true), 700));   // speak the word → then advance (confetti is the reward)
      } else {
        state.attempts++; cell.classList.add("crossed");
        /* [10] QA CHECKLIST: the wrong card auto-reverts after ~900ms and STAYS
           TAPPABLE, so this is the kit's transient .play() (release), no longer
           .out() (elimination). .play() releases at dur*1500+40 then fades over
           260ms = ~900ms at the default .4s beat, which is the spec figure.
           The .crossed class is left on only so existing logic still reads it;
           its dim/lock/cross are neutralised in style.css. */
        FLNMotion.wrongSelect.play(cell, { then: function(){ cell.classList.remove("crossed"); } });
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase },
             { is_correct:false, attempt: state.attempts, score: 0 }); }catch(e){}
        sfxWrongSoft(); setSwMood("tryagain");
        if(onWrong) onWrong(opt, cell);          // [kit] slide-level cue (e.g. gap vs overlap)
        // (do NOT count masteryAttempts here — the correct branch counts one attempt PER ITEM.)
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
        // LAYERED SCAFFOLD (A1): L1 re-listen → L2 hint → L3 REVEAL at max_attempts (never stuck).
        const _maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
        $("hintBtn").classList.add("show","hint-glow");
        _afterWord(()=>{   // speak the tapped word FIRST, then the layered feedback VO (no overlap)
          if(state.attempts >= _maxA){ revealAnswer("wrong"); }
          else if(state.attempts >= 2){ state.scaffoldLevel = Math.max(state.scaffoldLevel, 2);
            GameBus.emit("hint_shown", { slide_id: slide.id, manual: false });   // [QA 14] auto hint -> hint_used
            if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); }
          else { state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
            /* [QA 05] rung 1 = RE-LISTEN: the try-again line, then the question itself again
               (reask:false = the try-again line only, where the deck's incorrect feedback is just that line) */
            play(audioFor(slide, "try_again") || null, ()=>{ if(reask !== false && !state.locked && !state.hintActive) play(audioFor(slide, "prompt") || null, ()=>{}); }); }
        });
      }
    };
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
  host.appendChild(wrap);

  // ---- layered-hint helpers (A1/B2): reveal-on-max + a wired manual hint button ----
  function _correctCell(){ return [...grid.querySelectorAll(".opt-cell")].find(c => isCorrect(_opts[+c.dataset.key], +c.dataset.key)); }
  function revealAnswer(reason){
    if(state.locked) return; state.locked = true; state.scaffoldLevel = 3; setSwMood("hint");
    const el = _correctCell();
    [...grid.querySelectorAll(".opt-cell")].forEach(c => { if(c !== el) c.classList.add("faded"); });
    if(el) el.classList.add("correct", "ck-correct", "reveal-pulse");   // [QA 10] the spec green border, never the tick badge
    recordResult(slide, false);
    GameBus.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, reason });
    play(audioFor(slide, "reveal") || audioFor(slide, "correct") || audioFor(slide, "try_again") || null,
      ()=> setTimeout(()=> completeSlide(false), 800));
  }
  $("hintBtn").onclick = ()=>{ if(state.locked || state.hintActive) return;
    state.hintUsed = true; if(state.attempts < 1) state.attempts = 1;
    GameBus.emit("hint_shown", { slide_id: slide.id, manual: true });
    if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); };

  startNudge(slide, _nudge);
  // Tap-to-answer standard (lead review): a WRONG tap = soft buzz + ✕ + that card LOCKS (can't re-tap);
  // a RIGHT tap = confetti cannons + Swiftie cheer, then auto-advance. No select-then-आगे for pick questions.
  $("navBtn").style.display = "none"; setNavActive(false);
}

/* ---------- 10. RENDER HELPERS ---------- */
/* Render a picture as the real PNG (assets/<key>.png); if the file is
   missing it falls back to the emoji. Pass the image id (e.g. "pic_anaar"). */
function imgOrEmoji(imgKey, emoji, imgClass, emojiClass){
  if(imgKey){
    const fb = String(emoji||"❓").replace(/'/g,"");
    return `<img class="${imgClass}" src="assets/${imgKey}.${IMG_EXT}" alt="" `+
      `onerror="var s=document.createElement('span');s.className='${emojiClass}';s.textContent='${fb}';this.replaceWith(s);">`;
  }
  return `<span class="${emojiClass}">${emoji||"❓"}</span>`;
}
/* ordering/seriation render (MTKGA02_L02_S02): an object at a given magnitude. by="size" scales the
   picture uniformly; by="length" draws a content-true rounded bar of width∝mag; by="weight" shows the
   picture at a uniform size (weight is not visual — the child uses known heaviness / the balance cue). */
function imgOrEmojiSized(img, emoji, px){
  const fb = String(emoji||"❓").replace(/'/g,"");
  if(img) return `<img class="ord-obj-img" style="width:${px}px;height:${px}px" src="assets/${img}.${IMG_EXT}" alt="" `+
    `onerror="var s=document.createElement('span');s.className='ord-obj-emoji';s.style.fontSize='${Math.round(px*0.82)}px';s.textContent='${fb}';this.replaceWith(s);">`;
  return `<span class="ord-obj-emoji" style="font-size:${Math.round(px*0.82)}px">${emoji||"❓"}</span>`;
}
function renderOrdObj(o, by){
  if(by === "length"){ const w = {1:130,2:210,3:300}[o.mag] || 200;
    return `<div class="ord-bar" style="width:${w}px;background:${o.color||"#F5A623"}"></div>`; }
  // size AND weight scale the picture by visual magnitude — so a BIG-but-LIGHT balloon looks big and
  // tempts the child (bigger=heavier misconception), while the small stone is the correct heaviest pick.
  const px = {1:80, 2:116, 3:154}[o.mag] || 116;
  return imgOrEmojiSized(o.img, o.emoji, px);
}

/* shape helpers (maths): render circle/square/triangle/rectangle as inline SVG in
   any colour / size / rotation (LO: recognise regardless of orientation or size).
   No image assets needed — shapes are pure geometry, so the sample renders offline. */
function shapeSVG(shape, opts){
  opts = opts || {};
  const color = opts.color || "#386AF6";
  const size  = opts.size  || 120;
  const rot   = opts.rotate || 0;
  let inner = "";
  if(shape === "circle")         inner = `<circle cx="50" cy="50" r="42" fill="${color}"/>`;
  else if(shape === "square")    inner = `<rect x="12" y="12" width="76" height="76" rx="0" fill="${color}"/>`;   // TRUE corners — teachable geometry is never rounded
  else if(shape === "triangle")  inner = `<polygon points="50,9 91,89 9,89" fill="${color}"/>`;
  else if(shape === "rectangle") inner = `<rect x="6" y="28" width="88" height="44" rx="0" fill="${color}"/>`;    // TRUE corners
  const g = rot ? `<g transform="rotate(${rot} 50 50)">${inner}</g>` : inner;
  return `<svg class="shape-svg" viewBox="0 0 100 100" width="${size}" height="${size}" `+
         `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
}

/* VISUAL-FIRST quantity: a HAND showing n fingers up (assets/hand_1..5) — pre-reader,
   NO number-word text. Falls back to the numeral only if n is outside 1..5 or the art is missing. */
function fingerCount(n, cls){ cls = cls || "finger-hand";
  if(!(n>=1 && n<=5)) return `<span class="num-glyph">${n}</span>`;
  return `<img class="${cls}" src="assets/hand_${n}.png" alt="" ` +
    `onerror="var s=document.createElement('span');s.className='num-glyph';s.textContent='${n}';this.replaceWith(s);">`;
}
/* DISPLAY numeral: ALWAYS Arabic (1 2 3) on screen — kids learn the universal digit.
   Spoken VO stays Hindi (एक/दो/तीन) via the separate vo_num_/vo_total_ audio files. */
function devNumeral(n){ return String(n); }

/* ---------- 10b. DEVANAGARI GLYPH INK-CENTERING ----------
   Devanagari glyphs carry matras above (ओ, औ, अं) and below (ऋ) the shirorekha,
   so plain flex `align-items:center` leaves them sitting high with a gap below —
   and the offset differs per glyph. Measure each glyph's real ink box (canvas
   actualBoundingBox) + its baseline in the DOM, then translateY so the INK is
   truly centred in its tile/box. Font-agnostic; recomputed on mount + fonts.ready. */
let _inkCtx = null;
function centerInkGlyph(span){
  if(!span || !span.parentElement) return;
  const glyph = (span.textContent || "").trim();
  if(!glyph) return;
  const box = span.parentElement;
  const cs = getComputedStyle(span);
  const fpx = parseFloat(cs.fontSize);
  if(!fpx) return;
  _inkCtx = _inkCtx || document.createElement("canvas").getContext("2d");
  _inkCtx.font = `${cs.fontWeight} ${fpx}px ${cs.fontFamily}`;
  const m = _inkCtx.measureText(glyph);
  const a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
  if(!isFinite(a) || !isFinite(d)) return;
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  span.style.transform = "";   // reset before measuring baseline
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  span.appendChild(probe);
  const baseScreen = probe.getBoundingClientRect().top;
  span.removeChild(probe);
  const br = box.getBoundingClientRect();
  if(br.height < 5) return;    // not laid out yet
  const boxCenter = br.top + br.height/2;
  const inkCenter = baseScreen + ((d - a)/2) * scale;   // screen px
  const dy = (boxCenter - inkCenter) / scale;           // css px to move glyph down
  span.style.transform = `translateY(${dy}px)`;
}
function centerAllGlyphs(root){
  (root || document).querySelectorAll(".ink-glyph").forEach(centerInkGlyph);
}


/* ---------- 12. SLIDE MODULES ---------- */
/* ---------- [pv kit] PVK - the place-value addition kit, shared by every slide of MTG2A01_L03_S01 (without
   regrouping) and MTG2A01_L03_S02 (with regrouping). The SME decks draw one model on every page: a दहाई | इकाई
   place-value table per number, a green rod for each ten (assets/pv_rod11.webp, ten of the cubes) and an orange
   cube for each one (assets/pv_cube10.webp), and a third table below for the sum. Everything here is placed in STAGE
   px (1333 x 750): the scene's 0,0 is put on the stage's 0,0 whatever host it is mounted in (the tutorial card or
   the slide host). Moves animate the `translate` property, never `transform` (as MDK in MTG2A04 - a CSS `scale`
   on a pulsing block would multiply anything in `transform`). CSS [pv kit]. ---------- */
/* the idle hand TOUCHES what it points at (user 2026-10-15: "the hand nudges are not correct"): the engine's
   placeNudge stood the fingertip 8px below the target, pointing up at it - under a + button, a block or the answer
   box it read as pointing at nothing, and its tap ripple broke out beside the target. Same hand, same clamping into
   the stage; the fingertip now lands on the target's lower part, where a finger would press it. */
placeNudge = (function(base){
  return function(el){
    const nh = $("nudgeHand"), host = document.querySelector(".slide-stage");
    if(!el || !nh || !host || !el.getBoundingClientRect) return base(el);
    const r = el.getBoundingClientRect(), sw = host.getBoundingClientRect();
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
    const w = r.width / scale, h = r.height / scale, cx = (r.left - sw.left) / scale + w / 2;
    const tipY = (r.top - sw.top) / scale + h - Math.min(h * 0.35, 26);
    const stageW = sw.width / scale, stageH = sw.height / scale;
    nh.style.left = Math.max(0, Math.min(stageW - NH.W, cx - NH.TIP_X)) + "px";
    nh.style.top = Math.max(0, Math.min(stageH - NH.H, tipY - NH.TIP_Y)) + "px";
    nh.style.clipPath = "";
    if(!nh.classList.contains("show")) sfxNudge();
    nh.classList.add("show");
    return true;
  };
})(placeNudge);
/* a character's picture: the supplied art (assets/char_<who>.webp - pv-addition-kit/make_characters.py, from the
   character sheets, e.g. Pari and Aaru 2026-10-08) when the lesson ships it, else the drawn portrait (char_<who>.svg,
   tools/make_avatars.py). full: the whole figure (the first screen), null when there is none; full "cheer": the whole
   figure cheering (char_<who>_cheer.webp), "carry": carrying blocks (char_<who>_carry.webp) - null when there is none. */
function pvChar(w, full){
  const has = f => Object.prototype.hasOwnProperty.call(ASSET_SIZES, f), base = "assets/char_" + w;
  if(full){ const f = base + (full === true ? "_full" : "_" + full) + ".webp"; return has(f) ? f : null; }
  return has(base + ".webp") ? base + ".webp" : base + ".svg";
}
/* blinks (user 2026-10-15: "make the characters' eyes blink throughout the game"): every character picture on screen
   (the story pages' portraits, the first screen's figures) that has an eyes-shut copy (char_<...>_blink.webp,
   make_blinks.py - only the eyes differ) shows it for a moment every 2.5-6s, each on its own clock, now and then twice.
   The copy is decoded before its first use, so the swap is instant; the shadows' copies (.sgp-cast) do not blink. */
const PVBlink = (function(){
  const ready = {}, SEL = ".pv-av, .sgp-fw .sgp-pose";
  const shut = src =>{ const f = src.replace(/(\.webp)(\?.*)?$/, "_blink$1"); return Object.prototype.hasOwnProperty.call(ASSET_SIZES, f) ? f : null; };
  /* the boot loader shows its pictures from blob: URLs (Assets) and keeps the file in data-asset - and it swaps any
     file path an <img> is given for its blob. So the shut copy is shown by the very URL that was decoded for it (its
     blob when fetched), and the open one comes back by the blob it had, with data-asset put back */
  const load = f =>{ if(!ready[f]){ const u = (Assets.blob(f) && Assets.url(f)) || f, im = new Image(); ready[f] = "loading"; im.src = u;
    (im.decode ? im.decode() : Promise.resolve()).then(()=>{ ready[f] = { u, im }; }, ()=>{ delete ready[f]; }); } return ready[f] && ready[f] !== "loading"; };
  const shown = im => im.isConnected && im.getClientRects().length && getComputedStyle(im).opacity !== "0";
  const blink = (im, f, open, file)=>{ const u = ready[f].u; im.dataset.blinking = 1; im.src = u;
    setTimeout(()=>{ const s = im.getAttribute("src");
      if(s === u || im.dataset.asset === f){ im.src = open; im.setAttribute("data-asset", file); } delete im.dataset.blinking; }, 130); };
  setInterval(()=>{
    if(document.hidden || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    const now = Date.now();
    document.querySelectorAll(SEL).forEach(im =>{
      if(im.dataset.blinking) return;
      const open = im.getAttribute("src"), file = (im.dataset.asset || open || "").replace("_blink.webp", ".webp"), f = open && shut(file); if(!f) return;
      if(!im.dataset.next){ im.dataset.next = now + 1200 + Math.random() * 3500; load(f); return; }
      if(now < +im.dataset.next || !shown(im) || !load(f)) return;
      im.dataset.next = now + 2500 + Math.random() * 3500;
      blink(im, f, open, file); if(Math.random() < .18) setTimeout(()=>{ if(!im.dataset.blinking) blink(im, f, im.getAttribute("src"), file); }, 300);   // now and then twice
    });
  }, 100);
  return { shut };
})();
const PVK = (function(){
  const reduce = ()=> !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const px = v => (Math.round(v * 10) / 10) + "px";
  const wait = ms => new Promise(r => setTimeout(r, reduce() ? Math.min(ms, 60) : ms));
  /* the blocks are the user's front-on cubes (make_blocks.py, review 2026-10-14): the green rod and the orange cube are
     drawn at one proportion, so a rod is as wide as a cube and ten cubes stacked at its step ARE the rod. pitch = how far
     up the next cube in a stack sits, as a share of the cube's width. */
  const ROD = { src: "assets/pv_rod11.webp", ar: 987 / 147 };       // h / w of the art
  const CUBE = { src: "assets/pv_cube10.webp", ar: 289 / 300, pitch: 93.2 / 147 };
  /* front-on cubes are taller per cube than the old isometric ones (a rod 6.7 widths tall, was 5.2): the layouts keep
     every rod at its old height and the blocks get narrower to match (user's choice 2026-10-14: "smaller blocks, same
     layout"). A table's `cube` stays its layout size; its blocks are FIT of it. */
  const FIT = (1559 / 300) / ROD.ar;
  const kNow = ()=> parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  function add(parent, tag, cls, css){ const e = document.createElement(tag); if(cls) e.className = cls; if(css) e.style.cssText = css; parent.appendChild(e); return e; }
  const setXY = (e, x, y)=>{ e._x = x; e._y = y; e.style.left = px(x); e.style.top = px(y); };
  const xy = e => ({ x: e._x, y: e._y });
  const knock = ()=> _tone([392, 311], "sine", 0.14, 0.09);      // a soft wooden set-down
  /* the pop-in plays once and its class goes: left on, any later animation on the element (a pulse, a highlight)
     would replace it and, when that one ends, bring the pop back - replayed from nothing */
  const pop = e =>{ if(!e) return; e.classList.remove("pv-pop"); void e.offsetWidth; e.classList.add("pv-pop");
    const end = ev =>{ if(!/^pv(Btn|Rod)?Pop$/.test(ev.animationName)) return; e.removeEventListener("animationend", end); e.classList.remove("pv-pop"); };
    e.addEventListener("animationend", end); };
  const show = (e, on)=>{ if(!e) return; e.classList.toggle("pv-hide", on === false); if(on !== false) pop(e); };
  /* the lateral buzz of the FLN kit (recipes 11/20): +-9px decaying, .4s, on `translate` */
  /* the decks' idle cue ("if idle, pulsate again"): the pulse restarts from its start, with the nudge chime - no hand
     (user 2026-10-15: match the decks; their hand nudges are only the answer counter's and the ghost drags) */
  function repulse(el){ if(!el) return; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); try{ sfxNudge(); }catch(e){} }
  function shake(el, amp){ if(!el || reduce()) return; const a = amp || 9;
    el.animate([{ translate: "0 0" }, { translate: -a + "px 0" }, { translate: a + "px 0" }, { translate: -a * .67 + "px 0" },
                { translate: a * .67 + "px 0" }, { translate: "0 0" }], { duration: 400, easing: "ease-in-out" }); }
  /* the kit's hint glow (recipe 12): a green ring, three soft pulses */
  function softGlow(el){
    if(!el) return null;
    const own = getComputedStyle(el).boxShadow, b = own && own !== "none" ? own + ", " : "";
    return el.animate([{ boxShadow: b + "0 0 0 0 rgba(0,177,50,0), 0 0 0 0 rgba(0,177,50,0)" },
                       { boxShadow: b + "0 0 0 8px rgba(0,177,50,.32), 0 10px 26px rgba(0,177,50,.34)" },
                       { boxShadow: b + "0 0 0 0 rgba(0,177,50,0), 0 0 0 0 rgba(0,177,50,0)" }],
                      { duration: 1100, iterations: reduce() ? 1 : 3, easing: "ease-in-out" });
  }

  /* ---- the scene: absolute, stage px, 0,0 = the stage's top-left. Only its children take pointer events. ---- */
  function scene(host){
    host.style.position = "relative";
    const sc = add(host, "div", "pv-stage");
    const st = $("stage").getBoundingClientRect(), hr = host.getBoundingClientRect(), k = kNow();
    sc.style.left = px(-(hr.left - st.left) / k); sc.style.top = px(-(hr.top - st.top) / k);
    const card = host.closest(".tut-card"); if(card) card.classList.add("tc-pv");
    return sc;
  }

  /* ---- a slide's run context: alive / guard, its VO (one role at a time), cued VO, waits ----
     say(role): the slide's clip for that role (silent beat when it has none); cue(role, [[fraction, fn], ...]): the
     same, with each fn fired when the clip reaches that fraction of its length (in sync with the VO). A slide that
     is left throws C.STOP out of every await, so its run simply ends. */
  function ctx(slide, sc){
    const STOP = {};
    const C = { slide, sc, STOP, cur: null,
      alive: ()=> CARD.slides[state.idx] === slide && sc.isConnected,
      guard(){ if(!C.alive()) throw STOP; },
      has: role => !!audioFor(slide, role),
      wait: ms => wait(ms).then(()=> C.guard()),
      say(role){ return C.cue(role, []); },
      cue(role, cues){
        cues = (cues || []).slice().sort((p, q)=> p[0] - q[0]);
        let i = 0; const fireTo = f =>{ while(i < cues.length && cues[i][0] <= f){ try{ cues[i][1](); }catch(e){ console.error(e); } i++; } };
        return new Promise(res =>{
          if(!C.alive()) return res();
          const src = audioFor(slide, role);
          if(src) C.cur = role;
          fireTo(0);
          if(!src){ const t0 = performance.now(); const tick = ()=>{ if(!C.alive()) return res(); const f = (performance.now() - t0) / 700;
              fireTo(f); if(f >= 1) res(); else requestAnimationFrame(tick); }; if(cues.length) requestAnimationFrame(tick); else res(); return; }
          let raf = 0;
          const tick = ()=>{ if(!C.alive()) return; const d = voEl.duration;
            if(isFinite(d) && d > 0 && srcOf(voEl) === src) fireTo(voEl.currentTime / d); raf = requestAnimationFrame(tick); };
          play(src, ()=>{ cancelAnimationFrame(raf); fireTo(1); res(); });
          raf = requestAnimationFrame(tick);
        }).then(()=> C.guard());
      },
      sayNum(n){ return new Promise(r => play("assets/voiceover/vo_num_" + n + "." + AUDIO_EXT, r)).then(()=> C.guard()); }
    };
    return C;
  }
  const run = (C, fn)=> fn().catch(e =>{ if(e !== C.STOP) console.error("[pv]", e); });

  /* ---- blocks: a rod (kind "t", size = its height) or a cube (kind "o", size = its side) ---- */
  function block(sc, kind, x, y, size){
    const e = add(sc, "img", "pv-blk pv-" + (kind === "t" ? "rod" : "cube"));
    e.src = kind === "t" ? ROD.src : CUBE.src; e.alt = ""; e.draggable = false;
    const w = kind === "t" ? size / ROD.ar : size, h = kind === "t" ? size : size * CUBE.ar;
    e.style.width = px(w); e.style.height = px(h); e._w = w; e._h = h; e._kind = kind;
    setXY(e, x, y); return e;
  }
  /* move an element (a block, a card, the hand) along a gentle arc or straight; resolves when it is there */
  function glide(e, to, ms, arc){
    return new Promise(res =>{
      const from = xy(e), dx = to.x - from.x, dy = to.y - from.y;
      if(e._gl){ const old = e._gl; e._gl = null; old.cancel(); }
      if(reduce() || ms <= 0 || (Math.abs(dx) < .5 && Math.abs(dy) < .5)){ setXY(e, to.x, to.y); res(); return; }
      const up = arc ? -Math.min(90, 24 + Math.hypot(dx, dy) * 0.18) : 0;
      e.classList.add("moving");
      const a = e.animate([{ translate: "0px 0px" }, { translate: dx / 2 + "px " + (dy / 2 + up) + "px", offset: .5 }, { translate: dx + "px " + dy + "px" }],
                          { duration: ms, easing: "cubic-bezier(.45,.05,.35,1)" });
      e._gl = a;
      const done = ()=>{ if(e._gl !== a) return res(); e._gl = null; setXY(e, to.x, to.y); e.classList.remove("moving"); res(); };
      a.onfinish = done; a.oncancel = done;
    });
  }
  const shift = (e, dx, dy, ms)=> glide(e, { x: e._x + dx, y: e._y + dy }, ms, false);

  /* ---- the demonstrating hand (the engine's nudge-hand art; its fingertip is NH.TIP_X / TIP_Y of its 86x108 box) ---- */
  function hand(sc){
    const el = add(sc, "img", "pv-hand"); el.src = "assets/nudge_hand_new.svg"; el.alt = "";
    const at = p =>({ x: p.x - NH.TIP_X, y: p.y - NH.TIP_Y });
    return { el,
      on(p){ setXY(el, at(p).x, at(p).y); el.classList.add("on"); },
      off(){ el.classList.remove("on", "press"); },
      to(p, ms){ return glide(el, at(p), ms == null ? 420 : ms, false); },
      async tap(p){ if(!el.classList.contains("on")) this.on({ x: p.x + 40, y: p.y + 60 }); await this.to(p, 380);
        el.classList.add("press"); await wait(150); el.classList.remove("press"); await wait(90); } };
  }
  const centre = (e, sc)=>{ const r = e.getBoundingClientRect(), s = sc.getBoundingClientRect(), k = kNow();
    return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k }; };

  /* ---- numbers: each digit its own span (tens .pv-dt, ones .pv-do) so the VO can light the digit it names ---- */
  function numHTML(n){
    const s = String(n);
    if(s.length === 2) return '<span class="pv-d pv-dt">' + s[0] + '</span><span class="pv-d pv-do">' + s[1] + '</span>';
    if(s.length === 1) return '<span class="pv-d pv-do">' + s + '</span>';
    return '<span class="pv-d">' + s + '</span>';
  }
  function numCard(sc, n, cx, y, h, cls){
    const e = add(sc, "div", "pv-num " + (cls || ""), "height:" + px(h) + ";font-size:" + px(h * .7) + ";min-width:" + px(h * 1.55) + ";border-radius:" + px(h * .28));
    e.innerHTML = n == null ? "?" : numHTML(n); setXY(e, cx, y); e._n = n; return e;
  }
  const lightDigit = (card, which, on)=>{ if(!card) return; const d = card.querySelector(which === "t" ? ".pv-dt" : ".pv-do");
    if(d) d.classList.toggle(which === "t" ? "hl-t" : "hl-o", on !== false); };
  /* the equation row "a + b = ?" (one flex row, centred on cx) */
  /* ---- a dotted outline (the ten's ring, the drop target) with ONE dot missing: the gap travels round the shape a dot at a
     time while the dots stay put (review 2026-10-14). An SVG rect over the box: w x h its size, sw the line, r the corner,
     dash / gap the dot and space in px; one more than "dash" is left out so the pattern goes exactly round. ---- */
  function dashBox(el, w, h, sw, r, dash, gap){
    const NS = "http://www.w3.org/2000/svg", i = sw / 2, iw = w - sw, ih = h - sw, rr = Math.max(0, Math.min(r - i, iw / 2, ih / 2));
    const per = 2 * (iw + ih) - 8 * rr + 2 * Math.PI * rr, n = Math.max(6, Math.round(per / (dash + gap)));
    const d = 10 * dash / (dash + gap), g = 10 - d, pat = [];
    for(let k = 0; k < n - 2; k++) pat.push(d, g);
    pat.push(d, g + d + g);                                         // the missing dot
    const svg = document.createElementNS(NS, "svg"), rc = document.createElementNS(NS, "rect");
    svg.setAttribute("class", "pv-dash"); svg.setAttribute("width", w); svg.setAttribute("height", h);
    [["x", i], ["y", i], ["width", iw], ["height", ih], ["rx", rr], ["pathLength", n * 10], ["stroke-dasharray", pat.map(v => +v.toFixed(3)).join(" ")]]
      .forEach(([k, v])=> rc.setAttribute(k, v));
    svg.appendChild(rc); el.appendChild(svg);
    if(!reduce()) rc.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -n * 10 }],
                             { duration: n * 85, iterations: Infinity, easing: "steps(" + n + ")" });
    return svg;
  }
  function equation(sc, a, b, cx, y, h){
    const row = add(sc, "div", "pv-eq", "height:" + px(h) + ";--h:" + px(h));
    const box = (n, cls)=>{ const e = add(row, "div", "pv-num " + cls, "height:" + px(h) + ";font-size:" + px(h * .7) + ";min-width:" + px(h * 1.55) + ";border-radius:" + px(h * .28) + ";position:relative");
      e.innerHTML = n == null ? "?" : numHTML(n); return e; };
    const sym = t =>{ const e = add(row, "span", "pv-op", "font-size:" + px(h * .78)); e.textContent = t; return e; };
    const E = { el: row, a: box(a, "pv-ea"), plus: sym("+"), b: box(b, "pv-eb"), eq: sym("="), q: box(null, "pv-q") };
    E.fill = n =>{ E.q.innerHTML = numHTML(n); E.q.classList.add("filled"); pop(E.q); };
    setXY(row, cx, y); return E;
  }
  /* ---- one person of a story page: the round portrait and the name under it ---- */
  function person(sc, who, name, cx, y, size){
    const list = Array.isArray(who) ? who : [who];
    const e = add(sc, "div", "pv-person", "width:" + px(size * (list.length > 1 ? 1.55 : 1)));
    e.innerHTML = '<div class="pv-avs">' + list.map((w, i)=> '<img class="pv-av" alt="" src="' + pvChar(w) + '" style="width:' +
      px(list.length > 1 ? size * .82 : size) + (i ? ';margin-left:' + px(-size * .2) : '') + '">').join("") + '</div>' +
      (name ? '<div class="pv-name">' + name + '</div>' : "");
    setXY(e, cx, y); return e;
  }

  return { reduce, px, wait, ROD, CUBE, FIT, dashBox, kNow, add, setXY, xy, knock, pop, show, shake, repulse, softGlow, scene, ctx, run, block, glide, shift,
           hand, centre, numHTML, numCard, lightDigit, equation, person };
})();

/* ---- [pv kit] the place-value table, block groups, moving blocks between tables, making a ten ---- */
Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, ROD, CUBE } = K;
  /* a दहाई | इकाई table. o: { cx, y, cube (a cube's side - a rod is ten of them, as wide as one), tensMax (rod places the column is wide for),
     tensFinal (the rods it will hold - they stand centred in their column), onesMax (cube places: rows of 5, the
     first two rows a ten-frame) }. Blocks are NOT children of the table: they are scene elements standing on its
     places, so they can fly from one table to another. T.rods / T.cubes = what stands on it now, in place order. */
  function table(sc, o){
    /* Q: the table's layout size; G: its blocks - o.blk (each screen's layout sets it as big as its room allows, review
       2026-10-14 "make the cubes look bigger"), else core FIT of Q. o.pad: the inner margin (tight screens trim it) */
    const Q = o.cube, G = o.blk || Q * K.FIT;
    const g = Math.max(4, Math.round(Q * .2)), rW = G, rH = G * ROD.ar, rg = Math.max(6, Math.round(rW * .5));
    const pad = o.pad != null ? o.pad : Math.round(Q * .45) + 4, head = Math.round(Q * .55 + 22), cH = G * CUBE.ar;
    const rows = Math.max(2, Math.ceil((o.onesMax || 9) / 5)), tSlots = Math.max(o.tensMax || 5, 3);
    /* the two columns are always the same width: the wider one's need sets both (blocks centre in their column) */
    /* a table that can reach ten ones keeps a rod lane at the right of its इकाई column: the new ten forms there,
       inside the table, and waits there until it is put in the tens column */
    const lane = (o.onesMax || 9) >= 10 ? rW + 2 * g : 0;
    const onesNeed = 5 * G + 4 * g + lane + 2 * pad, colW = Math.max(onesNeed, tSlots * rW + (tSlots - 1) * rg + 2 * pad);
    const onesW = colW, tensW = colW, onesIn = (colW - onesNeed) / 2;
    /* every row the same gap apart (user 2026-10-15 "spacing between each cube should be the same"; before: rows after
       the ten-frame stood 12px lower to clear its ring - the ring now runs in the gap itself, see ring()) */
    const TF = 0, rowsH = r => r ? r * cH + (r - 1) * g + (r > 2 ? TF : 0) : 0;
    const inH = Math.max(rH, rowsH(rows)), H = head + inH + 2 * pad, W = tensW + onesW;
    const x = o.cx - W / 2, y = o.y, fs = Math.round(head * .64);   // (the दहाई / इकाई heads bigger, for reading - user 2026-10-15)
    const el = add(sc, "div", "pv-table", "width:" + px(W) + ";height:" + px(H) + ";--head:" + px(head));
    el.innerHTML = '<div class="pv-th pv-th-t" style="width:' + px(tensW) + ';height:' + px(head) + ';font-size:' + px(fs) + '">दहाई</div>' +
                   '<div class="pv-th pv-th-o" style="left:' + px(tensW) + ';right:0;height:' + px(head) + ';font-size:' + px(fs) + '">इकाई</div>' +
                   '<i class="pv-div" style="left:' + px(tensW - 1.5) + '"></i>';
    setXY(el, x, y);
    const T = { sc, el, x, y, W, H, G, g, rH, rW, rg, pad, head, inH, tensW, onesW, cH, rods: [], cubes: [], ghosts: [], extra: [],
                th: el.querySelector(".pv-th-t"), oh: el.querySelector(".pv-th-o") };
    /* every group stands in the CENTRE of its column (review 2026-10-14), for the blocks there NOW (n, default the list's
       length): the rods side by side; the cubes in rows of five (the first two a ten-frame); a new ten waiting in the
       इकाई column (T.laneRod) stands left of its cubes, the two centred together. T.relayout() re-centres after a change. */
    T.tensXY = (j, n)=>{ n = Math.max(n == null ? T.rods.length : n, j + 1, 1); const grp = n * rW + (n - 1) * rg;
      return { x: T.x + (tensW - grp) / 2 + j * (rW + rg), y: T.y + head + pad + (inH - rH) / 2 }; };
    T.onesBox = (n, rod)=>{ const cols = Math.min(n, 5), rows = Math.ceil(n / 5), bw = cols ? cols * G + (cols - 1) * g : 0,
      bh = rowsH(rows), gap = rod && n ? Math.max(10, 2 * g) : 0, tw = (rod ? rW : 0) + gap + bw,
      x0 = T.x + tensW + (onesW - tw) / 2, top = T.y + head + pad;
      return { rx: x0, ry: top + (inH - rH) / 2, cx: x0 + (rod ? rW + gap : 0), cy: top + (inH - bh) / 2 }; };
    T.onesXY = (i, n)=>{ const b = T.onesBox(Math.max(n == null ? T.cubes.length : n, i + 1), !!T.laneRod);
      const r = Math.floor(i / 5); return { x: b.cx + (i % 5) * (G + g), y: b.cy + r * (cH + g) + (r >= 2 ? TF : 0) }; };
    T.laneRod = null;
    T.slot = (kind, i, n)=> kind === "t" ? T.tensXY(i, n) : T.onesXY(i, n);
    /* glide every block not in flight to its centred place (one in flight re-settles when it lands) */
    T.relayout = (ms, skip, settling)=>{ ms = ms == null ? 320 : ms; const go = (b, p)=>{ if(b !== skip && !b._gl) glide(b, p, ms, false); };
      T.rods.forEach((b, j)=> go(b, T.tensXY(j))); T.cubes.forEach((b, i)=> go(b, T.onesXY(i)));
      if(T.laneRod){ const q = T.onesBox(T.cubes.length, true); go(T.laneRod, { x: q.rx, y: q.ry }); }
      /* blocks added quickly one after another were in flight just now: once things are still, settle them all */
      if(!settling){ clearTimeout(T._settle); T._settle = setTimeout(function again(){ if(!T.el.isConnected) return;
        if([...T.rods, ...T.cubes].some(b => b._gl)){ T._settle = setTimeout(again, 120); return; } T.relayout(220, null, true); }, ms + 80); } };
    T.list = kind => kind === "t" ? T.rods : T.cubes;
    /* a new block on the next place of its column, popping in */
    T.addBlock = kind =>{ const list = T.list(kind), p = T.slot(kind, list.length, list.length + 1);
      const b = K.block(sc, kind, p.x, p.y, kind === "t" ? rH : G); list.push(b); pop(b); T.relayout(260, b); return b; };
    /* the number built "one by one" (deck: "Show the PV tables with the numbers built using blocks one by one") */
    T.fill = async (n, step)=>{ const t = Math.floor(n / 10), u = n % 10;
      for(let j = 0; j < t; j++){ T.addBlock("t"); await wait(step == null ? 110 : step); }
      for(let i = 0; i < u; i++){ T.addBlock("o"); await wait(step == null ? 90 : step * .8); } };
    /* the column digits under the table (the place value written out): tens green, ones orange */
    T.digits = (tens, ones)=>{
      T.extra.filter(e => e.classList.contains("pv-dig")).forEach(e => e.remove());
      const mk = (cls, v, cx)=>{ const d = add(sc, "div", "pv-dig " + cls); d.textContent = String(v); setXY(d, cx, T.y + H); T.extra.push(d); pop(d); return d; };
      return { t: mk("pv-dig-t", tens, T.x + tensW / 2), o: mk("pv-dig-o", ones, T.x + tensW + onesW / 2) };
    };
    T.lightHead = (which, on)=> (which === "t" ? T.th : T.oh).classList.toggle("hl", on !== false);
    /* the whole table with everything standing on it (blocks, digits, its number card) */
    T.all = ()=> [T.el, ...T.rods, ...T.cubes, ...T.extra];
    T.move = (dx, dy, ms)=>{ T.x += dx; T.y += dy; return Promise.all(T.all().map(e => K.shift(e, dx, dy, ms))); };
    T.fade = ()=>{ [...T.all(), ...T.ghosts].forEach(e => e.classList.add("pv-gone")); };
    return T;
  }
  const showTable = (T, on)=>{ T.el.classList.toggle("pv-hide", on === false); if(on !== false) pop(T.el); };

  /* a block flies from table A to the next place of its column in table S; a grey copy stays where it was
     (deck: "each tapped block moves to the sum card, leaving a greyed-out image behind") */
  function transfer(b, A, S, ms){
    const list = A.list(b._kind), i = list.indexOf(b); if(i >= 0) list.splice(i, 1);
    b.classList.remove("pv-tap", "pulse", "hl");
    const gh = b.cloneNode(false); gh.className = "pv-blk pv-ghost pv-" + (b._kind === "t" ? "rod" : "cube");
    setXY(gh, b._x, b._y); A.sc.insertBefore(gh, b); A.ghosts.push(gh);
    const dest = S.list(b._kind), p = S.slot(b._kind, dest.length, dest.length + 1); dest.push(b);
    b.style.zIndex = 30; S.relayout(ms == null ? 620 : ms, b);
    return glide(b, p, ms == null ? 620 : ms, true).then(()=>{ b.style.zIndex = ""; K.knock(); S.relayout(220); });
  }
  /* highlight a set one after another (the VO naming them) */
  /* a new ten blinks twice as it forms; .pv-new then goes, or the blink would play again whenever a later highlight
     (.hl, a sweep) ends and hands the animation back to it (user 2026-10-14: "the last green stick was blinking") */
  function newTen(rod){ rod.classList.add("pv-new");
    const off = ()=> rod.classList.remove("pv-new");
    rod.addEventListener("animationend", e =>{ if(e.animationName === "pvInnerBlink") off(); });
    setTimeout(off, 2500); }
  function sweep(list, step){ (list || []).forEach((e, i)=> setTimeout(()=>{ if(!e.isConnected) return;
    e.classList.remove("hl"); void e.offsetWidth; e.classList.add("hl"); setTimeout(()=> e.classList.remove("hl"), 1900); }, i * (step == null ? 110 : step))); }
  /* the dashed ring round the first ten cubes of a table (the ten-frame's two rows) */
  function ring(T, on){
    const rp = Math.min(7, T.g / 2);                                       // (it hugs the ten: half the gap, so the next row stays clear)
    if(!T._ring){ const w = 5 * T.G + 4 * T.g + 2 * rp, h = 2 * T.cH + T.g + 2 * rp;
      T._ring = add(T.sc, "div", "pv-ring pv-hide", "width:" + px(w) + ";height:" + px(h)); K.dashBox(T._ring, w, h, 4, 14, 11, 8);
      T.extra.push(T._ring); }
    if(on !== false){ const p = T.onesXY(0); setXY(T._ring, p.x - rp, p.y - rp); }      // round the first ten where they stand now
    T._ring.classList.toggle("pv-hide", on === false); if(on !== false) pop(T._ring);
    return T._ring;
  }
  /* MAKE A TEN: the first ten cubes of table S stack into one column in their इकाई column - left of the cubes left over, the
     two centred together - (each one on its place in the rod - a rod is ten cubes), and become ONE rod (a "new ten", glowing); the cubes left over move up to the first places.
     Resolves with that rod - not yet in S.rods: it waits in the lane until it is put in the tens column. */
  async function makeTen(S){
    const ten = S.cubes.slice(0, 10), rest = S.cubes.slice(10);
    S.cubes = rest; S.laneRod = ten[9];                               // (a stand-in until the rod is made: the layout leaves its place)
    const q = S.onesBox(rest.length, true), rx = q.rx, ry = q.ry, sc = S.sc;
    rest.forEach((c, i)=> glide(c, S.onesXY(i), 560, false));
    const unit = S.G * CUBE.pitch;                                 // one cube's step = one tenth of the rod
    ring(S, false);
    await Promise.all(ten.map((c, j)=> wait(j * 45).then(()=>{
      c.style.zIndex = 30;
      return glide(c, { x: rx, y: ry + (9 - j) * unit }, 560, true);
    })));
    await wait(140);
    const rod = K.block(sc, "t", rx, ry, S.rH); newTen(rod); pop(rod);
    ten.forEach(c =>{ c.classList.add("pv-gone"); setTimeout(()=> c.remove(), 400); });
    try{ playSfxFile("sfx_correct", 0.5); }catch(e){}
    S.laneRod = rod;
    await wait(420);
    return rod;
  }
  /* a person's blocks on a story page: the rods side by side, then the cubes in columns of five, bottom-aligned.
     g.add(blocks) re-lays a set of blocks (another group's, flying in) into this group's places */
  function group(sc, n, cx, bottom, H){
    const G = { sc, n, cx, bottom, H, rods: [], cubes: [] };
    const rW = H / ROD.ar, cs = rW, cH = cs * CUBE.ar, fH = cs * CUBE.pitch;   // a cube = one of the rod's ten
    /* the cubes stack like the rod's (each one's top face under the next one), so five of them are half a rod */
    G.layout = (t, u)=>{ const cols = Math.ceil(u / 5), rw = t ? t * rW + (t - 1) * 5 : 0, cw = cols ? cols * cs + (cols - 1) * 3 : 0;
      const W = rw + (t && cols ? 10 : 0) + cw, x0 = cx - W / 2, cx0 = x0 + rw + (t && cols ? 10 : 0);
      return { rod: j =>({ x: x0 + j * (rW + 5), y: bottom - H }), cube: i =>({ x: cx0 + Math.floor(i / 5) * (cs + 3), y: bottom - cH - (i % 5) * fH }) }; };
    G.make = ()=>{ const t = Math.floor(n / 10), u = n % 10, L = G.layout(t, u);
      for(let j = 0; j < t; j++){ const p = L.rod(j); G.rods.push(K.block(sc, "t", p.x, p.y, H)); }
      for(let i = 0; i < u; i++){ const p = L.cube(i); G.cubes.push(K.block(sc, "o", p.x, p.y, cs)); } return G; };
    G.all = ()=> [...G.rods, ...G.cubes];
    G.cs = cs; G.rW = rW;
    return G;
  }
  return { table, showTable, transfer, newTen, sweep, ring, makeTen, group };
})());

/* ---- [pv kit] what the child does: add blocks with the + buttons, tap blocks across into the sum table, make a
   ten and drag it to the tens column; and the same moves played by the game (Swifty's demo, the hints) ---- */
Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, shake } = K;
  const idleMs = ()=> IDLE_MS;

  /* the two source buttons under a table being built: [rod +] (दहाई) and [cube +] (इकाई); centred on mid (stage x)
     when given - the screen's centre, review 2026-10-14 - else under the table */
  function sources(sc, T, y, mid){
    const mk = (kind, cx)=>{ const b = add(sc, "button", "pv-src pv-hide"); b.type = "button";
      b.innerHTML = '<img alt="" src="' + (kind === "t" ? K.ROD.src : K.CUBE.src) + '"><span class="pv-plus">+</span>';
      b.setAttribute("aria-label", kind === "t" ? "दहाई" : "इकाई"); setXY(b, cx, y); b._kind = kind; return b; };
    const cx = mid != null ? mid : T.x + T.W / 2, S = { t: mk("t", cx - 74), o: mk("o", cx + 74) };
    S.show = on =>{ K.show(S.t, on); K.show(S.o, on); };
    S.remove = ()=>{ S.t.remove(); S.o.remove(); };
    return S;
  }
  /* the child adds n blocks of one kind with its + button: it pulses, each tap adds one, it switches off at n.
     Idle 7s: it pulses again (the decks: "if idle after 1 tap, pulsate again"). */
  function childAdd(C, btn, T, n, kind){
    return new Promise(res =>{
      if(!n) return res();
      let got = 0, idleT = 0;
      btn.classList.remove("off"); btn.classList.add("pulse");
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || got >= n) return; K.repulse(btn); arm(); }, idleMs()); };
      btn.onclick = ()=>{
        if(!C.alive() || got >= n) return;
        stopNudge(); got++; T.addBlock(kind); K.knock();
        GameBus.emit("pv_block_added", { slide_id: C.slide.id, kind, count: got });
        if(got >= n){ clearTimeout(idleT); btn.onclick = null; btn.classList.remove("pulse"); btn.classList.add("off"); setTimeout(res, 380); }
        else arm();
      };
      arm();
    });
  }
  /* Swifty's hand taps a + button n times (the deck: "Swiftee adds 2 rods by tapping on plus") */
  async function demoAdd(C, H, btn, T, n, kind){
    for(let j = 0; j < n; j++){
      await H.tap(K.centre(btn.querySelector(".pv-plus"), C.sc)); C.guard();
      T.addBlock(kind); K.knock(); await C.wait(260);
    }
  }
  /* the child taps blocks of one kind (or any kind, kind null) in the addend tables: each flies to the sum table.
     Resolves when none are left. Other blocks are not tappable meanwhile. Idle 7s: they pulse + the hand. */
  function tapAcross(C, from, S, kind){
    return new Promise(res =>{
      const pool = ()=> from.flatMap(T => kind ? T.list(kind) : [...T.rods, ...T.cubes]);
      if(!pool().length) return res();
      let flying = 0, idleT = 0, fin = false;
      const done = ()=>{ if(fin || pool().length || flying) return; fin = true; clearTimeout(idleT); res(); };
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin) return;
        pool().forEach(b => K.repulse(b)); arm(); }, idleMs()); };   // the decks: "pulsate the blocks until all are tapped"
      from.forEach(T => [...T.rods, ...T.cubes].forEach(b =>{
        if(kind && b._kind !== kind) return;
        b.classList.add("pv-tap");
        b.onclick = ()=>{
          if(!C.alive() || !b.classList.contains("pv-tap")) return;
          stopNudge(); b.onclick = null; flying++;
          pool().forEach(x => x.classList.remove("pulse"));
          const A = from.find(T => T.list(b._kind).includes(b));
          K.transfer(b, A, S).then(()=>{ flying--; GameBus.emit("pv_block_moved", { slide_id: C.slide.id, kind: b._kind }); done(); });
          arm();
        };
      }));
      from.forEach(T => T.list(kind || "t").forEach(b => b.classList.add("pulse")));
      if(!kind) from.forEach(T => T.cubes.forEach(b => b.classList.add("pulse")));
      arm();
    });
  }
  /* Swifty's hand taps every block of one kind across, one after another (PV_DEMO auto) */
  async function demoAcross(C, H, from, S, kind){
    for(const T of from) for(const b of T.list(kind).slice()){
      await H.tap(K.centre(b, C.sc)); C.guard();
      K.transfer(b, T, S); GameBus.emit("pv_block_moved", { slide_id: C.slide.id, kind });
      await C.wait(380); C.guard();
    }
    await C.wait(400);
  }
  /* the game moves every block across by itself (a hint, or the S02 story): ones first, the ten made if the ones
     reach ten, then the tens */
  async function autoMerge(C, from, S, opt){
    opt = opt || {};
    for(const T of from) for(const b of T.cubes.slice()){ K.transfer(b, T, S, 520); await C.wait(opt.step || 150); }
    await C.wait(560);
    if(S.cubes.length >= 10){
      K.ring(S, true); await C.wait(700);
      const rod = await K.makeTen(S); C.guard();
      await C.wait(250); await putRod(S, rod);
    }
    for(const T of from) for(const b of T.rods.slice()){ K.transfer(b, T, S, 560); await C.wait(opt.step || 170); }
    await C.wait(640);
  }
  /* the new ten goes into the tens column's next place */
  function putRod(S, rod){ const p = S.tensXY(S.rods.length, S.rods.length + 1); S.rods.push(rod); S.laneRod = null; rod.classList.remove("pv-grab", "pulse", "pv-new");
    rod.style.zIndex = 30; S.relayout(620, rod); return glide(rod, p, 620, true).then(()=>{ rod.style.zIndex = ""; K.knock(); }); }

  /* the "दहाई बनाओ" button (gold, the game's button style); .off = not yet (fewer than ten ones) */
  /* x = the button's centre, or its LEFT edge when left (beside a table: it then never reaches back over it) */
  function makeBtn(sc, x, y, left){ const b = add(sc, "button", "pv-make pv-hide" + (left ? " pv-make-l" : "")); b.type = "button"; b.textContent = "दहाई बनाओ"; setXY(b, x, y); return b; }

  /* the child puts the new ten into the tens column: it pulses beside the table; drag it ANYWHERE onto the table's
     दहाई side (no target box - review 2026-10-14) and it settles on its place there (or tap it). cfg: { demo: the ghost drag once at the start, idle: ms before the ghost drag
     plays by itself (0 = never), wrongs: the Drag & Drop ladder - 1st miss "फिर से सोचिए...", then the ghost } */
  function placeRod(C, rod, S, cfg){
    cfg = cfg || {};
    return new Promise(res =>{
      const sc = C.sc, j = S.rods.length, p = S.tensXY(j, j + 1);
      S.rods.forEach((b, k)=> glide(b, S.tensXY(k, j + 1), 420, false));   // the rods there make room: the new place keeps the group centred
      const home = { x: rod._x, y: rod._y }, H = K.hand(sc);
      rod.classList.add("pv-grab", "pulse");
      let misses = 0, idleT = 0, fin = false, ghosting = 0, drag = null;
      /* on the दहाई side: the rod's centre over the tens column (a little slack round it) */
      const near = (x, y)=>{ const cx = x + S.rW / 2, cy = y + S.rH / 2, m = 24;
        return cx > S.x - m && cx < S.x + S.tensW + m && cy > S.y - m && cy < S.y + S.H + m; };
      async function ghost(){
        const t = ++ghosting, g = rod.cloneNode(false); g.className = "pv-blk pv-rod pv-ghostdrag"; setXY(g, home.x, home.y); sc.appendChild(g);
        if(!cfg.noHand) H.on({ x: home.x + S.rW / 2, y: home.y + S.rH * .55 }); await wait(320);   // noHand: the ghost rod glides alone
        if(t === ghosting && !fin){ H.el.classList.add("press");
          await Promise.all([glide(g, p, 1100, true), H.to({ x: p.x + S.rW / 2, y: p.y + S.rH * .55 }, 1100)]); await wait(250); }
        g.remove(); H.off();
      }
      const arm = ()=>{ clearTimeout(idleT); if(!cfg.idle) return;
        idleT = setTimeout(()=>{ if(!C.alive() || fin || drag) return; ghost().then(arm); }, cfg.idle); };
      const finish = ()=>{ if(fin) return; fin = true; clearTimeout(idleT); ghosting++; H.off(); H.el.remove();
        S.rods.push(rod); S.laneRod = null; S.relayout(420, rod); rod.classList.remove("pv-grab", "pulse", "pv-new"); rod.onpointerdown = null;
        rod.style.zIndex = 30; glide(rod, p, 260, false).then(()=>{ rod.style.zIndex = ""; K.knock(); try{ sfxCorrect(); }catch(e){} setTimeout(res, 200); }); };
      const miss = async ()=>{ misses++; shake(rod, 7); try{ sfxWrongSoft(); }catch(e){}
        await glide(rod, home, 380, false);
        if(misses === 1 && C.has("dd_try")) await C.say("dd_try"); else { ghost(); if(C.has("place")) await C.say("place"); }
        arm(); };
      rod.onpointerdown = ev =>{
        if(fin || !C.alive() || drag) return; ev.preventDefault(); stopNudge(); clearTimeout(idleT); ghosting++;
        const k = K.kNow(); drag = { sx: ev.clientX, sy: ev.clientY, x0: rod._x, y0: rod._y, moved: 0 };
        rod.classList.add("lift"); rod.style.zIndex = 31;
        try{ rod.setPointerCapture(ev.pointerId); }catch(e){}
        const mv = e =>{ const dx = (e.clientX - drag.sx) / k, dy = (e.clientY - drag.sy) / k; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
          setXY(rod, drag.x0 + dx, drag.y0 + dy); };
        const up = ()=>{ rod.removeEventListener("pointermove", mv); rod.removeEventListener("pointerup", up); rod.removeEventListener("pointercancel", up);
          rod.classList.remove("lift"); const d = drag; drag = null;
          if(d.moved < 8 || near(rod._x, rod._y)) finish(); else miss().catch(()=>{}); };
        rod.addEventListener("pointermove", mv); rod.addEventListener("pointerup", up); rod.addEventListener("pointercancel", up);
      };
      (async ()=>{ if(cfg.say && C.has(cfg.say)) await C.say(cfg.say); if(cfg.demo && !fin) await ghost(); arm(); })().catch(()=>{});
    });
  }

  /* GUIDED merge (deck pages 6-8 / S02 7-9): the child taps ANY block across; with regrouping the दहाई बनाओ button
     (shown from the start) comes alive once the sum has ten ones; the new ten then goes to the tens column.
     Done when every block is across, the ones are fewer than ten and no ten is waiting. Idle 7s - the visual hint
     that fits: the waiting ten's ghost drag, else the live button, else the blocks pulse (+ the hand). */
  function mergeChild(C, from, S, btn, opt){
    opt = opt || {}; const point = el => K.repulse(el);   // the decks (pages 6-9): "if inactive for 7 seconds, pulsate" - no hand
    return new Promise(res =>{
      const pool = ()=> from.flatMap(T => [...T.rods, ...T.cubes]);
      let flying = 0, pending = null, idleT = 0, fin = false, making = false;
      const ready = ()=> S.cubes.length >= 10 && !pending && !making && !flying;
      const sync = ()=>{ if(!btn) return; btn.classList.toggle("off", !ready()); btn.classList.toggle("pulse", ready()); };
      const done = ()=>{ sync(); if(fin || pool().length || flying || pending || making || S.cubes.length >= 10) return; fin = true; clearTimeout(idleT); res(); };
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || fin) return;
        if(pending){ arm(); return; }                                   // (placeRod runs its own idle ghost)
        if(ready()){ point(btn); arm(); return; }
        pool().forEach(b => point(b)); arm(); }, idleMs()); };
      pool().forEach(b =>{
        b.classList.add("pv-tap");
        b.onclick = ()=>{
          if(!C.alive() || fin || !b.classList.contains("pv-tap")) return;
          if(pending || making){ shake(pending || b, 6); return; }
          stopNudge(); b.onclick = null; flying++;
          pool().forEach(x => x.classList.remove("pulse"));
          const A = from.find(T => T.list(b._kind).includes(b));
          K.transfer(b, A, S).then(()=>{ flying--; GameBus.emit("pv_block_moved", { slide_id: C.slide.id, kind: b._kind }); done(); });
          sync(); arm();
        };
      });
      if(btn) btn.onclick = async ()=>{
        if(!C.alive() || fin) return;
        if(!ready()){ shake(btn, 7); return; }
        stopNudge(); making = true; sync();
        K.ring(S, true); await wait(500);
        const rod = await K.makeTen(S); making = false; pending = rod; sync();
        GameBus.emit("pv_ten_made", { slide_id: C.slide.id });
        await placeRod(C, rod, S, { idle: idleMs(), noHand: true });   // the guided ghost drag: the ghost rod alone (user 2026-10-15)
        pending = null; done(); arm();
      };
      sync(); arm();
    });
  }
  return { sources, childAdd, demoAdd, tapAcross, demoAcross, autoMerge, putRod, makeBtn, placeRod, mergeChild };
})());

/* ---- [pv kit] answering: the three answer cards and the number pad. One behaviour on every answer screen, as in
   MTG2A04 (QA checklist 2026-10-05 / review 2026-10-06): a wrong card shakes with its amber rim and returns; three
   layers of help (the slide's own ladder, cfg.ladder(n)); the right card turns green, the others dim, SFX + confetti
   + Swiftie cheers + the deck's correct VO, and the answer flies into the equation's "?" ---- */
Object.assign(PVK, (function(){
  const K = PVK, { px, add, setXY, glide, wait, pop, shake } = K;

  /* cfg: { options, answer, y, ladder: async n => (help after the n-th wrong tap), reask: role, onRight: async card => } */
  function mcq(C, cfg){
    return new Promise(res =>{
      const slide = C.slide, sc = C.sc;
      const box = add(sc, "div", "mq-opts"); box.style.top = px(cfg.y); box.style.width = "1333px";
      const els = cfg.options.map(v =>{ const o = add(box, "button", "mq-opt"); o.type = "button"; o.textContent = devNumeral(v); o._v = v; return o; });
      const right = els.find(o => o._v === cfg.answer);
      let wrong = 0, busy = true, idleT = 0, layer3 = false, over = false;
      const M = { box, els, right,
        open(){ box.classList.add("in"); },
        hide(on){ box.classList.toggle("pv-hide", on !== false); },
        moveTo(y){ box.style.top = px(y); },
        ready(){ busy = false; arm(); },
        lock(){ layer3 = true; els.forEach(x =>{ if(x !== right){ x.classList.add("faded", "locked"); x.disabled = true; } });
          right.classList.add("hint-on"); K.softGlow(right); } };   // highlighted + the others faded (the decks' WA3) - no hand
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{
        if(!C.alive() || busy || over) return;
        busy = true; C.say(cfg.reask || "ask").then(()=>{ busy = false; arm(); }, ()=>{}); }, IDLE_MS); };
      async function onWrong(o){
        wrong++; busy = true; clearTimeout(idleT);
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: false, attempt: wrong, score: 0 }); }catch(e){}
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: wrong });
        sfxWrongSoft(); setSwMood("tryagain");
        o.classList.add("wrong"); shake(o, 9); setTimeout(()=> o.classList.remove("wrong"), 900);
        await C.wait(450);
        setSwMood("hint");
        await cfg.ladder(wrong, M);
        if(C.alive() && !over){ busy = false; setSwMood("point"); arm(); }
      }
      async function onRight(o){
        over = true; state.locked = true; busy = true; stopNudge(); clearTimeout(idleT);
        o.classList.remove("hint-on"); o.classList.add("correct");
        els.forEach(x =>{ if(x !== o) x.classList.add("pv-gone"); });   // the other two go completely as the right one goes up (review 2026-10-14)
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: true, attempt: wrong + 1, score: wrong === 0 ? 1 : 0 }); }catch(e){}
        recordResult(slide, wrong === 0);
        GameBus.emit("mcq_correct", { slide_id: slide.id, phase: slide.phase, value: wrong === 0, first_try: wrong === 0, attempts: wrong + 1, latency_ms: Date.now() - state.slideStart });
        sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
        if(cfg.onRight) await cfg.onRight(o);
        els.forEach(x => x.classList.add("pv-gone"));   // the answer now stands in the equation: the cards below go
        await C.say("correct");
        await C.wait(500);
        completeSlide(wrong === 0);
        res();
      }
      els.forEach(o => o.addEventListener("click", ()=>{
        if(busy || over || !C.alive() || o.classList.contains("locked")) return;
        stopNudge(); clearTimeout(idleT);
        if(o === right) onRight(o).catch(()=>{}); else onWrong(o).catch(()=>{});
      }));
      C.mcq = M;
      cfg.onReady && cfg.onReady(M);
    });
  }
  /* the flying answer is the size of the "?" box it lands in (the equation's own box size, as shown - the mental
     screens show their equation enlarged), so nothing changes size as it arrives (user 2026-10-15) */
  function flyBox(C, E, text){
    const k = K.kNow(), h = E.q.getBoundingClientRect().height / k || 62, w = E.q.getBoundingClientRect().width / k || h * 1.55;
    const f = add(C.sc, "div", "pv-num pv-fly", "height:" + px(h) + ";font-size:" + px(h * .7) + ";min-width:" + px(w) + ";border-radius:" + px(h * .28));
    f.textContent = text; f._h = h; return f; }
  /* the right card's number flies into the equation's "?" box */
  async function flyToQ(C, from, E){
    const a = K.centre(from, C.sc), b = K.centre(E.q, C.sc), f = flyBox(C, E, from.textContent);
    setXY(f, a.x, a.y - f._h / 2);
    from.style.visibility = "hidden";   // the card itself goes up: no second box left behind (review 2026-10-14)
    await glide(f, { x: b.x, y: b.y - f._h / 2 }, 620, true);
    f.remove(); E.fill(+from.textContent);
  }

  /* the number pad (deck pages 9-10: "an answer counter below with a hand nudge. On tap, open the number pad"):
     the answer box - ONE box with a blinking typing cursor "|" (review 2026-10-14), centred on x - and beside it a 1-9 / 0
     pad with a back key and a tick: the answer is checked when the tick is tapped (review 2026-10-14).
     cfg: { answer, x (the answer box's centre), y, ladder: async n =>, onRight: async => } */
  function numpad(C, cfg){
    return new Promise(res =>{
      const slide = C.slide, sc = C.sc, digits = String(cfg.answer).split(""), N = digits.length;
      /* cfg.target (user 2026-10-15): the child types straight into the equation's "?" - no separate answer box - and the
         pad stands alone at the centre under the tables. Else the old way: an answer box with the pad beside it. */
      const T = cfg.target, slotW = Math.max(120, N * 30 + 60), ansW = slotW + 26;
      const x0 = cfg.x - ansW / 2;                                   // the answer box stands at the centre
      const ans = T || add(sc, "div", "pv-ans"); if(!T) setXY(ans, x0, cfg.y);   // (user 2026-10-15: the box at the bottom centre, the pad under it)
      const slot = T || add(ans, "div", "pv-slot pv-slot-one", "width:" + px(slotW));
      /* the pad: two rows (1-5 + back, 6-0) - it stays on the stage under the tables (review 2026-10-14 "place the
         calculator correctly"; the 4-row pad ran past the stage's bottom) */
      const P3 = cfg.cols === 3;                                    // the 3 x 4 phone pad (user's art, 2026-10-15): 1-9, back 0 tick
      const pad = add(sc, "div", "pv-pad " + (P3 ? "pv-pad-3" : "pv-pad-2") + " pv-hide"); setXY(pad, x0 + ansW + 40, cfg.y + 40 + 51 - 78);
      const keys = {};
      /* review 2026-10-14: a backspace ARROW (the ⌫ glyph read as a cross) and a green tick that sends the answer */
      const ICON = { "⌫": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5.5M11 5.5 4.5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                     "✓": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' };
      if(P3) ICON["⌫"] = '<svg viewBox="0 0 40 26" aria-hidden="true"><path d="M13 2h23a2.5 2.5 0 0 1 2.5 2.5v17A2.5 2.5 0 0 1 36 24H13L2 13z" fill="#fff" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M19 8.5l9 9M28 8.5l-9 9" stroke="#E5282E" stroke-width="3.4" stroke-linecap="round"/></svg>';
      (P3 ? ["1","2","3","4","5","6","7","8","9","⌫","0","✓"] : ["1","2","3","4","5","⌫","6","7","8","9","0","✓"]).forEach(k =>{
        const b = add(pad, "button", "pv-key" + (k === "⌫" ? " pv-back" : k === "✓" ? " pv-ok off" : "")); b.type = "button";
        if(ICON[k]){ b.innerHTML = ICON[k]; b.setAttribute("aria-label", k === "⌫" ? "मिटाएँ" : "जाँचें"); } else b.textContent = k;
        b._k = k; keys[k] = b; });
      const ok = keys["✓"];
      if(T){ T.classList.add("pv-typein"); if(cfg.padAt) setXY(pad, cfg.padAt.x, cfg.padAt.y); else setXY(pad, cfg.x - pad.offsetWidth / 2, cfg.y + 6); }
      else setXY(pad, cfg.x - pad.offsetWidth / 2, cfg.y + ans.offsetHeight + 12);   // centred under the answer box
      let typed = [], wrong = 0, busy = false, open = false, over = false, idleT = 0, guide = null;
      const P = { ans, pad,
        hide(on){ if(!T) ans.classList.toggle("pv-hide", on !== false); pad.classList.toggle("pv-hide", on !== false || !open); },
        guideKeys(){ guide = 0; Object.values(keys).forEach(b => b.classList.add("locked")); lightKey(); } };
      /* the third layer: the right digit keys light one after the other, then the tick */
      const lightKey = ()=>{ Object.values(keys).forEach(b => b.classList.remove("hint-on"));
        if(guide == null || guide > N) return; const b = guide < N ? keys[digits[guide]] : ok; b.classList.remove("locked"); b.classList.add("hint-on");
        K.softGlow(b); };   // the key lights (the decks' WA3 "highlight the correct digit buttons in sequence") - no hand
      /* the tick: dim until a digit is in, pulsing once the box holds the whole answer */
      const okState = ()=>{ ok.classList.toggle("off", !typed.length); ok.classList.toggle("pulse", typed.length >= N && !over && !busy); };
      const render = ()=>{ const full = typed.length >= N || over;
        if(T && !open && !typed.length){ if(ok) okState(); return; }          // (the "?" stays until the pad opens)
        slot.innerHTML = typed.map(d => '<span class="pv-ch">' + d + '</span>').join("") + (full ? "" : '<span class="pv-caret">|</span>');
        slot.classList.toggle("on", open && !full); if(ok) okState(); };
      render();                                                    // the cursor shows from the start
      const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(!C.alive() || busy || over) return;
        if(!open) placeNudge(ans); else if(guide != null) lightKey(); else if(typed.length >= N) K.repulse(ok);   // the answer counter's hand (the decks)
        busy = true; C.say(cfg.reask || "prompt").then(()=>{ busy = false; arm(); }, ()=>{}); }, IDLE_MS); };
      const openPad = ()=>{ if(open || over) return; open = true; stopNudge(); pad.classList.remove("pv-hide"); pop(pad); ans.classList.add("open"); render(); arm(); };
      ans.onclick = ()=>{ if(!C.alive() || busy) return; openPad(); };
      P.open = openPad;
      async function check(){
        busy = true; clearTimeout(idleT); stopNudge(); okState();
        const v = typed.join("");
        if(v === String(cfg.answer)){
          over = true; state.locked = true; ans.classList.add("ok"); Object.values(keys).forEach(b => b.classList.add("locked")); okState();
          try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: true, attempt: wrong + 1, score: wrong === 0 ? 1 : 0, response: v }); }catch(e){}
          recordResult(slide, wrong === 0);
          GameBus.emit("numpad_correct", { slide_id: slide.id, phase: slide.phase, value: wrong === 0, first_try: wrong === 0, attempts: wrong + 1, latency_ms: Date.now() - state.slideStart });
          sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
          pad.classList.add("pv-gone");   // the keypad goes as the answer goes up (review 2026-10-14)
          if(cfg.onRight) await cfg.onRight(ans);
          await C.say("correct"); await C.wait(500);
          completeSlide(wrong === 0); res(); return;
        }
        wrong++;
        try{ XAPI.send("question_answered", { slide_id: slide.id, type: slide.type, phase: slide.phase }, { is_correct: false, attempt: wrong, score: 0, response: v }); }catch(e){}
        GameBus.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: wrong });
        sfxWrongSoft(); setSwMood("tryagain"); ans.classList.add("wrong"); shake(ans, 9);
        await C.wait(800); ans.classList.remove("wrong"); typed = []; render();
        setSwMood("hint");
        await cfg.ladder(wrong, P);
        if(C.alive() && !over){ busy = false; setSwMood("point"); render(); arm(); }
      }
      Object.values(keys).forEach(b => b.addEventListener("click", ()=>{
        if(!C.alive() || busy || over || !open || b.classList.contains("locked")) return;
        stopNudge(); arm();
        if(b._k === "⌫"){ typed.pop(); render(); return; }
        if(b._k === "✓"){ if(!typed.length) return; K.knock(); check().catch(()=>{}); return; }   // the answer goes in on the tick only
        if(typed.length >= N) return;
        typed.push(b._k); K.knock(); render(); pop(slot.querySelectorAll(".pv-ch")[typed.length - 1]);
        if(guide != null){ guide++; lightKey(); }
      }));
      P.ready = ()=>{ arm(); };   // the box pulses its cursor; the hand only after 7s idle (user 2026-10-15: "comes too early")
      cfg.onReady && cfg.onReady(P);
    });
  }
  /* the answer box's digits fly into the "?" */
  async function flyAnsToQ(C, ans, E, n){
    const a = K.centre(ans, C.sc), b = K.centre(E.q, C.sc), f = flyBox(C, E, String(n));
    setXY(f, a.x, a.y - f._h / 2);
    ans.style.visibility = "hidden";    // the answer box goes up itself (review 2026-10-14)
    await glide(f, { x: b.x, y: b.y - f._h / 2 }, 620, true); f.remove(); E.fill(n);
  }
  return { mcq, flyToQ, numpad, flyAnsToQ };
})());

/* The two games' screens, one module per KIND of deck page (pattern: S01 and S02 are the same lesson - S02 adds the
   "दहाई बनाओ" regrouping step wherever the ones reach ten - so every page is one of six kinds, driven by its card data). */
const PV_LAY = {
  /* blk / pad: the blocks' width and the tables' inner margin - as big as each screen's two rows of tables allow
     (review 2026-10-14 "make the cubes look bigger"; a rod is 6.7 blocks tall) */
  tut:  { numY: 206, numH: 46, tableY: 260, sumY: 476, cube: 23, blk: 23, pad: 10, cxL: 451, cxR: 881, cx: 666 },   // inside the tutorial card
  main: { eqY: 148, eqH: 62, tableY: 232, sumY: 466, cube: 23, blk: 20, pad: 8, cxL: 410, cxR: 922, cx: 666 }    // under the header band (smaller tables: user 2026-10-15)
};
const pvSplit = n =>({ t: Math.floor(n / 10), o: n % 10 });
function pvReplay(C){ state.replayAudio = ()=>{ if(!isPlaying && C.cur && C.alive()) C.say(C.cur).catch(()=>{}); }; }
function pvTapOnce(C, btn){
  return new Promise(res =>{ let idleT = 0;
    const arm = ()=>{ clearTimeout(idleT); idleT = setTimeout(()=>{ if(C.alive() && btn.onclick){ PVK.repulse(btn); arm(); } }, IDLE_MS); };   // the decks: the button pulsates
    btn.classList.remove("off"); btn.classList.add("pulse");
    btn.onclick = ()=>{ if(!C.alive()) return; btn.onclick = null; clearTimeout(idleT); stopNudge(); btn.classList.remove("pulse"); res(); };
    arm(); });
}
/* ---------- [pv play] independent practice as a game (user 2026-10-15: "the end pages look really bland - make it a better
   interaction"; QA checklist: practice = a game in an environment): "help them finish the build". The practice pages
   stand in the first screen's own place (its courtyard / veranda art, washed light so the numbers stay clear); the
   lesson's two children are there - one in the bottom left corner, one beside their castle / house in the bottom right -
   and the build (the first screen's picture: a white outline of it) fills in from the bottom with every right answer,
   the last one finishing it (the two cubes the children carried drop on top); a row of stars counts the answers.
   A wrong answer: the children wobble a little ("hmm") - the deck's own help ladder runs as before. The question, its
   answers, its VO and its hints are the deck's, untouched. Which part a page builds = its place among the practice
   pages (P1..P4): the build is always as far along as the answers before it. ---------- */
const PVPlay = {
  KIDS: [100, 1080], BUILD_X: 1226, FLOOR: 714, FIG: 186, SCALE: 1.08, STARS: [1088, 166],   // (the stars under the header band)
  mount(sc, slide){
    const K = PVK, L = this, list = (CARD.slides || []).filter(s => s.phase === "practice" && (s.type === "PV_NUMPAD" || s.type === "MENTAL_MCQ"));
    const N = list.length, k = list.indexOf(slide);
    if(k < 0 || !N || typeof PVLanding === "undefined") return null;
    const h = CARD.landing_hero || {}, kind = PVLanding.ART[h.build] ? h.build : "house";
    const bg = K.add(sc, "div", "pvp-bg"); sc.insertBefore(bg, sc.firstChild);
    /* the stars: one per practice page, the ones before this page already gold */
    const row = K.add(sc, "div", "pvp-stars"); K.setXY(row, L.STARS[0], L.STARS[1]);
    const stars = Array.from({ length: N }, (_, i)=> K.add(row, "i", "pvp-star" + (i < k ? " on" : "")));
    /* the build: the first screen's pieces, its outline under them; the standing body revealed from the bottom up */
    const plan = PVLanding.build(kind, 0, 0), S = L.SCALE;
    const x0 = Math.min(...plan.map(p => p[1] - p[3] / 2)), x1 = Math.max(...plan.map(p => p[1] + p[3] / 2));
    const y0 = Math.min(...plan.map(p => p[2] - p[4])), y1 = Math.max(...plan.map(p => p[2]));
    const W = (x1 - x0) * S, H = (y1 - y0) * S;
    const bd = K.add(sc, "div", "pvp-build", "width:" + W.toFixed(1) + "px;height:" + H.toFixed(1) + "px"); K.setXY(bd, L.BUILD_X - W / 2, L.FLOOR - H);
    K.add(bd, "i", "pvp-shd");
    const ghost = K.add(bd, "div", "pvp-layer pvp-ghost"), body = K.add(bd, "div", "pvp-layer pvp-body"), top = K.add(bd, "div", "pvp-layer pvp-top");
    const img = (p, into)=>{ const e = K.add(into, "img", ""); e.src = "assets/" + p[5] + ".webp"; e.alt = "";
      e.style.cssText = "left:" + ((p[1] - p[3] / 2 - x0) * S).toFixed(1) + "px;top:" + ((p[2] - p[4] - y0) * S).toFixed(1) + "px;width:" +
        (p[3] * S).toFixed(1) + "px;height:" + (p[4] * S).toFixed(1) + "px"; return e; };
    plan.forEach(p => img(p, ghost));
    plan.forEach(p => img(p, (p[6] === 0 || p[6] === 1) ? top : body));
    const reveal = n => body.style.clipPath = "inset(" + ((1 - Math.min(1, n / N)) * 100).toFixed(1) + "% 0 0 0)";
    reveal(k);
    /* the two children: idle, and their cheering pose for a right answer */
    const kid = (w, x)=>{ if(!w) return null;
      const e = K.add(sc, "div", "pvp-kid"); K.setXY(e, x, L.FLOOR);
      [["idle", pvChar(w, true) || pvChar(w)], ["cheer", pvChar(w, "cheer") || pvChar(w, true) || pvChar(w)]].forEach(([c, f])=>{
        const im = K.add(e, "img", c); im.src = f; im.alt = ""; im.style.height = L.FIG + "px"; });
      return e; };
    const kids = [kid((h.people || [])[0], L.KIDS[0]), kid((h.people || [])[1], L.KIDS[1])].filter(Boolean);
    const spark = (x, y, big)=>{ const e = K.add(sc, "i", "pvp-spk" + (big ? " big" : "")); K.setXY(e, x, y);
      e.animate([{ scale: "0", rotate: "0deg", opacity: 1 }, { scale: "1", rotate: "45deg", opacity: 1, offset: .45 }, { scale: "0", rotate: "90deg", opacity: 0 }],
        { duration: big ? 900 : 700, easing: "ease-out" }).onfinish = ()=> e.remove(); };
    const tone = f =>{ try{ f(); }catch(e){} };
    return {
      /* a right answer: its star turns gold, the build rises one part (the last: finished), the children cheer and hop */
      right(){
        const n = k + 1, st = stars[k];
        if(st){ st.classList.add("on"); K.pop(st); spark(L.STARS[0] + k * 48 + 20, L.STARS[1] + 20); }
        reveal(n); tone(()=> K.knock());
        const bx = L.BUILD_X, by = L.FLOOR - H * Math.min(1, n / N);
        setTimeout(()=>{ spark(bx - W * .3, by + 8); spark(bx + W * .3, by + 14); tone(()=> _tone([520, 700], "triangle", .12, .07)); }, 450);
        if(n >= N){
          setTimeout(()=>{ top.classList.add("on");
            top.animate([{ translate: "0 -40px", opacity: 0 }, { translate: "0 3px", opacity: 1, offset: .7 }, { translate: "0 0", opacity: 1 }], { duration: 520, easing: "cubic-bezier(.3,1.3,.5,1)" });
            for(let i = 0; i < 7; i++) setTimeout(()=> spark(bx + (Math.random() - .5) * W * 1.1, L.FLOOR - H * (.4 + Math.random() * .7), i % 2 === 0), i * 90);
            tone(()=> _tone([660, 880, 1180], "sine", .5, .1)); }, 800);
        }
        kids.forEach((e, i)=>{ e.classList.add("cheer");
          e.animate([{ translate: "0 0" }, { translate: "0 -18px", offset: .4, easing: "ease-in" }, { translate: "0 0", offset: .62 }, { translate: "0 0" }],
                    { duration: 560, iterations: 2, delay: i * 110, easing: "ease-out" });
          setTimeout(()=> e.classList.remove("cheer"), 2400); });
      },
      /* a wrong answer: a small "hmm" wobble - no red, no fuss */
      wrong(){ kids.forEach((e, i)=> e.animate([{ rotate: "0deg" }, { rotate: (i ? 4 : -4) + "deg", offset: .3 }, { rotate: (i ? -3 : 3) + "deg", offset: .65 }, { rotate: "0deg" }],
        { duration: 700, easing: "ease-in-out" })); }
    };
  }
};
const PVModules = {
  STORY: {
    /* deck pages 2, 3b, 4a, 5 (S02: 2b, 4, 5a, 6). Two people with their blocks and the equation under them.
       mode "ask": they come in with the VO - the intro line shows both, the next names each one's number (its box pops),
       the last asks "how many together?" (= ?). mode "sum": the same page, answered: on "a जोड़ b बराबर c" every block
       moves into the third column (the ones becoming a new ten when they reach ten), the "?" turns into the sum; then
       the closing line. No portrait over the third column (user, 2026-10-12) - the card's total.who is unused.
       data: { mode, a, b, people:[{who, name}, ..] }. audio: head?, intro?, a, b,
       ask | eq, total. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc);
      state.ownsAudio = true; setNavActive(false); pvReplay(C);
      const COL = [406, 666, 926], AV = 90, AVY = 214, BOT = 488, BH = 176, EY = 502, EH = 56;   // rods 176 tall: bigger blocks; the portraits a little smaller, clear of the title (review 2026-10-14); the Next button sits ~30px under the number row
      const [P0, P1] = d.people, sum = d.a + d.b;
      const pA = K.person(sc, P0.who, P0.name, COL[0], AVY, AV), pB = K.person(sc, P1.who, P1.name, COL[1], AVY, AV);
      const gA = K.group(sc, d.a, COL[0], BOT, BH).make(), gB = K.group(sc, d.b, COL[1], BOT, BH).make();
      const op = (t, x)=>{ const e = K.add(sc, "div", "pv-op pv-sym", "font-size:44px"); e.textContent = t; K.setXY(e, x, EY + 2); return e; };
      const cA = K.numCard(sc, d.a, COL[0], EY, EH), plus = op("+", 536), cB = K.numCard(sc, d.b, COL[1], EY, EH), eqs = op("=", 796),
            cQ = K.numCard(sc, null, COL[2], EY, EH, "pv-q");
      const asking = d.mode !== "sum";
      const hideAll = list => list.forEach(e => e.classList.add("pv-hide"));
      const showGroup = (p, g)=>{ K.show(p); g.all().forEach((b, i)=> setTimeout(()=> K.show(b), 120 + i * 55)); };
      if(asking) hideAll([pA, pB, ...gA.all(), ...gB.all(), cA, plus, cB, eqs, cQ]);
      else if(d.signs) hideAll([plus, eqs, cQ]);   // (the sum page: its + and = come on "जोड़" / "बराबर" - user 2026-10-15)
      /* every block into the third column; ten ones (if there are) gathered into one new rod there */
      async function together(){
        const tA = pvSplit(d.a), tB = pvSplit(d.b), t = tA.t + tB.t, u = tA.o + tB.o, G = K.group(sc, sum, COL[2], BOT, BH), L = G.layout(t, u);
        const rods = [...gA.rods, ...gB.rods], cubes = [...gA.cubes, ...gB.cubes];
        const leave = b =>{ const gh = b.cloneNode(false); gh.className = "pv-blk pv-ghost " + (b._kind === "t" ? "pv-rod" : "pv-cube"); K.setXY(gh, b._x, b._y); sc.insertBefore(gh, b); };
        const flights = [];
        rods.forEach((b, j)=>{ leave(b); flights.push(K.wait(j * 90).then(()=> K.glide(b, L.rod(j), 700, true))); });
        cubes.forEach((b, i)=>{ leave(b); flights.push(K.wait(200 + i * 60).then(()=> K.glide(b, L.cube(i), 700, true))); });
        await Promise.all(flights); K.knock();
        if(u >= 10){
          const L2 = G.layout(t + 1, u - 10), dst = L2.rod(t), ten = cubes.slice(0, 10), unit = G.cs * K.CUBE.pitch;
          await K.wait(250);
          await Promise.all(ten.map((c, j)=> K.glide(c, { x: dst.x, y: dst.y + (9 - j) * unit }, 520, false)));
          const r = K.block(sc, "t", dst.x, dst.y, BH); K.newTen(r); K.pop(r);
          ten.forEach(c =>{ c.classList.add("pv-gone"); setTimeout(()=> c.remove(), 400); });
          rods.forEach((b, j)=> K.glide(b, L2.rod(j), 420, false));
          cubes.slice(10).forEach((b, i)=> K.glide(b, L2.cube(i), 420, false));
          rods.push(r); cubes.splice(0, 10);
          await K.wait(450);
        }
        together.blocks = [...rods, ...cubes];
      }
      K.run(C, async ()=>{
        await C.wait(250);
        if(C.has("head")) await C.say("head");
        if(asking){
          if(C.has("intro")) await C.cue("intro", [[0.05, ()=> showGroup(pA, gA)], [0.4, ()=> showGroup(pB, gB)]]);
          await C.cue("a", [[0, ()=>{ if(pA.classList.contains("pv-hide")) showGroup(pA, gA); }], [0.5, ()=> K.show(cA)]]);
          /* the + and the = come on their words (user 2026-10-15): data.signs = { plus: [clip, at], eq: [clip, at] } - the
             + on "मिलाकर" (or "और दिए"), the = and the "?" on "कुल"; at = the word's start, a fraction of its clip */
          const sg = d.signs || { plus: ["b", 0], eq: ["ask", .25] }, on = (role, list)=>{
            if(sg.plus[0] === role) list.push([sg.plus[1], ()=> K.show(plus)]);
            if(sg.eq[0] === role) list.push([sg.eq[1], ()=> K.show(eqs)], [sg.eq[1] + .05, ()=>{ K.show(cQ); cQ.classList.add("pulse"); }]);
            return list; };
          await C.cue("b", on("b", [[0, ()=>{ if(pB.classList.contains("pv-hide")) showGroup(pB, gB); }], [0.55, ()=> K.show(cB)]]));
          await C.cue("ask", on("ask", []));
        } else {
          let moving = null;
          /* each number's blocks glow as it is said, with its box's pop (user 2026-10-15) */
          const sg = d.signs, cues = [[0, ()=>{ K.pop(cA); K.sweep(gA.all(), 0); }], [0.28, ()=>{ K.pop(cB); K.sweep(gB.all(), 0); }], [0.4, ()=>{ moving = together(); }],
                             [0.88, ()=>{ K.show(cQ); cQ.innerHTML = K.numHTML(sum); cQ.classList.add("filled"); K.pop(cQ); }]];
          if(sg) cues.push([sg.plus[1], ()=> K.show(plus)], [sg.eq[1], ()=>{ K.show(eqs); K.show(cQ); }]);
          await C.cue("eq", cues);
          if(moving) await moving; C.guard();
          await C.cue("total", [[0.1, ()=> K.sweep(together.blocks || [], 70)], [0.65, ()=> K.pop(cQ)]]);
        }
        setNavActive(true);
      });
    }
  },
  PV_DEMO: {
    /* deck page 3 / 4b (S02: 3 / 5b) - "आइए, a और b को जोड़ते हैं।": a place-value table for each number, built
       with the + buttons (by Swifty's hand, or by the child: each + pulses until its count is in, then switches off),
       then the sum table: the ones tapped across first (each leaves a grey copy), then - with regrouping - ten of them
       ringed, "दहाई बनाओ" tapped, the new ten put in the tens column (ghost drag at once, or only when idle), then the
       tens tapped across; the total lit part by part (rods, cubes, the number) and the sum table
       rises to the middle. data: { a, b, build:[who, who] ("swifty"|"child"), ghost_auto, ghost_idle, auto }.
       auto (S01 T2, user 2026-10-14 "T2 should be automatic with hand nudge" / "show all tables"): all three tables
       stand from the start, Swifty's hand builds both numbers and taps every block across - the child watches.
       audio: head, intro, a_digits, a_tens, a_ones | a_build, b_digits, b_build, merge, ones, ones_sum, [know, make,
       place, dd_try], tens, tens_sum, total, done. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), L = PV_LAY.tut;
      state.ownsAudio = true; setNavActive(false); setSwMood("teach"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), sum = d.a + d.b, S = pvSplit(sum), carry = A.o + B.o >= 10;
      const tMax = Math.max(A.t, B.t, 3);
      const cA = K.numCard(sc, d.a, L.cxL, L.numY, L.numH), cB = K.numCard(sc, d.b, L.cxR, L.numY, L.numH);
      const TA = K.table(sc, { cx: L.cxL, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: A.t, onesMax: 9 });
      const TB = K.table(sc, { cx: L.cxR, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: B.t, onesMax: 9 });
      const TS = K.table(sc, { cx: L.cx, y: L.sumY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: Math.max(S.t, 3), tensFinal: S.t, onesMax: A.o + B.o });
      const plus = K.add(sc, "div", "pv-op pv-sym", "font-size:54px"); plus.textContent = "+"; K.setXY(plus, L.cx, L.tableY + TA.H / 2 - 34);
      /* the sum table comes only once both numbers are built (user 2026-10-15), so the + buttons always stand at the
         screen's centre under the tables; auto: the two number tables stand from the start */
      (d.auto ? [TS] : [TA, TB, TS]).forEach(T => T.el.classList.add("pv-hide"));
      plus.classList.add("pv-hide");   // the + comes with the second number (auto: with the sum table - user 2026-10-15)
      const showT = T =>{ if(T.el.classList.contains("pv-hide")) K.showTable(T); };
      async function build(T, card, n, who, key){
        const p = pvSplit(n);
        showT(T);
        await C.cue(key + "_digits", [[0.04, ()=>{ K.lightDigit(card, "t"); T.lightHead("t"); }],
                                      [0.5, ()=>{ K.lightDigit(card, "t", false); T.lightHead("t", false); K.lightDigit(card, "o"); T.lightHead("o"); }]]);
        await C.wait(250); K.lightDigit(card, "o", false); T.lightHead("o", false);
        const src = K.sources(sc, T, T.y + T.H + 12, L.cx);              // at the screen's centre (review 2026-10-14), where the sum table comes later
        src.show();
        if(who === "swifty"){
          src.t.classList.add("demo"); src.o.classList.add("demo");
          const H = K.hand(sc);
          if(p.t) await Promise.all([C.say(key + "_tens"), C.wait(650).then(()=> K.demoAdd(C, H, src.t, T, p.t, "t"))]);
          if(p.o) await Promise.all([C.say(key + "_ones"), C.wait(650).then(()=> K.demoAdd(C, H, src.o, T, p.o, "o"))]);
          H.off(); await C.wait(250); H.el.remove();
        } else {
          src.t.classList.add("off"); src.o.classList.add("off");
          if(C.has(key + "_build")) await C.say(key + "_build");
          await K.childAdd(C, src.t, T, p.t, "t"); C.guard();
          await K.childAdd(C, src.o, T, p.o, "o"); C.guard();
        }
        await C.wait(250); src.remove();
      }
      K.run(C, async ()=>{
        await C.wait(250);
        if(C.has("head")) await C.say("head");
        if(C.has("intro")) await C.say("intro");
        await build(TA, cA, d.a, d.build[0], "a");
        /* (the + comes with the merge line's "जोड़ते" - user 2026-10-15; no longer after the second number) */
        await build(TB, cB, d.b, d.build[1], "b");
        GameBus.emit("pv_build_done", { slide_id: slide.id });
        await C.cue("merge", [[0.44, ()=> showT(TS)], [0.78, ()=> K.show(plus)]]);   // the sum table on "अब दोनों...", the + on "जोड़ते" (3.27s of 4.19s)
        const across = async kind =>{
          if(!d.auto) return K.tapAcross(C, [TA, TB], TS, kind);
          const H = K.hand(sc); await K.demoAcross(C, H, [TA, TB], TS, kind); H.off(); await C.wait(250); H.el.remove(); };
        await C.say("ones");
        await across("o"); C.guard();
        await C.cue("ones_sum", [[0.02, ()=> K.sweep(TS.cubes)]]);
        if(carry){
          await C.cue("know", [[0.3, ()=> K.ring(TS, true)]]);
          const btn = K.makeBtn(sc, TS.x + TS.W + 36, TS.y + TS.head + TS.inH / 2 - 10, true); K.show(btn);
          if(d.auto){ const H = K.hand(sc); await Promise.all([C.say("make"), C.wait(700).then(()=> H.tap(K.centre(btn, sc)))]);
            H.off(); await C.wait(200); H.el.remove(); }
          else await Promise.all([C.say("make"), pvTapOnce(C, btn)]);
          C.guard();
          btn.classList.add("pv-gone");
          const rod = await K.makeTen(TS); C.guard();
          GameBus.emit("pv_ten_made", { slide_id: slide.id });
          if(d.auto){                                                     // Swifty's hand carries the new ten across
            const H = K.hand(sc), p = TS.tensXY(TS.rods.length, TS.rods.length + 1);
            await C.say("place"); H.on({ x: rod._x + TS.rW / 2, y: rod._y + TS.rH * .55 }); await C.wait(320); H.el.classList.add("press");
            await Promise.all([K.putRod(TS, rod), H.to({ x: p.x + TS.rW / 2, y: p.y + TS.rH * .55 }, 620)]);
            H.off(); await C.wait(200); H.el.remove(); try{ sfxCorrect(); }catch(e){}
          } else await K.placeRod(C, rod, TS, { say: "place", demo: !!d.ghost_auto, idle: d.ghost_idle || IDLE_MS });
          C.guard();
        }
        await C.say("tens");
        await across("t"); C.guard();
        await C.cue("tens_sum", [[0.02, ()=> K.sweep(TS.rods, 160)]]);
        GameBus.emit("pv_merge_done", { slide_id: slide.id });
        const eqS = K.add(sc, "div", "pv-op pv-sym pv-hide", "font-size:50px"); eqS.textContent = "=";
        const midY = TS.y + TS.head + TS.inH / 2 + TS.pad;
        K.setXY(eqS, TS.x + TS.W + 34, midY - 32);
        // the total's box is the SAME size as the two numbers' boxes (user 2026-10-15: "why is the 35 box bigger")
        const tot = K.numCard(sc, sum, TS.x + TS.W + 110, midY - L.numH / 2, L.numH); tot.classList.add("pv-hide", "pv-total", "pv-sumcard");
        TS.extra.push(eqS, tot);
        await C.cue("total", [[0.02, ()=> K.sweep(TS.rods, 90)], [0.3, ()=> K.sweep(TS.cubes, 70)],   // (no column digits under the table)
                              [0.78, ()=>{ K.show(eqS); K.show(tot); }]]);
        /* the whole sum stays on screen - "23 + 12 ... 35" is what the VO says - in ONE row: [23] + [12] = [35], each table
           under its number, so the bottom centre is free for the next button (user 2026-10-15; before: the two number
           tables faded and the sum table rose into their place) */
        { const AV = 1060, sumW = TA.W + TB.W + TS.W, GAP = Math.max(40, Math.min(62, (AV - sumW) / 2)), tw = sumW + 2 * GAP;   // (the card is ~1130 wide)
          const x0 = L.cx - tw / 2, ms = 700, s = Math.min(1, AV / tw);
          /* the row stands in the middle of the free space, between the title (~200) and the next button (~565) - user
             2026-10-15 "the tables at the centre of the screen"; DY: how far down from the build's own height */
          const rowH = (L.tableY + Math.max(TA.H, TB.H, TS.H)) - (L.numY - 10), DY = Math.round(382 - (L.numY - 10) - rowH * s / 2);
          /* a row wider than the card (a big sum: 86 = 8 rods) is scaled down round its top centre to fit, as it moves */
          if(tw > AV){ const wrap = K.add(sc, "div", "pv-row", "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;transform-origin:" + L.cx + "px " + (L.numY - 10 + DY) + "px");
            [...TA.all(), ...TA.ghosts, ...TB.all(), ...TB.ghosts, ...TS.all(), cA, cB, plus, eqS, tot].forEach(e =>{ if(e && e.parentNode === sc) wrap.appendChild(e); });
            wrap.animate([{ scale: "1" }, { scale: s.toFixed(3) }], { duration: ms, easing: "ease-in-out", fill: "forwards" }); }
          const dA = x0 - TA.x, dB = x0 + TA.W + GAP - TB.x, dSx = x0 + TA.W + TB.W + 2 * GAP - TS.x, dSy = L.tableY + DY - TS.y;
          const opY = L.tableY + DY + TA.H / 2 - 34, mv = (e, x, y)=> K.shift(e, x - e._x, y - e._y, ms);
          const sx = TS.x + dSx + TS.W / 2; TS.extra = TS.extra.filter(e => e !== eqS && e !== tot);   // (= and the total move on their own)
          await Promise.all([TA.move(dA, DY, ms), ...TA.ghosts.map(e => K.shift(e, dA, DY, ms)), K.shift(cA, dA, DY, ms),
            TB.move(dB, DY, ms), ...TB.ghosts.map(e => K.shift(e, dB, DY, ms)), K.shift(cB, dB, DY, ms),
            TS.move(dSx, dSy, ms).then(()=>{}), mv(plus, x0 + TA.W + GAP / 2, opY), mv(eqS, x0 + TA.W + TB.W + GAP * 1.5, opY),
            mv(tot, sx, L.numY + DY)]); C.guard(); }
        sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
        await C.say("done");
        setNavActive(true);
      });
    }
  },
  PV_MAKE_TEN: {
    /* S02 page 2 - "10 इकाइयाँ = 1 दहाई": one table, 13 cubes in its ones column. Counted aloud one by one (each
       lights as it is named); at ten they are ringed and "दहाई बनाओ" appears; the child taps it: the ten cubes come
       together into one rod; it moves to the tens column; the three left are counted; "1 दहाई और 3 इकाइयाँ यानी 13".
       data: { n }. audio: count_intro, know, make, made, move, rest_intro, total (+ vo_num_k). */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), N = d.n || 13, P = pvSplit(N);
      state.ownsAudio = true; setNavActive(false); setSwMood("teach"); pvReplay(C);
      const T = K.table(sc, { cx: 640, y: 236, cube: 38, blk: 38, tensMax: 3, tensFinal: P.t, onesMax: N });
      const btn = K.makeBtn(sc, 640, T.y + T.H + 18);
      K.run(C, async ()=>{
        for(let i = 0; i < N; i++){ T.addBlock("o"); await C.wait(70); }    // N loose cubes (not "1 ten + 3": the ten is what the child makes)
        await C.wait(300);
        await C.say("count_intro");
        for(let i = 1; i <= 10; i++){ const c = T.cubes[i - 1]; c.classList.add("pv-on"); K.pop(c); await C.sayNum(i); }
        K.ring(T, true); K.show(btn);
        await C.say("know");
        await Promise.all([C.say("make"), pvTapOnce(C, btn)]); C.guard();
        btn.classList.add("pv-gone"); T.cubes.forEach(c => c.classList.remove("pv-on"));
        const rod = await K.makeTen(T); C.guard();
        GameBus.emit("pv_ten_made", { slide_id: slide.id });
        await C.cue("made", [[0.1, ()=> K.sweep([rod])]]);
        await C.cue("move", [[0.35, ()=> K.putRod(T, rod)]]);
        await C.wait(400);
        await C.say("rest_intro");
        for(let i = 1; i <= T.cubes.length; i++){ const c = T.cubes[i - 1]; c.classList.add("pv-on"); K.pop(c); await C.sayNum(i); }
        T.cubes.forEach(c => c.classList.remove("pv-on"));
        const tot = K.numCard(sc, N, T.x + T.W + 120, T.y + T.head + 40, 70); tot.classList.add("pv-hide", "pv-total");
        await C.cue("total", [[0.02, ()=> K.sweep(T.rods)], [0.35, ()=> K.sweep(T.cubes, 120)], [0.8, ()=> K.show(tot)]]);
        sfxCorrect(); try{ confettiCannon(); }catch(e){} setSwMood("happy");
        await C.wait(600);
        setNavActive(true);
      });
    }
  },

  PV_MERGE_MCQ: {
    /* deck pages 6-8 (S02: 7-9) - "संख्याएँ जोड़िए।", "a + b = ?": both numbers built in their tables block by block,
       an empty sum table below (S02: "दहाई बनाओ" shown from the start, alive once the ones reach ten). The child taps
       every block across (any order); then the sum table moves to the centre in place of the two, and three answers.
       WRONG: 1 wiggle + try_again; 2 wiggle + the hint ("कुल 6 दहाइयाँ और 7 इकाइयाँ", the rods / cubes lit as it says
       them); 3 wiggle + the others fade and lock, the right one glows, the hand on it (vo_hint_tap) - the child taps it.
       RIGHT: it flies into the "?". data: { a, b, options:[..] }. audio: prompt, great, ask, correct, try_again,
       hint_a, hint_b, nudge (+ dd_try for a missed new-ten drop). */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), L = PV_LAY.main;
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), sum = d.a + d.b, S = pvSplit(sum), carry = A.o + B.o >= 10, tMax = Math.max(A.t, B.t, 3);
      const E = K.equation(sc, d.a, d.b, L.cx, L.eqY, L.eqH);
      const TA = K.table(sc, { cx: L.cxL, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: A.t, onesMax: 9 });
      const TB = K.table(sc, { cx: L.cxR, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: B.t, onesMax: 9 });
      const TS = K.table(sc, { cx: L.cx, y: L.sumY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: Math.max(S.t, 3), tensFinal: S.t, onesMax: A.o + B.o });
      TS.el.classList.add("pv-hide");
      const plus = K.add(sc, "div", "pv-op pv-sym", "font-size:56px"); plus.textContent = "+"; K.setXY(plus, L.cx, L.tableY + TA.H / 2 - 36);
      const btn = carry ? K.makeBtn(sc, TS.x + TS.W + 44, TS.y + TS.head + TS.inH / 2 - 10, true) : null;
      K.run(C, async ()=>{
        await Promise.all([TA.fill(d.a), TB.fill(d.b)]); await C.wait(250);
        await C.cue("prompt", [[0.3, ()=>{ K.showTable(TS); if(btn){ K.show(btn); btn.classList.add("off"); } }]]);
        await K.mergeChild(C, [TA, TB], TS, btn); C.guard();
        GameBus.emit("pv_merge_done", { slide_id: slide.id });
        if(btn) btn.classList.add("pv-gone");
        await C.say("great");
        [TA, TB].forEach(T => T.fade()); plus.classList.add("pv-gone");
        await TS.move(0, L.tableY - TS.y, 700); C.guard();
        await K.mcq(C, { options: d.options, answer: sum, y: L.tableY + TS.H + 40, reask: "ask",
          onReady: M =>{ M.open(); C.say("ask").then(()=> M.ready(), ()=>{}); },
          onRight: o => K.flyToQ(C, o, E),
          ladder: async (n, M)=>{
            if(n === 1) await C.say("try_again");
            else if(n === 2){ await C.cue("hint_a", [[0.35, ()=> K.sweep(TS.rods, 120)]]); await C.cue("hint_b", [[0.1, ()=> K.sweep(TS.cubes, 90)]]); }
            else M.lock();   // the decks' WA3: highlight the right one, fade the others (no hand, no line)
          } });
      });
    }
  },
  PV_NUMPAD: {
    /* deck pages 9-10 (S02: 10-11) - "a और b को जोड़िए और सही जोड़ टाइप करिए।": both tables built, the answer box with
       the hand on it; a tap opens the number pad. WRONG: 1 wiggle + try_again; 2 wiggle + the blocks move to a third
       table by themselves (the number pad hidden meanwhile; with regrouping the ten is made too), the two tables go and
       the sum table takes the centre + the hint (its rods / cubes lit); 3 wiggle + the right digit keys light one
       after the other, the hand on each. RIGHT: the answer flies into the "?". data: { a, b }.
       audio: prompt, correct, try_again, hint_a, hint_b, keys. */
    mount(host, slide){
      /* the number pad's page sits a little higher than the other main pages - the equation and the tables up - so the
         answer box and a bigger pad under it fit (user 2026-10-15) */
      /* user 2026-10-15: the tables to the left and closer together (the equation centred over them), the 3 x 4 pad on
         the right, and the child types straight into the "?" */
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc),
            L = Object.assign({}, PV_LAY.main, { eqY: 150, eqH: 104, tableY: 296, cxL: 236, cxR: 630, cx: 433, qx: 1100, cube: 30, blk: 27, pad: 12 });
      /* the user's layout (2026-10-15 mock-up): each number's card stands over its own table, the + between them; the = and
         the answer box on the right, the 3 x 4 pad straight under the box - the child types into that box */
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), sum = d.a + d.b, S = pvSplit(sum), tMax = Math.max(A.t, B.t, 3);
      const sym = (t, x)=>{ const e = K.add(sc, "div", "pv-op pv-sym", "font-size:76px"); e.textContent = t; K.setXY(e, x, L.eqY + L.eqH / 2 - 36); return e; };   // (level with the cards' middle)
      const E = { a: K.numCard(sc, d.a, L.cxL, L.eqY, L.eqH), plus: sym("+", L.cx), b: K.numCard(sc, d.b, L.cxR, L.eqY, L.eqH),
                  eq: sym("=", 885), q: K.numCard(sc, null, L.qx, L.eqY, L.eqH, "pv-q") };
      E.fill = n =>{ E.q.innerHTML = K.numHTML(n); E.q.classList.add("filled"); K.pop(E.q); };
      const TA = K.table(sc, { cx: L.cxL, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: A.t, onesMax: 9 });
      const TB = K.table(sc, { cx: L.cxR, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: B.t, onesMax: 9 });
      const PADY = 286, PADH = 370;                                           // the pad: its top, its height (3 x 4 keys)
      { const GAP = 44, tw = TA.W + GAP + TB.W, x0 = Math.max(40, 470 - tw / 2);            // the two side by side, an even gap, centred left of the pad
        /* ...and level with the pad's middle (user 2026-10-15) */
        const dy = Math.round(PADY + PADH / 2 - TA.H / 2 - L.tableY); L.tableY += dy;
        [[TA, x0], [TB, x0 + TA.W + GAP]].forEach(([T, x])=>{ const dx = x - T.x; T.x += dx; T.y += dy; T.all().forEach(e => K.setXY(e, e._x + dx, e._y + dy)); });
        L.cxL = TA.x + TA.W / 2; L.cxR = TB.x + TB.W / 2; L.cx = x0 + TA.W + GAP / 2;
        /* user 2026-10-15 (final): the first number's card over the first table, the second's over the second, the +
           between them, the answer box over the pad (centred on it) and the = midway between the second card and the box */
        const w = e => e.offsetWidth, qc = L.qx;
        K.setXY(E.a, L.cxL, E.a._y); K.setXY(E.b, L.cxR, E.b._y); K.setXY(E.plus, (L.cxL + L.cxR) / 2, E.plus._y);   // (the + midway between the two cards) K.setXY(E.q, qc, E.q._y);
        K.setXY(E.eq, (L.cxR + w(E.b) / 2 + qc - w(E.q) / 2) / 2, E.eq._y); }
      /* the help's sum table comes where the pad stands (the pad steps aside for it), then takes the tables' place */
      const TS = K.table(sc, { cx: L.qx, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: Math.max(S.t, 3), tensFinal: S.t, onesMax: A.o + B.o });
      TS.el.classList.add("pv-hide");
      const plus = { classList: { add(){} } };                                // (the + is the cards' own, between them)
      let merged = false;
      K.run(C, async ()=>{
        await Promise.all([TA.fill(d.a), TB.fill(d.b)]); await C.wait(250);
        /* the old format (user 2026-10-15 "bring the old format: the box in the bottom centre and the calculator below
           that"): the answer box under the tables; a tap on it opens the pad under it (the deck: "an answer counter below
           with a hand nudge. On tap, open the number pad"); the right answer flies up into the "?" */
        await K.numpad(C, { answer: sum, x: L.cx, y: L.tableY + TA.H + 18, reask: "prompt", target: E.q, cols: 3, padAt: { x: L.qx - 166, y: PADY },
          onReady: P =>{ P.hide(true); C.cue("prompt", [[0.6, ()=>{ P.hide(false); P.open(); E.q.classList.remove("pulse"); }]]).then(()=> P.ready(), ()=>{}); },
          onRight: ()=>{ E.fill(sum); },
          ladder: async (n, P)=>{
            if(n === 1){ await C.say("try_again"); return; }
            if(n === 2){
              if(!merged){ merged = true; P.hide(true);
                /* the help needs room for a third table: the pad and the equation step away, the two tables rise into the
                   equation's place, the sum table forms under them; then the two fade, the sum table takes their place
                   and the equation and the pad come back */
                const eqs = [E.a, E.plus, E.b, E.eq, E.q]; eqs.forEach(e => e.classList.add("pv-hide"));
                const up = L.eqY - TA.y; await Promise.all([TA.move(0, up, 500), TB.move(0, up, 500)]);
                const tx = Math.max(30, Math.min(1303 - TS.W, L.cx - TS.W / 2)), ty = L.eqY + TA.H + 16;
                const dx = tx - TS.x, dy = ty - TS.y; TS.x += dx; TS.y += dy; TS.all().forEach(e => K.setXY(e, e._x + dx, e._y + dy));
                K.showTable(TS); await C.wait(500);
                await K.autoMerge(C, [TA, TB], TS);
                [TA, TB].forEach(T => T.fade()); plus.classList.add("pv-gone");
                await TS.move(Math.max(30, Math.min(910 - TS.W, 470 - TS.W / 2)) - TS.x, L.tableY - TS.y, 700);
                eqs.forEach(e => e.classList.remove("pv-hide")); P.hide(false); }
              await C.cue("hint_a", [[0.35, ()=> K.sweep(TS.rods, 120)]]); await C.cue("hint_b", [[0.1, ()=> K.sweep(TS.cubes, 90)]]);
              return;
            }
            P.guideKeys();   // the decks' WA3: the right digit keys light in sequence (no hand, no line)
          } });
      });
    }
  },
  MENTAL_MCQ: {
    /* deck pages 11-12 (S02: 12-13) - "सही जोड़ चुनिए।": only "a + b = ?" and three answers - the child adds in their head.
       The help is the page's own ladder (data.hints, one step per wrong tap):
         "digits"  - the tens digits light, then the ones digits, with their VO (h_lead, h_tens, h_ones, h_end)
         "tables"  - the equation moves up, the two tables come in, built block by block (h_tables)
         "merge"   - the answers hide; the blocks move into a third table (the ten made if needed); the sum table takes
                     the centre; the answers come back (h_merge)
         "merge_reveal" - "merge", then the right answer glows and the others lock (nudge)
         "reveal"  - the right answer glows, the others lock, the hand on it (nudge)
       data: { a, b, options, hints:[..] }. audio: prompt, correct + the hint lines above. */
    mount(host, slide){
      const d = slide.data, K = PVK, sc = K.scene(host), C = K.ctx(slide, sc), L = PV_LAY.main;
      state.ownsAudio = true; state.locked = false; setNavActive(false); $("navBtn").style.display = "none"; setSwMood("point"); pvReplay(C);
      const A = pvSplit(d.a), B = pvSplit(d.b), sum = d.a + d.b, S = pvSplit(sum), tMax = Math.max(A.t, B.t, 3);
      const PP = PVPlay.mount(sc, slide);                                     // [pv play] the practice game around the question
      const E = K.equation(sc, d.a, d.b, L.cx, 282, L.eqH); E.el.classList.add("big");
      let TA = null, TB = null, TS = null, plus = null, merged = false;
      const optTop = { solo: 452, tables: 600 };
      async function tables(M){
        if(TA) return;
        E.el.classList.remove("big"); M.moveTo(optTop.tables);
        await K.glide(E.el, { x: L.cx, y: L.eqY }, 500, false);
        TA = K.table(sc, { cx: L.cxL, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: A.t, onesMax: 9 });
        TB = K.table(sc, { cx: L.cxR, y: L.tableY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: tMax, tensFinal: B.t, onesMax: 9 });
        plus = K.add(sc, "div", "pv-op pv-sym", "font-size:56px"); plus.textContent = "+"; K.setXY(plus, L.cx, L.tableY + TA.H / 2 - 36);
        K.showTable(TA); K.showTable(TB); K.pop(plus);
        await C.wait(250); await Promise.all([TA.fill(d.a, 150), TB.fill(d.b, 150)]); C.guard();
      }
      async function merge(M){
        if(merged) return; merged = true;
        M.hide(true); await tables(M);
        TS = K.table(sc, { cx: L.cx, y: L.sumY, cube: L.cube, blk: L.blk, pad: L.pad, tensMax: Math.max(S.t, 3), tensFinal: S.t, onesMax: A.o + B.o });
        K.showTable(TS); await C.wait(500);
        await K.autoMerge(C, [TA, TB], TS);
        [TA, TB].forEach(T => T.fade()); plus.classList.add("pv-gone");
        await TS.move(0, L.tableY - TS.y, 700); C.guard();
        M.moveTo(L.tableY + TS.H + 40); M.hide(false);
      }
      K.run(C, async ()=>{
        await C.wait(300);
        await K.mcq(C, { options: d.options, answer: sum, y: optTop.solo, reask: "prompt",
          onReady: M =>{ M.open(); C.say("prompt").then(()=> M.ready(), ()=>{}); },
          onRight: async o =>{ await K.flyToQ(C, o, E); if(PP) PP.right(); },
          ladder: async (n, M)=>{
            if(PP) PP.wrong();
            const step = d.hints[Math.min(n, d.hints.length) - 1];
            if(step === "digits"){
              await C.say("h_lead");
              await C.cue("h_tens", [[0, ()=>{ K.lightDigit(E.a, "t"); K.lightDigit(E.b, "t"); }]]);
              K.lightDigit(E.a, "t", false); K.lightDigit(E.b, "t", false);
              await C.cue("h_ones", [[0, ()=>{ K.lightDigit(E.a, "o"); K.lightDigit(E.b, "o"); }]]);
              K.lightDigit(E.a, "o", false); K.lightDigit(E.b, "o", false);
              if(C.has("h_end")) await C.say("h_end");
            } else if(step === "tables"){ await tables(M); await C.say("h_tables"); }
            else if(step === "merge"){ await merge(M); await C.say("h_merge"); }
            else if(step === "merge_reveal"){ await merge(M); M.lock(); }   // the decks' WA3: the right one highlighted
            else M.lock();
          } });
      });
    }
  },
  CELEBRATION: {
    /* the end screen exactly as MTG2A04 (its CELEBRATION, ported from hindi-game-gender-identify): no text - the jingle,
       then on its end (or 1.8s) Swiftie jumps and says the line (the VO only - review 2026-10-08: "remove these titles
       from the end screens ... only Voiceover will come here"); आगे बढ़ें when it ends. */
    mount(host, slide){
      state.ownsAudio = true;
      const et = $("endTitle"); if(et) et.textContent = "";
      const st = $("endSubtitle"); if(st) st.textContent = "";
      const es = $("endScreen"); es.classList.add("show");
      document.body.classList.add("is-end");
      const em = es.querySelector(".end-mascot");
      const setSw = u =>{ try{ if(!em) return; em.removeAttribute("data-src"); em.removeAttribute("src"); void em.offsetWidth; em.setAttribute("src", u); }catch(e){} };
      setSw(Assets.url("assets/last_swifty_still.webp"));
      let spoke = false;
      const speak = ()=>{
        if(spoke || !$("endScreen").classList.contains("show")) return; spoke = true;
        setSw(Assets.fresh("assets/last_swifty_end.webp"));
        play(audioFor(slide, "prompt") || null, ()=>{ if(state.endBtnPending){ $("endBtn").classList.add("show"); state.endBtnPending = false; } });
      };
      setTimeout(speak, 1800);
      playSfx(slide.audio && slide.audio.sfx ? slide.audio.sfx : "sfx_celebrate", speak);
      const c = $("confetti"); c.innerHTML = "";
      starBurst();
      const masteryScore = state.masteryAttempts ? (state.masteryHits / state.masteryAttempts) : 0;
      GameBus.emit("mastery_score", { value: masteryScore, hits: state.masteryHits, attempts: state.masteryAttempts });
      GameBus.emit("lesson_completed", { skill_code: CARD.skill_code, total_signals: GameBus.signals.length });
      runValidator();
      setNavActive(false);
      const eb = $("endBtn"); eb.classList.remove("show");
      state.endBtnPending = true;
      if(new URLSearchParams(location.search).has("dev") && !$("dlResults")){
        const dl = document.createElement("button"); dl.id = "dlResults"; dl.textContent = "⬇ results JSON";
        dl.style.cssText = "position:absolute;bottom:20px;left:20px;z-index:5;font-family:var(--font-hi);font-weight:700;font-size:16px;padding:8px 16px;border-radius:12px;border:2px solid #B7DCFB;background:#fff;color:var(--navy);cursor:pointer;";
        dl.onclick = ()=> GameBus.downloadResults();
        es.appendChild(dl);
      }
      eb.onclick = ()=>{
        if(eb.dataset.done === "1") return;
        eb.dataset.done = "1"; eb.disabled = true;
        const firstTryScore = state.masteryAttempts ? (state.masteryHits / state.masteryAttempts) : 0;
        XAPI.once("activity_completed",
          { skill_code: CARD.skill_code, part: CARD.part_label },
          { completed: true, completion: true, progress: 100, score: firstTryScore,
            first_try_correct: state.masteryHits, questions: state.masteryAttempts,
            duration_ms: Date.now() - GameBus.startedAt });
        GameBus.emit("proceed_next", { skill_code: CARD.skill_code, part: CARD.part_label });
        try{ window.parent?.postMessage({type:"swiftpal:proceed", skill_code:CARD.skill_code, part:CARD.part_label}, "*"); }catch(e){}
      };
    }
  }
};
const SlideModules = PVModules;


/* ---------- [landing pv] the first screen's picture (both decks, page 1: "Visual: <the two children> playing with
   blocks"): the two children finish a build together. No equation (user, 2026-10-13).
   User, 2026-10-14 ("like Chhota Bheem's title"): in the middle stands a half-built castle (S01) / house (S02), its
   missing blocks shown as pale outlines; the children zip in from both sides with a swoosh, a block in each hand
   (motion blur, speed lines, a skid and a puff of dust as they stop), put their blocks into the gaps in turns - each
   leans, each block hops from the hand into its place - both children put their one cube in together (the castle's tower tops / the house's roof ends), a
   burst of sparkles, and they cheer (their cheering pose, a jump). Then the play button arrives ("sg-intro-done").
   While the screen waits they keep playing: they breathe, one at a time leans in to admire the build, a sparkle
   twinkles on it; the flag waves, the chimney smokes.
   Poses (make_characters.py, one scale - shown height = 224px x file height / 640): carry (char_<who>_carry, else the
   cheering pose) -> idle (char_<who>_full) -> cheer (char_<who>_cheer, else idle) -> idle. HANDS: where the carry
   pose's two hands are (fractions of its picture), each holding one block.
   card: landing_hero { kind:"pv_story", people:[left, right], build:"castle"|"house" }. */
const PVLanding = {
  /* the stage: .sgp's own px (772 x 96; the children's soles on FEET, the build stands on BASE, further back) */
  FEET: 202, BASE: 130, MID: 386, KID_X: [208, 564], FIG_H: 224, FILE_H: 640,
  HANDS: { kabir: [[.099, .19], [.896, .185]], tara: [[.118, .18], [.905, .13]], aaru: [[.125, .127], [.917, .49]], pari: [[.07, .40], [.84, .54]] },
  /* the user's drawings (make_house.py / make_castle.py, 2026-10-15), cut into pieces, each where it is in the drawing:
     boxes in the drawing's px; the build's middle at x WX, its foot at FOOT (on BASE + DY); S stage px per drawing px. order: the
     pieces bottom up, [name, who brings it, the order]. */
  ART: {
    /* a house of cubes only (user 2026-10-15, 18:39 - make_house.py): yellow walls with two blue windows and a doorway
       under a stepped red roof; all of it stands but the roof's two eave cubes - each child brings ONE (Aaru the left,
       Pari the right) and they put them in together */
    house: { S: .125, WX: 628, FOOT: 1145,                                       // (user 2026-10-15 18:39: the house of image 2 - yellow walls, blue windows, a doorway, a stepped red roof; FOOT = its lowest cubes, not the picture's edge - house_blocks.webp has 109px of empty canvas under them, which floated the house over its shadow: user 2026-10-16)
      order: [["block_l", 0, 1], ["block_r", 1, 1], ["blocks"]],   // (each child brings one roof eave cube; they go in BEHIND the rest)
      blocks: [33, 33, 1224, 1254], block_l: [83, 458, 268, 677], block_r: [986, 463, 1170, 677] },
    /* a castle of cubes only (user, 2026-10-15): all of it stands but the red cube on top of each tower - each child
       brings ONE (Kabir the left, Tara the right) and they put them on together */
    castle: { S: .1106, WX: 768, FOOT: 992, DY: -30,     // (DY -30: a little further back, clear of the play button - user 2026-10-16) (the size of S02's house - user 2026-10-16 "replicate the size of the house exactly": as wide as it (1346 x .1106 = 149 stage px), standing on the same BASE, the children stopping where they stop there)
      order: [["cubes"], ["cube_l", 0, 1], ["cube_r", 1, 1]],
      cubes: [95, 190, 1441, 992], cube_l: [220, 41, 439, 220], cube_r: [1096, 41, 1315, 220] }
  },
  /* the build, bottom up: [type, x of centre, y of bottom, w, h, picture, who brings it (0 left child, 1 right; none:
     already standing; "pop": goes up at the end), the order it is put in] */
  build(kind, M, B){ const A = this.ART[kind]; B += A.DY || 0;
    return A.order.map(([k, by, seq])=>{ const [x0, y0, x1, y1] = A[k];
      return ["img", M + ((x0 + x1) / 2 - A.WX) * A.S, B + (y1 - A.FOOT) * A.S, (x1 - x0) * A.S, (y1 - y0) * A.S, kind + "_" + k, by, seq || 0]; }); },
  /* the build's pictures, for the boot loader (the landing waits for them) */
  files(h){ const A = h && this.ART[h.build]; return A ? A.order.map(([k])=> h.build + "_" + k + ".webp") : []; },
  piece(type, c){ return '<img alt="" src="assets/' + c + '.webp" class="sgp-im">'; },
  html(h){
    const L = this, kind = L.ART[h.build] ? h.build : "house", plan = L.build(kind, L.MID, L.BASE);
    L.KID_X = L.ART[kind].KIDX || [208, 564];                                  // where the children stop (by the build's width)
    const box = (cls, p, i, extra)=> '<div class="' + cls + '" data-i="' + i + '" style="left:' + (p[1] - p[3] / 2) + 'px;top:' + (p[2] - p[4]) + 'px;width:' +
      p[3] + 'px;height:' + p[4] + 'px;z-index:' + (20 + i) + ';' + (extra || "") + '">';
    const brought = p => p[6] === 0 || p[6] === 1;
    const pieces = plan.map((p, i)=> box("sgp-pc sgp-" + p[0] + (p[6] === undefined ? " sgp-stand" : ""), p, i, "--d:" + (i * .03).toFixed(2) + "s") +
      L.piece(p[0], p[5]) + '</div>' + (brought(p) ? box("sgp-ghost", p, i) + L.piece(p[0], p[5]) + '</div>' : "")).join("");
    const kid = (w, s)=>{
      const idle = pvChar(w, true) || pvChar(w), cheer = pvChar(w, "cheer") || idle, carry = pvChar(w, "carry") || cheer;
      const poses = {}; [["idle", idle], ["carry", carry], ["cheer", cheer]].forEach(([n, f])=>{ (poses[f] = poses[f] || []).push(n); });
      const imgs = Object.keys(poses).map(f => '<img class="sgp-pose' + (pvChar(w, true) ? "" : " sgp-round") + '" alt="" data-for="' + poses[f].join(" ") + '" src="' + f + '">').join("");
      const held = plan.map((p, i)=> p[6] === s ? '<div class="sgp-held" data-i="' + i + '" style="width:' + p[3] + 'px;height:' + p[4] + 'px">' + L.piece(p[0], p[5]) + '</div>' : "").join("");
      return '<div class="sgp-kid sgp-' + (s ? "r" : "l") + '" data-who="' + w + '" style="left:' + L.KID_X[s] + 'px;top:' + L.FEET + 'px"><div class="sgp-move">' +
        '<div class="sgp-cast">' + imgs + '</div><i class="sgp-shd"></i><i class="sgp-lines"><b></b><b></b><b></b></i><div class="sgp-fw"><div class="sgp-tilt">' + imgs + held + '</div></div></div></div>'; };
    /* shadows by the scene's light (user 2026-10-15 "as per physics"): the sun is outside, beyond the veranda at the back and a
       little to the right (the bright patches on the floor run from back right to front left), so every shadow starts dark
       where the thing meets the floor and falls TOWARD the viewer and to the LEFT, long and soft - the thing's own
       silhouette laid flat (.sgp-cast / .sgp-bcast: flipped about the floor line, foreshortened, sheared left) */
    const casts = plan.map((p, i)=> box("sgp-pcs" + (p[6] === undefined ? " sgp-stand" : ""), p, i) + L.piece(p[0], p[5]) + '</div>').join("");
    const xs = plan.map(p => [p[1] - p[3] / 2, p[1] + p[3] / 2]), bx0 = Math.min(...xs.map(x => x[0])), bx1 = Math.max(...xs.map(x => x[1]));
    const foot = L.BASE + (L.ART[kind].DY || 0);                                // (the build's foot line: a castle stands DY lower)
    return '<div class="sgp sgp-' + kind + '" id="sgp">' +
      '<div class="sgp-bcast" style="transform-origin:' + L.MID + 'px ' + foot + 'px">' + casts + '</div>' +
      '<i class="sgp-bshd" style="left:' + (bx0 - 6) + 'px;width:' + (bx1 - bx0 + 12) + 'px;top:' + (foot - 7) + 'px"></i>' +
      pieces + kid(h.people[0], 0) + kid(h.people[1], 1) + '</div>';
  },
  intro(){
    const L = this, root = document.getElementById("sgp");
    const done = ()=>{ if(!window.__sgIntroDone){ window.__sgIntroDone = true; document.dispatchEvent(new Event("sg-intro-done")); } };
    if(!root){ done(); return; }
    /* title_look "wall": the title is painted on the courtyard wall behind it (S01; user 2026-10-13) */
    const ttl = document.getElementById("sgTitle");
    if(ttl && CARD.landing_hero && CARD.landing_hero.title_look === "wall"){ ttl.classList.add("sg-wall");
      /* user 2026-10-16 "shift the title a little up and make it a little circular with white outline": the words
         ride a gentle arc (an SVG textPath - Devanagari stays shaped, its top bar unbroken), in the brush-streaked
         terracotta paint, edged like S02's title (user 2026-10-16 "just the 2 outline effect"): a white ring and,
         under it, a dark one dropped 4.8px (.sgw-b - S02's text-shadow rings, in deep brown here; pv.css). The arc is sized to the words once the font is in. */
      const txt = ttl.textContent.trim(), NS = "http://www.w3.org/2000/svg";
      ttl.innerHTML = '<svg class="sgw-arc" xmlns="' + NS + '" aria-hidden="true"><defs>' +
        '<pattern id="sgPaint" patternUnits="userSpaceOnUse" width="21" height="80" patternTransform="rotate(7)">' +
        '<rect width="7" height="80" fill="#A93816"/><rect x="7" width="3" height="80" fill="#932C10"/>' +
        '<rect x="10" width="7" height="80" fill="#B4421C"/><rect x="17" width="4" height="80" fill="#9E3214"/></pattern>' +
        '<path id="sgArc"/></defs>' +
        '<text class="sgw-b" transform="translate(0 4.8)"><textPath href="#sgArc" startOffset="50%" text-anchor="middle"></textPath></text>' +
        '<text class="sgw-t"><textPath href="#sgArc" startOffset="50%" text-anchor="middle"></textPath></text></svg>' +
        '<span class="sr-only"></span>';
      ttl.querySelectorAll("textPath").forEach(p => p.textContent = txt); ttl.lastChild.textContent = txt;
      const fit = ()=>{ const svg = ttl.firstChild, t = svg.querySelector("text"), fs = parseFloat(getComputedStyle(ttl).fontSize) || 60;
        const len = t.getComputedTextLength() || txt.length * fs * .45, pad = 14, W = len + 2 * pad + 8, sag = Math.round(W * .045);
        const base = fs * 1.05 + sag + pad;                                     // the ends' baseline; the middle rises by sag
        svg.setAttribute("width", W.toFixed(0)); svg.setAttribute("height", (base + fs * .38 + pad).toFixed(0));
        svg.querySelector("#sgArc").setAttribute("d", "M " + pad + " " + base + " Q " + (W / 2) + " " + (base - 2 * sag) + " " + (W - pad) + " " + base); };
      fit(); if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit); }
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const kids = [...root.querySelectorAll(".sgp-kid")], pcs = [...root.querySelectorAll(".sgp-pc")];
    const plan = L.build(root.classList.contains("sgp-castle") ? "castle" : "house", L.MID, L.BASE);
    /* TEMPO: every move of the children x this (user 2026-10-15: "the motion of the characters on the first screen is too
       fast") - the swoosh in, the leans, the hops, a block's hop into place and the gaps between them */
    const T = 2.2;   // (1.7 still read as fast - user 2026-10-15 "they are more faster now, reduce their speed")
    const q = (e, s)=> e.querySelector(s), wait = ms => new Promise(r => setTimeout(r, ms));
    const dir = s => s ? -1 : 1;                                                // toward the middle: the left child faces right
    const sound = f =>{ try{ f(); }catch(e){} };
    /* each pose picture at the one scale, standing on the child's foot point; the blocks in the carry pose's hands */
    const layout = k =>{
      const ims = [...k.querySelectorAll(".sgp-pose")];
      ims.forEach(im =>{ const H = im.classList.contains("sgp-round") ? 118 : L.FIG_H * (im.naturalHeight || L.FILE_H) / L.FILE_H;
        im.style.height = H.toFixed(1) + "px"; im.dataset.w = ((im.naturalWidth || 120) * H / (im.naturalHeight || 224)).toFixed(1); im.dataset.h = H.toFixed(1); });
      const carry = ims.find(im => im.dataset.for.split(" ").includes("carry")), idle = ims.find(im => im.dataset.for.split(" ").includes("idle"));
      const W = +carry.dataset.w, H = +carry.dataset.h, s = k.classList.contains("sgp-r") ? 1 : 0;
      const hands = (L.HANDS[k.dataset.who] || [[.2, .55], [.8, .55]]).slice();
      if(!s) hands.reverse();                                                   // the hand nearer the build gives first
      [...k.querySelectorAll(".sgp-held")].forEach((b, j)=>{ const [fx, fy] = hands[j % 2], w = parseFloat(b.style.width), h = parseFloat(b.style.height);
        b.style.scale = Math.min(1, 34 / w).toFixed(3);
        b.style.left = ((fx - .5) * W - w / 2).toFixed(1) + "px"; b.style.top = (-H + fy * H - h / 2).toFixed(1) + "px"; });
      const sh = q(k, ".sgp-shd"), iw = +idle.dataset.w * .92;                 // the contact shadow: the feet and a little round them
      sh.style.width = iw.toFixed(0) + "px"; sh.style.left = (-iw / 2).toFixed(0) + "px"; };
    /* a pose change is a cut, not a cross-fade (two half-seen poses read as a double child), hidden by a quick squash */
    const pose = (k, n, pop)=>{ k.querySelectorAll(".sgp-pose").forEach(im => im.classList.toggle("on", im.dataset.for.split(" ").includes(n)));
      if(pop) q(k, ".sgp-fw").animate([{ scale: "1.07 .93" }, { scale: ".98 1.03", offset: .55 }, { scale: "1 1" }], { duration: 220, easing: "ease-out" }); };
    const ready = Promise.all([...root.querySelectorAll(".sgp-pose")].map(im => (im.decode ? im.decode() : Promise.resolve()).catch(()=>{})))
      .then(()=>{ kids.forEach(k =>{ layout(k); pose(k, reduce ? "idle" : "carry"); }); });
    /* the moves */
    const tilt = k => q(k, ".sgp-tilt"), fw = k => q(k, ".sgp-fw"), move = k => q(k, ".sgp-move");
    /* the shadow moves with the child (user 2026-10-15 "when they are dancing their shadow is not changing"): a lean swings
       it the same way (it lies flipped on the floor, so its rotation is the mirror one); in a hop it stays on the floor
       and shrinks and fades while the child is up, darkest again as they land */
    const cast = k => q(k, ".sgp-cast"), contact = k => q(k, ".sgp-shd");
    const lean = (s, deg, ms)=>{ const d = dir(s) * deg, o = { duration: ms * T, easing: "ease-in-out" };
      cast(kids[s]).animate([{ rotate: "0deg" }, { rotate: -d * 1.6 + "deg", offset: .4 }, { rotate: -d * 1.6 + "deg", offset: .6 }, { rotate: "0deg" }], o);
      return tilt(kids[s]).animate([{ rotate: "0deg" }, { rotate: d + "deg", offset: .4 }, { rotate: d + "deg", offset: .6 }, { rotate: "0deg" }], o); };
    const hop = (s, n, hgt)=>{ const k = kids[s], h = hgt || 18, o = { duration: 560 * T, iterations: n, easing: "ease-out" };
      const up = (el, sc, f)=>{ const b = parseFloat(getComputedStyle(el).opacity) || 1;   // from its own resting darkness
        el.animate([{ scale: "1", opacity: b }, { scale: sc, opacity: b * f, offset: .4, easing: "ease-in" }, { scale: "1", opacity: b, offset: .62 }, { scale: "1", opacity: b }], o); };
      up(cast(k), (1 - h / 90).toFixed(2), .55); up(contact(k), (1 - h / 45).toFixed(2), .35);
      return fw(k).animate([{ translate: "0 0" }, { translate: "0 " + -h + "px", offset: .4, easing: "ease-in" }, { translate: "0 0", offset: .62 },
        { translate: "0 2px", offset: .74 }, { translate: "0 0" }], o); };
    const fx = (cls, x, y, frames, ms)=>{ const e = document.createElement("i"); e.className = cls; e.style.left = x + "px"; e.style.top = y + "px"; root.appendChild(e);
      e.animate(frames, { duration: ms, easing: "cubic-bezier(.2,.8,.4,1)" }).onfinish = ()=> e.remove(); };
    const sparkle = (x, y, big)=> fx("sgp-spk" + (big ? " big" : ""), x, y,
      [{ scale: "0", rotate: "0deg", opacity: 1 }, { scale: "1", rotate: "45deg", opacity: 1, offset: .45 }, { scale: "0", rotate: "90deg", opacity: 0 }], big ? 900 : 760);
    const burst = (x, y)=>{ for(let i = 0; i < 14; i++){ const a = i / 14 * Math.PI * 2 + Math.random() * .3, r = 70 + Math.random() * 50;
      fx("sgp-spk conf c" + (i % 4), x, y, [{ translate: "0 0", scale: ".3", opacity: 1 }, { translate: Math.cos(a) * r + "px " + (Math.sin(a) * r * .7 - 20) + "px", scale: "1", opacity: 1, offset: .55 },
        { translate: Math.cos(a) * r * 1.15 + "px " + (Math.sin(a) * r * .7 + 14) + "px", scale: ".6", opacity: 0 }], 1100); } };
    /* the dust a skidding child kicks up behind their feet */
    const dust = s =>{ const x0 = L.KID_X[s] - dir(s) * 26;
      for(let i = 0; i < 7; i++){ const dx = -dir(s) * (14 + Math.random() * 44), dy = -(6 + Math.random() * 22);
        fx("sgp-dust", x0 + (Math.random() - .5) * 24, L.FEET - 6, [{ translate: "0 0", scale: ".4", opacity: .85 }, { translate: dx + "px " + dy + "px", scale: (1.2 + Math.random() * .8).toFixed(2), opacity: 0 }],
           520 + Math.random() * 260); } };
    /* the entrance: a calm glide in (user 2026-10-15: the dash in from beyond the card's edge read as too fast) - each child
       fades in ~200px out from their spot, glides over leaning a little into it, a small settle, still */
    const zoom = s =>{ const k = kids[s], d = dir(s), far = 200;
      sound(()=> playSfxFile("sfx_whoosh", .75));
      move(k).animate([{ translate: -d * far + "px 0", opacity: 0 }, { translate: -d * far * .8 + "px 0", opacity: 1, offset: .15 },
        { translate: d * 6 + "px 0", opacity: 1, offset: .75, easing: "ease-in-out" }, { translate: "0 0", opacity: 1 }],
        { duration: 680 * T, easing: "cubic-bezier(.12,.62,.3,1)", fill: "both" });
      tilt(k).animate([{ rotate: d * 5 + "deg", filter: "blur(2px)" }, { rotate: d * 4 + "deg", filter: "blur(1px)", offset: .45 },
        { rotate: -d * 3 + "deg", filter: "blur(0px)", offset: .7 }, { rotate: "0deg", filter: "blur(0px)" }],
        { duration: 680 * T, easing: "ease-out" });
      q(k, ".sgp-lines").animate([{ opacity: 0, scale: ".3 1" }, { opacity: .5, scale: "1 1", offset: .3 }, { opacity: 0, scale: "1.2 1", offset: .65 }, { opacity: 0 }],
        { duration: 680 * T, easing: "ease-out" });
      setTimeout(()=> dust(s), 400 * T); };
    const k = ()=> root.getBoundingClientRect().width / 772 || 1;
    const ctr = (e, o)=>{ const r = e.getBoundingClientRect(), z = k(); return { x: (r.left + r.width / 2 - o.left) / z, y: (r.bottom - o.top) / z }; };
    /* a block from the hand into its place: the child leans in, the block hops across in a small arc, lands, settles */
    const put = async i =>{
      const p = plan[i], s = p[6], kd = kids[s], held = q(kd, '.sgp-held[data-i="' + i + '"]'), pc = pcs[i], gh = q(root, '.sgp-ghost[data-i="' + i + '"]');
      lean(s, 7, 620); await wait(150 * T);
      const o = root.getBoundingClientRect(), a = ctr(held, o), sc = parseFloat(held.style.scale) || 1;
      const dx = a.x - p[1], dy = a.y - p[2], apex = Math.min(a.y, p[2] - p[4]) - 34 - p[2], F = [];
      held.style.visibility = "hidden"; pc.classList.add("on");
      const pcs_ = q(root, '.sgp-pcs[data-i="' + i + '"]'); if(pcs_) setTimeout(()=> pcs_.classList.add("on"), 470 * T);   // its shadow, as it lands
      for(let j = 0; j <= 10; j++){ const t = j / 10, y = (1 - t) * (1 - t) * dy + 2 * (1 - t) * t * (2 * apex - dy / 2);
        F.push({ translate: (dx * (1 - t)).toFixed(1) + "px " + y.toFixed(1) + "px", rotate: (dir(s) * -24 * (1 - t)).toFixed(1) + "deg",
                 scale: (sc + (1 - sc) * t).toFixed(3), offset: t * .76 }); }
      F.push({ translate: "0 0", rotate: "0deg", scale: "1.14 .84", offset: .87 }, { translate: "0 0", rotate: "0deg", scale: "1 1" });
      pc.animate(F, { duration: 640 * T, easing: "linear" });
      setTimeout(()=>{ if(gh) gh.classList.add("gone"); sparkle(p[1] + (Math.random() - .5) * 10, p[2] - p[4] * .7);
        sound(()=> _tone([700, 470], "triangle", .1, .07)); }, 500 * T);
      if(![...kd.querySelectorAll(".sgp-held")].some(e => e.style.visibility !== "hidden")) setTimeout(()=> pose(kd, "idle", true), 420 * T); };
    const twinkle = ()=>{ const p = pcs[Math.floor(Math.random() * pcs.length)], b = plan[+p.dataset.i];
      sparkle(b[1] + (Math.random() - .5) * b[3] * .6, b[2] - b[4] * (.4 + Math.random() * .5)); };
    /* while the screen waits: one child at a time leans in to admire it, now and then a hop; a twinkle on the build */
    const play = ()=>{ let n = 0;
      const iv = setInterval(()=>{
        if(!root.isConnected){ clearInterval(iv); return; }
        if(!root.getClientRects().length) return;                                 // (the landing is not showing)
        const s = n++ % 2; lean(s, 2, 1100); if(n % 3 === 0) hop(s, 1, 10); twinkle(); }, 2400 * T); };
    const top = Math.min(...plan.map(p => p[2] - p[4]));
    let started = false;
    const go = async ()=>{ if(started) return; started = true;
      await ready;
      if(reduce){ root.classList.add("go", "still", "built"); pcs.forEach(p => p.classList.add("on")); root.querySelectorAll(".sgp-pcs").forEach(p => p.classList.add("on")); done(); return; }
      root.classList.add("go");                                                   // the half-built castle / house and its gaps
      await wait(380);
      zoom(0); await wait(240 * T); zoom(1); await wait(860 * T);
      const order = plan.map((p, i)=> i).filter(i => plan[i][6] === 0 || plan[i][6] === 1).sort((a, b)=> plan[a][7] - plan[b][7]);
      const steps = [...new Set(order.map(k => plan[k][7]))];                    // (pieces of the same order go in together)
      order.forEach(i => setTimeout(()=> put(i), 560 * T * steps.indexOf(plan[i][7])));
      await wait(560 * T * steps.length);
      await wait(380);
      plan.forEach((p, i)=>{ if(p[6] !== "pop") return; pcs[i].classList.add("on");               // the flag goes up
        const sh = q(root, '.sgp-pcs[data-i="' + i + '"]'); if(sh) setTimeout(()=> sh.classList.add("on"), 300 * T);
        pcs[i].animate([{ translate: "0 -24px", scale: ".4", opacity: 0 }, { translate: "0 2px", scale: "1.1", opacity: 1, offset: .6 }, { translate: "0 0", scale: "1" }],
                       { duration: 480 * T, easing: "cubic-bezier(.3,1.4,.5,1)" });
        sparkle(p[1] + 10, p[2] - 26, true); });
      root.classList.add("built");
      await wait(260);
      burst(L.MID, top + 34); sparkle(L.MID - 44, top + 14, true); sparkle(L.MID + 50, top + 40, true);
      sound(()=> _tone([660, 880, 1180], "sine", .5, .1));
      kids.forEach(kd => pose(kd, "cheer", true)); hop(0, 2, 14); setTimeout(()=> hop(1, 2, 16), 110 * T);
      await wait(1300 * T);
      kids.forEach(kd => pose(kd, "idle", true));
      await wait(250);
      done(); };   // then they stand still (user 2026-10-15: the idle leans / hops / twinkles distracted) - only their blinks
    /* the picture comes in on the greeting's "आज हम ... सीखेंगे" (user 2026-10-15), not on its "नमस्ते": card
       landing_hero.start_at = that word's time in vo_landing (s); it waits for the clip itself to reach it, so a slow
       start never puts it early. Never stranded: 2.5s past that time it comes in anyway. */
    const AT = +((CARD.landing_hero || {}).start_at) || 0;
    let greeted = false;
    document.addEventListener("sg-greeting-start", ()=>{ greeted = true;
      if(!AT){ go(); return; }
      const t0 = Date.now(), tick = ()=>{ if(started) return;
        const a = typeof currentAudio !== "undefined" ? currentAudio : null;
        if((a && !a.paused && a.currentTime >= AT) || Date.now() - t0 > AT * 1000 + 2500){ go(); return; }
        setTimeout(tick, 40); };
      tick(); });
    setTimeout(()=>{ if(!greeted) go(); }, 6000);          // (no greeting at all: the picture still comes in)
  }
};


/* VACHAN (एकवचन/बहुवचन) + any 2-category attribute reuse the GENERIC gender modules — identical
   mechanic, just different labels. A vachan game authors these types with the category in the
   "gender" field (e.g. "S"/"P"), the two labels, and (for pairs) f=singular / m=plural; it then
   inherits immediate tap-to-answer feedback, speak-word-on-tap, layered hints, and the engine
   guard for free. Named *_VACHAN (not *_NUMBER) to avoid colliding with MEET_NUMBER = counting. */

/* ---------- 13. CONTROLLER ---------- */
/* ===== FLN ANIMATION KIT: star-burst (call site) BEGIN =====
   Recipe 8 is a RETUNE of the function below, which was already the shipped
   HI01H05 original: fewer and slower (150 ticks / decay .975 / startV 14 /
   32 stars + 8 circles / spin .18 / shots 0-220-440, against 100 / .96 / 22 /
   80 + 20 / .3 / 0-150-300). Travel distance is held at ~547px so it still
   fills the same area - only the density and pace change.
   The original is kept as _starBurstOld, unreferenced, to make this reversible. */
function starBurst(){ FLNMotion.starBurst.fire({ host: "#confetti" }); }
function clearHost(){
  document.body.classList.remove("is-end");   // r4: clear immersive end state when leaving celebration
  $("slideHost").innerHTML = "";
  $("hintBtn").classList.remove("show");
  $("hintBtn").disabled = false;
  setNavActive(false);
  stopNudge();
  stopAudio();
}

/* [loading] a slide mounts once its own files are in (Assets.whenSlide: at once, same tick, when they already are).
   The token keeps the LAST request: two quick jumps never mount the older slide on top of the newer. */
let _mountTok = 0;
function mountSlide(idx){ const t = ++_mountTok; Assets.whenSlide(idx, ()=>{ if(t === _mountTok) mountSlideNow(idx); }); }
function mountSlideNow(idx){
  state.idx = idx;
  state.slideStart = Date.now();
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0; state.hintActive = false;
  state.audioReplays = 0; state.gateNavUntilAudio = false; state.endBtnPending = false;
  state.replayAudio = null;   // a module may set a slide-specific replay (e.g. teach slides whose
                              // audio roles aren't in the autoPlayChain order); else the chip replays the chain
  state.ownsAudio = false;    // a module that drives its OWN audio sequence sets this → skip autoPlayChain
                              // (else the auto prompt-chain stomps/truncates the module's timed VO)
  const slide = CARD.slides[idx];
  bgmFor(slide.phase);        // QA checklist 2026-10-05: the practice game gets its own music (when shipped)
  /* [14] question_started - only on slides that actually ask something */
  try{ if(XAPI_ANSWERABLE.indexOf(slide.type) >= 0)
         XAPI.send("question_started", { slide_id: slide.id, type: slide.type, phase: slide.phase }); }catch(e){}
  clearHost();

  // header prompt
  $("promptText").textContent = slide.prompt_hi || "";

  // Hint button stays HIDDEN until the learner makes a wrong attempt, then it is
  // exposed (graduated scaffold). Mastery uses the SAME scaffold — not excluded.
  $("hintBtn").classList.remove("show");
  $("hintBtn").style.display = "";
  $("navBtn").style.display = "";        // restored by default; tap-to-answer slides hide it themselves
  $("navBtn").style.left = "";           // (T3 sets its own place for it: beside the door - every other slide, bottom centre)
  // [16i] DEFAULT nav wiring — a module that enables आगे without overriding onclick still advances.
  // (DEMO_COUNT shipped an enabled-but-dead button; auto-INTRO inherited an unfulfillable tap guard.)
  $("navBtn").onclick = ()=> completeSlide(true);
  setSwMood("point");                    // Swiftie turns to present each new slide

  GameBus.emit("slide_entered", { slide_id: slide.id, phase: slide.phase, eis: slide.eis, type: slide.type, idx });

  // audio chip = replay the slide audio. Prefer a module-supplied replay (teach slides own their
  // count_intro/explain sequence, which autoPlayChain deliberately skips), else replay the chain.
  $("audioChip").onclick = ()=>{
    if(!replayTap(slide, "header_chip")) return;
    if(state.replayAudio) state.replayAudio(); else autoPlayChain(slide);
  };

  // mount the type
  const mod = SlideModules[slide.type];
  if(!mod){ console.error("[engine] no module for", slide.type); return; }
  // [engine JS] r4/F1 TEACHING FRAME: tutorial slides mount inside a grid-paper .tut-card (header hidden,
  // prompt in-card, standing Swiftie bottom-left + shoulder audio chip). Type-agnostic — any tutorial-phase
  // module renders into the card. Non-tutorial slides mount bare into slideHost as before.
  const isTut = (slide.phase === "tutorial" && slide.type !== "PHASE_TRANSITION" && slide.type !== "CELEBRATION");
  $("stage").classList.toggle("tut", isTut);
  // data.no_head: no header band / Swiftie on this slide - its instruction is its VO only (P4, review 2026-10-07)
  $("stage").classList.toggle("no-head", !!(slide.data && slide.data.no_head));
  document.body.classList.toggle("tut-page", isTut);
  // a slide's own backdrop (data.bg, CSS .stage[data-bg]) - only while that slide is up; its module sets --horizon
  $("stage").dataset.bg = (slide.data && slide.data.bg) || ""; $("stage").style.removeProperty("--horizon");
  let mountHost = $("slideHost");
  if(isTut){
    const card = document.createElement("div"); card.className = "tut-card";
    card.innerHTML = `<div class="tut-prompt">${slide.prompt_hi || ""}</div>` +
      `<img class="tut-mascot" src="assets/start_mascot.webp" alt="" onerror="this.style.display='none'">` +
      /* [05][11] QA CHECKLIST: the in-slide speaker chip is the inline SVG -
         gradient + white ring + wave arcs - never a flat PNG. Verbatim HI01. */
      `<span class="tut-audio" role="button" aria-label="फिर से सुनो"><svg viewBox="0 0 62 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Audio"><g filter="url(#tutChipShadow)"><rect x="8" y="4" width="46" height="44" rx="22" fill="url(#tutChipGrad)"/><rect x="6" y="2" width="50" height="48" rx="24" stroke="white" stroke-width="4"/><path d="M29.8466 19.0574C29.8804 19.0524 29.9145 19.0496 29.9487 19.0488C30.6094 19.0317 31.0021 19.5124 31.0015 20.1414C31.0008 20.9661 31.0003 21.7911 31.0005 22.6158L31.001 27.7212L31.0009 30.5591C31.0009 31.0364 31.0122 31.5472 30.9863 32.0228C30.9662 32.2709 30.902 32.4608 30.7251 32.643C30.3831 32.9952 29.8337 33.0842 29.4386 32.7671C29.0784 32.4781 28.7473 32.1159 28.4181 31.7862L26.4414 29.8087C26.1771 29.5426 25.9071 29.2636 25.6339 29.0081C25.0227 28.9649 24.3645 29.017 23.7487 28.9979C23.445 28.9885 23.1625 29.0211 22.8589 28.9606C22.3751 28.8616 22.0618 28.4823 22.0642 27.9824C22.0706 26.5937 22.0287 25.1949 22.0828 23.8081C22.0884 23.6626 22.2302 23.4334 22.3309 23.3252C22.454 23.1907 22.6146 23.0963 22.792 23.0543C23.0567 22.9904 23.5328 23.016 23.8224 23.0128C24.4143 23.0063 25.0171 23.0277 25.609 23.0073C25.6794 22.9529 25.8505 22.7743 25.919 22.706L26.5305 22.0945L28.5396 20.0838C28.9157 19.7059 29.3217 19.1749 29.8466 19.0574Z" fill="white"/><path class="wv wv2" d="M36.2367 18.6905C36.8783 18.6449 37.3041 19.231 37.6725 19.6829C38.7675 21.0046 39.4982 22.5894 39.7923 24.2804C40.2503 26.8763 39.6548 29.5478 38.1378 31.7035C37.8393 32.1274 37.508 32.5324 37.149 32.9063C36.9404 33.1236 36.7646 33.2558 36.4622 33.3081C36.2013 33.3412 35.9378 33.2717 35.7272 33.1144C35.5185 32.9615 35.3816 32.7298 35.3483 32.4733C35.2786 31.9235 35.5696 31.6821 35.8914 31.3297C36.0448 31.1639 36.1901 30.9908 36.3269 30.811C38.3669 28.136 38.4986 24.4654 36.6555 21.6511C36.4826 21.3899 36.2966 21.1376 36.0984 20.8951C35.8252 20.5652 35.3947 20.2691 35.3472 19.8184C35.2845 19.2225 35.6439 18.768 36.2367 18.6905Z" fill="white"/><path class="wv wv1" d="M33.3868 21.5044C33.9769 21.4549 34.2563 21.7845 34.5981 22.1981C35.1982 22.924 35.6149 23.7691 35.8211 24.6886C36.171 26.2384 35.8867 27.8637 35.0314 29.2026C34.7421 29.6568 34.2333 30.3745 33.6937 30.4946C33.1633 30.5437 32.6759 30.2927 32.5495 29.7376C32.3921 29.0462 32.9849 28.6956 33.3274 28.1763C34.2088 26.833 34.1932 25.0908 33.288 23.7635C33.0747 23.4522 32.6159 23.0564 32.5518 22.7133C32.4377 22.1027 32.7745 21.619 33.3868 21.5044Z" fill="white"/></g><defs><filter id="tutChipShadow" x="0" y="0" width="62" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter><linearGradient id="tutChipGrad" x1="8" y1="26" x2="54" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#1987FC"/><stop offset="1" stop-color="#1565F4"/></linearGradient></defs></svg></span>`;
    const inner = document.createElement("div"); inner.className = "tut-content";
    card.insertBefore(inner, card.querySelector(".tut-mascot"));
    card.querySelector(".tut-audio").onclick = ()=>{
      if(!replayTap(slide, "tut_chip")) return;
      if(state.replayAudio) state.replayAudio(); else autoPlayChain(slide);
    };
    $("slideHost").appendChild(card);
    mountHost = inner;
  }
  mod.mount(mountHost, slide);
  // game-feel: animate the slide content in on every mount
  { const _sh = $("slideHost"); _sh.classList.remove("slide-in"); void _sh.offsetWidth; _sh.classList.add("slide-in"); }

  // vertically ink-centre every Devanagari glyph once the slide has laid out
  requestAnimationFrame(()=> centerAllGlyphs($("slideHost")));

  // play the full VO chain automatically (prompt → phoneme/word_name → instruction).
  // If the slide gated its nav button on audio, enable it once the chain finishes
  // (so students can't skip before hearing it). SKIP when the module owns its audio
  // (state.ownsAudio) — else this chain stomps/truncates the module's own timed VO.
  if(!state.ownsAudio){
    autoPlayChain(slide, ()=>{
      if(state.gateNavUntilAudio) setNavActive(true);
      if(state.endBtnPending){ $("endBtn").classList.add("show"); state.endBtnPending = false; }
    });
  }
}

/* ---------- [engine JS] r4/P1 PHASE-TRANSITION PEEK GATE (Shruti's peek beat) ----------
   An automatic interstitial fired ON A PHASE BOUNDARY (not a slide type): blur the stage, Swiftie
   peeks up from the bottom under a big headline, hold ≥2s, then mount the next slide. Kept ALONGSIDE
   our journey-map PHASE_TRANSITION module (a distinct, author-placed slide type) — the gate below
   skips PHASE_TRANSITION + CELEBRATION so the two never double-fire. */
function afterConfetti(fn){
  /* ===== FLN ANIMATION KIT: confetti (advance gate) BEGIN =====
     Recipe 7 renders into .fx-confetti, not the retired .conf-shot, so this gate
     was about to poll for an element that can no longer exist and wave every
     slide straight through mid-celebration. FLNMotion.confetti.after() is the
     kit's own version of this poll, with the same 8s cap. */
  FLNMotion.confetti.after(fn);
  /* ===== FLN ANIMATION KIT: confetti (advance gate) END ===== */
}
/* onscreen headline per gate (display only; distinct from any narration). Eligibility = phase IN this map. */
const PHASE_GATE_TITLE = { tutorial:"चलिए, शुरू करते हैं!", guided:"चलिए, साथ में करें!", practice:"अब आपकी बारी!" };   // QA checklist 2026-10-05: the headlines are exactly the lines Swiftie speaks (each VO is now that line alone), so the text appears only as she says it
const PHASE_GATE_VO    = { tutorial:"vo_pt_tutorial", guided:"vo_pt_guided", practice:"vo_pt_practice" };
/* [peek-2] The clip's own length, and the CSS duck-down that follows it. Both are contracts
   with assets/gif/peeking.webp and @keyframes pgDuck — if either is re-cut, change it here too. */
const ANIM_ASSETS = ["loader.webp", "new_landing_swiftee_anim.webp", "peeking.webp", "sw_head_celebrate_anim.webp", "sw_head_hint_anim.webp", "sw_head_tryagain_anim.webp"];
const PG_CLIP_MS = 8304;  // peeking.webp: hands arrive, peek, blink, come out, talk with blinks, duck back; 8.30s, plays once (9.72s before 2026-10-05).
const PG_EXIT_MS = 520;    // .phase-gate.leaving / @keyframes pgDuck - a FALLBACK bound only; animationend is what actually closes the gate
/* [peek-5] review 2026-09-30: the headline and VO came up the instant the gate opened, while
   Swiftie was still peeking over the ledge - she "spoke" 4s before her mouth moved. They now
   wait for her: PG_TALK_MS is peeking.webp's first open-mouth frame (frame 58 of 84, measured
   from the clip's ANMF frame durations). Until then the gate is Swiftie alone. */
/* review 2026-10-05: "fasten the gif a little before it starts speaking" - the clip's own frame timings were re-timed
   (frames 1-58 only: its still holds halved, its motion frames 40 -> 32ms; every frame kept, nothing re-encoded), so she
   reaches her first open-mouth frame at 2.72s instead of 4.14s. The talking part is untouched. */
const PG_TALK_MS = 2724;
const PG_TAIL_MS = 450;    // a VO that ends while her clip is still talking: hold this long after it, then duck
const PG_LOAD_CAP_MS = 2500;   // never wait longer than this for the clip to decode
/* [peek-6] review 2026-09-30: "Swifty is glitching very much in the transition screen". Three causes:
   1. peeking.webp's ANIM loop count was 0 (= loop forever; the kit builds it as a play-once GIF and
      the webp conversion dropped that). Every gate that outlived the clip's 9.72s snapped her back to
      frame 0 - hands only - and she re-peeked while ducking. The file now says 1: play once, then hold
      the last frame, which is what PG_CLIP_MS and the park-on-her-smile logic always assumed.
   2. (asset only) At 1500x1500 the clip's frame decode stalled the whole page ~45 times per gate on an
      Intel UHD laptop; it now ships at 900x900 - same 84 frames, same durations - and stalls ~6 times.
   3. Each gate restarted her with a fresh ?r= URL, i.e. a new 3.7MB download - a blank blurred beat
      before her hands appeared, seconds long on a school connection. The clip is now fetched ONCE and
      each gate gets a new blob: URL of it; a new URL is a new image, so she starts from frame 0 with
      no network. Where fetch() can't read the file (file:// hosts) the cache-bust remains the fallback. */
let _peekUrl = "";
/* [loading] the clip is the loader's GATE file (Assets): fetched once as a Blob, right after the landing's own files -
   the gate's <img> no longer pulls it with the page, ahead of them. Each gate: a fresh blob: URL of it. */
function restartPeek(img){
  const old = _peekUrl;
  img.src = _peekUrl = Assets.fresh("assets/gif/peeking.webp");
  if(old && old.indexOf("blob:") === 0) URL.revokeObjectURL(old);
}
/* [peek-7] review 2026-10-05: "swifty gif in the transition screen is glitching a lot". The clip itself is clean
   (84 frames, a smooth rise, no jumps between frames); the glitch is the browser playing a big animated <img> with
   alpha under the gate's full-screen backdrop blur - frame steps stall and, as measured on the landing (see
   [landing mascot player]), Chrome sometimes paints nothing for a frame or two. Same cure as the landing: decode the
   clip ourselves (WebCodecs ImageDecoder, the next frame always decoded ahead) and draw it on a canvas at its
   displayed size - a canvas keeps its last picture until the next is drawn. play() resolves true once frame 0 is
   on screen (the gate's clip clock starts there), false = no ImageDecoder / no bytes / an error: use the <img>. */
const PeekPlayer = (()=>{
  const SRC = "assets/gif/peeking.webp", TYPE = "image/webp";
  let run = 0;
  function stop(){ run++; }
  function play(cv, img){
    const my = ++run, blob = Assets.blob(SRC);
    if(!cv || !blob || typeof ImageDecoder === "undefined") return Promise.resolve(false);
    if(img) img.style.display = "none";
    cv.style.display = "";
    cv.width = cv.height = 900;                  // the clip's 1:1 shape, so the CSS height + width:auto lays it out
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    cv.width = W; cv.height = H;                 // (this also wipes the last gate's parked smile)
    const ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
    const draw = f =>{ ctx.clearRect(0, 0, W, H); ctx.drawImage(f, 0, 0, W, H); };
    return (async ()=>{
      if(ImageDecoder.isTypeSupported && !(await ImageDecoder.isTypeSupported(TYPE))) return false;
      const dec = new ImageDecoder({ data: await blob.arrayBuffer(), type: TYPE });
      await dec.tracks.ready;
      const count = dec.tracks.selectedTrack.frameCount;
      const first = count > 0 ? (await dec.decode({ frameIndex: 0 })).image : null;
      if(!first || my !== run){ if(first) first.close(); dec.close(); return false; }
      draw(first);
      let i = 0, cur = first, due = performance.now() + (cur.duration || 90000) / 1000;   // VideoFrame.duration: us
      let next = count > 1 ? dec.decode({ frameIndex: 1 }) : null;
      (async ()=>{
        while(next){
          let n; try { n = (await next).image; } catch(e){ break; }   // a failed decode: the frame on show stays
          const wait = due - performance.now();
          if(wait > 1) await new Promise(res => setTimeout(res, wait));
          if(my !== run){ n.close(); break; }                        // a newer gate, or this one closed
          draw(n); cur.close(); cur = n; i++;
          due = Math.max(due, performance.now() - 30) + (n.duration || 90000) / 1000;
          next = i + 1 < count ? dec.decode({ frameIndex: i + 1 }) : null;   // decoded while this one is on show
        }
        cur.close(); dec.close();                                    // plays once: the last frame stays drawn
      })();
      return true;
    })().catch(()=> false);
  }
  return { play, stop };
})();
const _gatedPhases = new Set();   // each phase gate plays ONCE (Start→tutorial, →guided, →practice)
let _gateToken = 0;
function phaseBlurTransition(cb, toPhase){
  const tok = ++_gateToken;
  stopNudge(); stopAudio();
  const gate = $("phaseGate"), img = $("phaseGateImg"), cv = $("phaseGateCv");
  gate.classList.remove("talking");   // headline stays hidden until she talks
  const title = $("phaseGateTitle"); if(title) title.textContent = PHASE_GATE_TITLE[toPhase] || "";
  $("stage").classList.add("blurred", "gating");
  document.body.classList.add("gating");
  gate.classList.remove("leaving");   // a gate interrupted mid-exit would open her already off-screen
  gate.classList.add("show");
  GameBus.emit("phase_transition", { to: toPhase });
  const closeGate = ()=>{ gate.classList.remove("show", "leaving", "talking"); $("stage").classList.remove("blurred", "gating"); document.body.classList.remove("gating"); };
  // VO only if the card actually ships it; else a silent beat — the clip floor keeps the peek visible.
  const voId = PHASE_GATE_VO[toPhase];
  const voSrc = (voId && CARD.assets && CARD.assets.audio && CARD.assets.audio[voId]) || null;
  /* The clip's clock starts when it can actually paint, NOT when the gate opens: decoding a
     fresh 1500px clip (or downloading it, on the ?r= fallback) takes a moment, and timing from
     the open would put the VO ahead of her mouth by however long that took. */
  let clipAt = 0;
  const startClock = ()=>{
    if(clipAt || tok !== _gateToken) return;
    clipAt = Date.now();
    setTimeout(talk, PG_TALK_MS);
  };
  /* [peek-7] the canvas player first (it needs the gate shown, to measure her); the <img> only if it can't */
  const useImg = ()=>{
    if(tok !== _gateToken) return;
    if(cv) cv.style.display = "none";
    if(!img){ startClock(); return; }
    img.style.display = "";
    restartPeek(img);                 // from frame 0, every gate
    if(img.decode) img.decode().then(startClock, startClock); else startClock();
  };
  PeekPlayer.play(cv, img).then(ok =>{ if(tok !== _gateToken) return; if(ok) startClock(); else useImg(); }, useImg);
  setTimeout(startClock, PG_LOAD_CAP_MS);   // a stalled download never strands the gate
  function talk(){
    if(tok !== _gateToken) return;          // a newer gate superseded us
    gate.classList.add("talking");          // headline pops in (CSS) on the same tick the VO starts
    play(voSrc, afterVo);
  }
  function afterVo(){
    if(tok !== _gateToken){ closeGate(); return; }               // a newer gate superseded us
    /* peeking.webp plays ONCE: rise, talk, then park on her smile (PG_CLIP_MS).
       A line that outlasts the clip still governs - she holds the parked smile until
       it ends, then ducks at once. A line that ends while she is still talking (the
       2.3s practice line against 4.4s of mouth) ducks her PG_TAIL_MS after it, so her
       beak is not flapping in silence. With no VO at all the whole clip plays out. */
    const clipLeft = Math.max(0, PG_CLIP_MS - (Date.now() - clipAt));
    const hold = voSrc ? Math.min(clipLeft, PG_TAIL_MS) : clipLeft;
    const finish = ()=>{
      PeekPlayer.stop();
      gate.classList.remove("show", "leaving", "talking");
      $("stage").classList.remove("blurred");
      if(cb) cb();                              // mounts the next slide
      $("stage").classList.remove("gating");    // header returns once the slide is in
      document.body.classList.remove("gating");
    };
    /* Send her back down BEFORE the gate is torn down, not with it - the clip no longer
       ducks on its own (it can't: it would have to know how long the VO is). The close
       waits on animationend, NOT on a matching setTimeout: a fixed PG_EXIT_MS timer
       raced the animation and lost - decoding the clip's tail delayed the animation's
       first frame by ~270ms, so the gate vanished with Swiftie still barely moved. */
    setTimeout(()=>{
      if(tok !== _gateToken){ closeGate(); return; }   // a newer gate superseded us
      let done = false, fallback = 0;
      const once = ()=>{
        if(done) return; done = true;
        clearTimeout(fallback);
        if(img) img.removeEventListener("animationend", once);
        if(cv) cv.removeEventListener("animationend", once);
        if(tok !== _gateToken){ closeGate(); return; }
        finish();
      };
      if(img) img.addEventListener("animationend", once);   // only the one on show runs the duck
      if(cv) cv.addEventListener("animationend", once);
      gate.classList.add("leaving");
      // reduced-motion, a missing clip, a backgrounded tab: nothing to end, so close anyway
      fallback = setTimeout(once, PG_EXIT_MS + 500);
    }, hold);
  }
}

function completeSlide(success){
  const slide = CARD.slides[state.idx];
  GameBus.emit("slide_completed", {
    slide_id: slide.id, phase: slide.phase, success: !!success,
    attempts: state.attempts + (success ? 1 : 0), latency_ms: Date.now()-state.slideStart,
    scaffold_level: state.scaffoldLevel, hint_used: state.hintUsed,
    nudge_used: state.nudgeUsed, audio_replays: state.audioReplays
  });
  if(state.idx >= CARD.slides.length - 1){
    // last slide is CELEBRATION; nothing more
    return;
  }
  // advance only AFTER the correct-answer confetti has landed (to the gate AND to the next slide alike).
  const fromIdx = state.idx, nextIdx = state.idx + 1;
  const next = CARD.slides[nextIdx];
  if(next && next.phase !== slide.phase && next.type !== "CELEBRATION" && next.type !== "PHASE_TRANSITION"
     && PHASE_GATE_TITLE[next.phase] && !_gatedPhases.has(next.phase)){
    _gatedPhases.add(next.phase);
    afterConfetti(()=>{ if(state.idx === fromIdx) Assets.whenSlide(nextIdx, ()=>{                   // [loading] the gate + that slide's files
      if(state.idx === fromIdx) phaseBlurTransition(()=> mountSlide(nextIdx), next.phase); }, next.phase); });
    return;
  }
  afterConfetti(()=>{ if(state.idx === fromIdx) mountSlide(nextIdx); });
}

/* ---------- 14. VALIDATOR (runtime self-check) ---------- */
function runValidator(){
  const missing = (CARD.signals_expected || []).filter(s => !GameBus.firedSet.has(s));
  GameBus.validatorReport.missing_signals = missing;
  GameBus.validatorReport.passed = missing.length === 0;
  console.log("[validator]", GameBus.validatorReport);
  try{ window.parent?.postMessage({type:"swiftpal:lesson_complete", signals: GameBus.signals, validatorReport: GameBus.validatorReport}, "*"); }catch(e){}
  // offline self-capture: write the final record to localStorage; optionally POST
  // it to a learning-record endpoint if one is configured AND the device is online.
  GameBus.persist();
  if(TELEMETRY.endpoint && navigator.onLine){
    try{ fetch(TELEMETRY.endpoint, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(GameBus.exportResults()), keepalive:true}).catch(()=>{}); }catch(e){}
  }
  // dev banner
  if(new URLSearchParams(location.search).has("dev")){
    const b = $("devBanner");
    if(missing.length === 0){ b.textContent = "✓ all expected signals fired"; b.className = "dev-banner show ok"; }
    else { b.textContent = "✗ missing signals: " + missing.join(", "); b.className = "dev-banner show"; }
  }
}

/* ---------- [engine JS] r4/#2 DATA-DRIVEN LANDING CONCEPT STRIP ----------
   A landing_hero of kind "concept_strip" renders N visual-example tiles from card data, so any game
   declares its landing preview in card.json instead of hand-editing HTML. Tile types: discs (size),
   bars (length), balance (weight — equal-size objects, heavier lower, never a size cue), image. */
const SG_BALANCE_SVG =
  '<svg viewBox="0 0 124 112" xmlns="http://www.w3.org/2000/svg">' +
  '<line x1="62" y1="30" x2="62" y2="86" stroke="#8AA0C8" stroke-width="6" stroke-linecap="round"/>' +
  '<polygon points="62,60 44,100 80,100" fill="#8AA0C8"/>' +
  '<g transform="rotate(-13 62 34)">' +
  '<rect x="14" y="30" width="96" height="11" rx="5.5" fill="#4EA3F0"/>' +
  '<circle cx="22" cy="20" r="14" fill="#FBD24B" stroke="#D9A21A" stroke-width="2.5"/>' +
  '<circle cx="102" cy="20" r="14" fill="#98A2B3" stroke="#5B6577" stroke-width="2.5"/>' +
  '</g></svg>';
function conceptTileHTML(c){
  const lbl = c && c.label ? ` aria-label="${c.label}"` : "";   // a11y only; not shown (pre-reader → visual+VO)
  switch(c && c.type){
    case "discs": {
      const sizes = c.sizes || [34, 54, 76];
      return `<div class="sg-ex sg-ex-size" role="img"${lbl}>` +
        sizes.map(s => `<span class="sg-disc" style="width:${s}px;height:${s}px"></span>`).join("") + `</div>`;
    }
    case "bars": {
      const widths = c.widths || [42, 72, 102];
      return `<div class="sg-ex sg-ex-len" role="img"${lbl}>` +
        widths.map(w => `<span class="sg-bar" style="width:${w}px"></span>`).join("") + `</div>`;
    }
    case "balance":
      return `<div class="sg-ex sg-ex-wt" role="img"${lbl}>` + SG_BALANCE_SVG + `</div>`;
    case "image":
      return `<div class="sg-ex" role="img"${lbl}><img src="${c.src}" alt="${c.label || ''}"></div>`;
    default:
      return "";
  }
}

/* ---------- 14b. ASSETS: THE LANDING FIRST, THEN EVERY FILE OF THE LESSON ----------
   The white boot loader holds only until the LANDING's own files are in (tag CRIT: its art, the title font, the play
   button, the greeting + Swiftee's wave) - so the first screen comes up fast. Then every other file in ASSET_SIZES (all
   shipped files, generated from disk) streams in behind the landing while the greeting plays, so nothing loads
   mid-lesson. (A loading bar in the play button's place was tried on 2026-10-06 and taken out at review: "remove this
   loader". The play tap needs no gate of its own - slide 0 mounts through whenSlide, below, which waits for its files.)
     - queue: the landing's files first (nothing else starts until they are in), then SMALLEST FIRST - pictures,
       backdrops and clips land in the first seconds and never wait behind the big animated WebPs. 5 at a time.
     - a fetched file is kept as a Blob: an <img> / <audio> that is later given that file's path gets a blob: URL of it
       instead (the MutationObserver below; play() for the voice element), so "loaded" really means local. A blob: URL
       that fails falls back, once, to the file's own URL. CSS url() backgrounds read the same bytes from the HTTP
       cache the fetch just filled.
     - NEVER BLOCKS: a failed, stalled (STALL_MS without a byte) or over-long (CAP_MS) transfer is aborted and counts as
       done - the element keeps its original src and loads it the normal way. file:// (fetch blocked) is done at once.
   Assets.whenSlide(i, fn): fn runs once slide i's own files are in (same tick when they already are - almost always, as
   the files arrive while the greeting plays); a spinner shows after 300ms and after 8s fn runs anyway. Animations that must restart from frame 0
   (the peeking gate, the cheers) get a fresh blob: URL per restart (Assets.fresh) - no ?r= re-downloads.
   ?noprefetch (QA only) turns the queue off, so a slide's own requests can be watched.
   Formats (2026-10-06): images WebP, audio Ogg/Opus, fonts WOFF2 - Chrome / Edge / Firefox, and Safari 17+ (Ogg Opus
   from Safari 18.4). */
/* @asset-sizes:begin (generated by tools/gen_asset_sizes.js - do not edit by hand) */
const ASSET_SIZES = {
  "assets/bg_landing_v3.webp": 71450,
  "assets/bgdeco_spark.svg": 220,
  "assets/bgdeco_star.svg": 391,
  "assets/bgdeco_star_o.svg": 448,
  "assets/btn-play-round-waiting.svg": 2655,
  "assets/btn-play-round.svg": 2645,
  "assets/char_aaru.webp": 14372,
  "assets/char_aaru_blink.webp": 14242,
  "assets/char_aaru_cheer.webp": 54110,
  "assets/char_aaru_cheer_blink.webp": 53942,
  "assets/char_aaru_full.webp": 46560,
  "assets/char_aaru_full_blink.webp": 45986,
  "assets/char_amma.webp": 14724,
  "assets/char_pari.webp": 17236,
  "assets/char_pari_blink.webp": 17230,
  "assets/char_pari_carry.webp": 66606,
  "assets/char_pari_carry_blink.webp": 67238,
  "assets/char_pari_cheer.webp": 60344,
  "assets/char_pari_full.webp": 50702,
  "assets/char_pari_full_blink.webp": 51278,
  "assets/end_screen.webp": 33634,
  "assets/fonts/baloo2-600.woff2": 87020,
  "assets/fonts/baloo2-700.woff2": 86108,
  "assets/fonts/baloo2-800.woff2": 74512,
  "assets/gif/loader.webp": 137428,
  "assets/gif/new_landing_swiftee_anim.webp": 641710,
  "assets/gif/peeking.webp": 1252974,
  "assets/gif/sw_head_celebrate_anim.webp": 293618,
  "assets/gif/sw_head_hint_anim.webp": 316076,
  "assets/gif/sw_head_tryagain_anim.webp": 313414,
  "assets/house_block_l.webp": 6682,
  "assets/house_block_r.webp": 6726,
  "assets/house_blocks.webp": 107582,
  "assets/last_swifty_end.webp": 1779506,
  "assets/last_swifty_still.webp": 26456,
  "assets/mascot.webp": 8006,
  "assets/nudge_fx_ring_inner.svg": 786,
  "assets/nudge_fx_ring_outer.svg": 769,
  "assets/nudge_fx_sparks.svg": 2476,
  "assets/nudge_hand_new.svg": 6860,
  "assets/pv_cube10.webp": 15724,
  "assets/pv_cube4.webp": 9352,
  "assets/pv_rod11.webp": 33128,
  "assets/sfx/bgm.ogg": 1443997,
  "assets/sfx/sfx_confetti.ogg": 11582,
  "assets/sfx/sfx_correct.ogg": 10099,
  "assets/sfx/sfx_next.ogg": 1538,
  "assets/sfx/sfx_nudge.ogg": 3537,
  "assets/sfx/sfx_play.ogg": 3094,
  "assets/sfx/sfx_whoosh.ogg": 3670,
  "assets/sfx/sfx_wrong.ogg": 6095,
  "assets/start_card.webp": 1024,
  "assets/start_mascot.webp": 18020,
  "assets/startnew_bg_plain.webp": 24446,
  "assets/sw_head_celebrate.webp": 41998,
  "assets/sw_head_hint.webp": 36812,
  "assets/sw_head_talking.webp": 37384,
  "assets/sw_head_tryagain.webp": 48836,
  "assets/voiceover/sfx_celebrate.ogg": 8344,
  "assets/voiceover/vo_cel.ogg": 18713,
  "assets/voiceover/vo_g1_ask.ogg": 7030,
  "assets/voiceover/vo_g1_correct.ogg": 17238,
  "assets/voiceover/vo_g1_great.ogg": 4815,
  "assets/voiceover/vo_g1_hint_a.ogg": 17422,
  "assets/voiceover/vo_g1_hint_b.ogg": 6575,
  "assets/voiceover/vo_g1_prompt.ogg": 9502,
  "assets/voiceover/vo_g1_try_again.ogg": 11977,
  "assets/voiceover/vo_g2_correct.ogg": 16110,
  "assets/voiceover/vo_g2_hint_a.ogg": 18077,
  "assets/voiceover/vo_g2_hint_b.ogg": 6897,
  "assets/voiceover/vo_g2_prompt.ogg": 10289,
  "assets/voiceover/vo_g3_correct.ogg": 17225,
  "assets/voiceover/vo_g3_hint_a.ogg": 16650,
  "assets/voiceover/vo_g3_hint_b.ogg": 6737,
  "assets/voiceover/vo_g3_prompt.ogg": 10285,
  "assets/voiceover/vo_hint_dd_1.ogg": 17585,
  "assets/voiceover/vo_landing.ogg": 37434,
  "assets/voiceover/vo_num_1.ogg": 2617,
  "assets/voiceover/vo_num_10.ogg": 3205,
  "assets/voiceover/vo_num_2.ogg": 2795,
  "assets/voiceover/vo_num_3.ogg": 2880,
  "assets/voiceover/vo_num_4.ogg": 3047,
  "assets/voiceover/vo_num_5.ogg": 2612,
  "assets/voiceover/vo_num_6.ogg": 2621,
  "assets/voiceover/vo_num_7.ogg": 3108,
  "assets/voiceover/vo_num_8.ogg": 3086,
  "assets/voiceover/vo_num_9.ogg": 2775,
  "assets/voiceover/vo_p1_correct.ogg": 16055,
  "assets/voiceover/vo_p1_hint_a.ogg": 17336,
  "assets/voiceover/vo_p1_hint_b.ogg": 6894,
  "assets/voiceover/vo_p1_prompt.ogg": 16595,
  "assets/voiceover/vo_p1_try_again.ogg": 13326,
  "assets/voiceover/vo_p2_correct.ogg": 16589,
  "assets/voiceover/vo_p2_hint_a.ogg": 16852,
  "assets/voiceover/vo_p2_hint_b.ogg": 6678,
  "assets/voiceover/vo_p2_prompt.ogg": 17624,
  "assets/voiceover/vo_p3_correct.ogg": 16175,
  "assets/voiceover/vo_p3_h_tables.ogg": 17219,
  "assets/voiceover/vo_p3_prompt.ogg": 6401,
  "assets/voiceover/vo_p4_correct.ogg": 16575,
  "assets/voiceover/vo_pt_guided.ogg": 7736,
  "assets/voiceover/vo_pt_practice.ogg": 7611,
  "assets/voiceover/vo_pt_tutorial.ogg": 7759,
  "assets/voiceover/vo_t1_count_intro.ogg": 15089,
  "assets/voiceover/vo_t1_know.ogg": 19833,
  "assets/voiceover/vo_t1_made.ogg": 19237,
  "assets/voiceover/vo_t1_make.ogg": 13130,
  "assets/voiceover/vo_t1_move.ogg": 12369,
  "assets/voiceover/vo_t1_rest_intro.ogg": 8861,
  "assets/voiceover/vo_t1_total.ogg": 20022,
  "assets/voiceover/vo_t2_a.ogg": 9383,
  "assets/voiceover/vo_t2_ask.ogg": 18323,
  "assets/voiceover/vo_t2_b.ogg": 11142,
  "assets/voiceover/vo_t2_intro.ogg": 12707,
  "assets/voiceover/vo_t3_a_digits.ogg": 12518,
  "assets/voiceover/vo_t3_a_ones.ogg": 12945,
  "assets/voiceover/vo_t3_a_tens.ogg": 13257,
  "assets/voiceover/vo_t3_b_digits.ogg": 15913,
  "assets/voiceover/vo_t3_b_ones.ogg": 12953,
  "assets/voiceover/vo_t3_b_tens.ogg": 14526,
  "assets/voiceover/vo_t3_done.ogg": 21013,
  "assets/voiceover/vo_t3_head.ogg": 14041,
  "assets/voiceover/vo_t3_intro.ogg": 17896,
  "assets/voiceover/vo_t3_know.ogg": 19015,
  "assets/voiceover/vo_t3_make.ogg": 11973,
  "assets/voiceover/vo_t3_merge.ogg": 17634,
  "assets/voiceover/vo_t3_ones.ogg": 8602,
  "assets/voiceover/vo_t3_ones_sum.ogg": 16969,
  "assets/voiceover/vo_t3_place.ogg": 13959,
  "assets/voiceover/vo_t3_tens.ogg": 8587,
  "assets/voiceover/vo_t3_tens_sum.ogg": 22175,
  "assets/voiceover/vo_t3_total.ogg": 21198,
  "assets/voiceover/vo_t4_eq.ogg": 12213,
  "assets/voiceover/vo_t4_total.ogg": 15231,
  "assets/voiceover/vo_t5_a.ogg": 9854,
  "assets/voiceover/vo_t5_ask.ogg": 18927,
  "assets/voiceover/vo_t5_b.ogg": 12013,
  "assets/voiceover/vo_t5_head.ogg": 11645,
  "assets/voiceover/vo_t6_a_build.ogg": 12196,
  "assets/voiceover/vo_t6_a_digits.ogg": 12222,
  "assets/voiceover/vo_t6_b_build.ogg": 11967,
  "assets/voiceover/vo_t6_b_digits.ogg": 12268,
  "assets/voiceover/vo_t6_done.ogg": 19166,
  "assets/voiceover/vo_t6_intro.ogg": 17217,
  "assets/voiceover/vo_t6_know.ogg": 11315,
  "assets/voiceover/vo_t6_make.ogg": 10861,
  "assets/voiceover/vo_t6_ones.ogg": 8193,
  "assets/voiceover/vo_t6_ones_sum.ogg": 16245,
  "assets/voiceover/vo_t6_place.ogg": 11345,
  "assets/voiceover/vo_t6_tens.ogg": 8554,
  "assets/voiceover/vo_t6_tens_sum.ogg": 19562,
  "assets/voiceover/vo_t6_total.ogg": 18468,
  "assets/voiceover/vo_t7_eq.ogg": 11167,
  "assets/voiceover/vo_t7_total.ogg": 12891
};
/* @asset-sizes:end */
const Assets = (function(){
  const CRIT = -3, GATE = -2, UI = -1, REST = 999;
  const CONCURRENCY = 5, STALL_MS = 15000, CAP_MS = 90000, CRIT_CAP_MS = 20000;
  let q; try{ q = new URLSearchParams(location.search); }catch(e){ q = { has: ()=> false }; }
  const OFF = q.has("noprefetch");
  const HTTP = /^https?:$/.test(location.protocol);           // file:// can't fetch(): every element loads its own file there
  const items = new Map(), perSlide = [], blobs = new Map(), urls = new Map();
  let seq = 0, active = 0, started = false, hold = false;
  const A = (CARD.assets || {});
  const known = src => Object.prototype.hasOwnProperty.call(ASSET_SIZES, src);
  const vo = id => (A.audio && typeof A.audio[id] === "string" && A.audio[id].indexOf("assets/") === 0) ? A.audio[id]
                                                                                                      : "assets/voiceover/" + id + "." + AUDIO_EXT;
  const art = f => "assets/" + (ANIM_ASSETS.indexOf(f) >= 0 ? "gif/" : "") + f;
  const TYPES = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", ogg: "audio/ogg", woff2: "font/woff2" };
  const typeOf = src => TYPES[(src.split("?")[0].split(".").pop() || "").toLowerCase()] || "";
  /* a font file is "in" once the face is ready to draw too (fetched bytes + document.fonts.load: no swap later) */
  const faceOf = src =>{ const m = /baloo2-(\d+)\.woff2$/.exec(src); return m ? m[1] + " 1em 'Baloo 2'" : null; };
  function add(src, tag){
    if(!src || !known(src)) return null;                       // not shipped: never requested (no 404s)
    let it = items.get(src);
    if(it){ if(tag < it.tag) it.tag = tag; return it; }
    it = { src: src, tag: tag, n: seq++, st: 0, size: ASSET_SIZES[src] || 1, cbs: [] };   // st: 0 queued, 1 loading, 2 in
    items.set(src, it); return it;
  }
  function ready(){ if(OFF) return true; if(!items.size) return false; for(const it of items.values()) if(it.st !== 2) return false; return true; }
  function finish(it){
    if(it.st === 2) return;
    if(it.st === 1) active--;
    it.st = 2;
    /* an <img data-src> in index.html that only needs its picture later gets it now (it used to start downloading
       with the page, ahead of the landing's own files) */
    document.querySelectorAll('img[data-src="' + it.src + '"]').forEach(im =>{ im.src = it.src; im.removeAttribute("data-src"); });
    it.cbs.splice(0).forEach(f =>{ try{ f(); }catch(e){} });
    pump();
  }
  function load(it){
    it.st = 1; active++;
    if(!HTTP){ finish(it); return; }
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    let stallT = 0, capT = 0, over = false;
    const end = blob =>{
      if(over) return; over = true; clearTimeout(stallT); clearTimeout(capT);
      if(blob) blobs.set(it.src, blob);
      const face = faceOf(it.src);
      if(!face || !document.fonts || !document.fonts.load) return finish(it);
      const t = setTimeout(()=> finish(it), 3000);
      document.fonts.load(face).then(()=>{ clearTimeout(t); finish(it); }, ()=>{ clearTimeout(t); finish(it); });
    };
    const abort = ()=>{ try{ if(ctl) ctl.abort(); }catch(e){} end(null); };   // stalled / too long: counts as done
    const arm = ()=>{ clearTimeout(stallT); stallT = setTimeout(abort, STALL_MS); };
    capT = setTimeout(abort, it.tag <= CRIT ? CRIT_CAP_MS : CAP_MS); arm();
    fetch(it.src, ctl ? { signal: ctl.signal } : undefined).then(r =>{
      if(!r.ok) throw new Error("HTTP " + r.status);
      const len = +r.headers.get("content-length");
      if(len > 0 && !r.headers.get("content-encoding")) it.size = len;
      const type = typeOf(it.src) || r.headers.get("content-type") || "";
      if(!r.body || !r.body.getReader) return r.blob().then(b => new Blob([b], { type: type }));
      const rd = r.body.getReader(), parts = [];
      const next = ()=> rd.read().then(c =>{
        if(c.done) return new Blob(parts, { type: type });
        parts.push(c.value); arm();
        return next();
      });
      return next();
    }).then(end, ()=> end(null));
  }
  function pump(){
    if(OFF || !started) return;
    let crit = false;
    for(const it of items.values()) if(it.tag <= CRIT && it.st !== 2){ crit = true; break; }
    /* the landing's files (CRIT) and anything a waiting slide asked for (GATE) by tag; the rest smallest first */
    const rank = it => it.tag <= GATE ? it.tag : 0;
    while(active < CONCURRENCY){
      let best = null;
      for(const it of items.values())
        if(it.st === 0 && (!best || rank(it) < rank(best) || (rank(it) === rank(best) && (it.size < best.size || (it.size === best.size && it.n < best.n))))) best = it;
      if(!best || ((crit || hold) && best.tag > CRIT)) return;   // the landing's own files have the line to themselves
      load(best);
    }
  }
  function whenDone(srcs, cb){
    const pend = srcs.map(s => items.get(s)).filter(it => it && it.st !== 2);
    let left = pend.length;
    if(!left){ cb(); return; }
    pend.forEach(it => it.cbs.push(()=>{ if(--left === 0) cb(); }));
  }
  /* the engine art a slide's KIND draws, which its card data does not name: the blocks, the people, the end screen */
  function slideArt(s){
    const d = s.data || {}, out = [], img = f => out.push("assets/" + f + "." + IMG_EXT);
    if(s.type !== "CELEBRATION"){ img("pv_rod11"); img("pv_cube10"); out.push("assets/nudge_hand_new.svg"); }
    [].concat(...(d.people || []).map(p => p.who), ...(d.total ? [d.total.who] : [])).forEach(w => out.push(pvChar(w)));
    (d.count_clips || []).forEach(id => out.push(vo(id)));
    if(s.type === "CELEBRATION"){ img("end_screen"); img("last_swifty_still"); img("last_swifty_end"); out.push(vo("sfx_celebrate")); }
    if(s.phase === "tutorial" && s.type !== "CELEBRATION") img("start_mascot");      // the tutorial card's Swiftie
    return out;
  }
  const PEEK = art("peeking.webp");
  const FONTS = ["assets/fonts/baloo2-800.woff2", "assets/fonts/baloo2-700.woff2", "assets/fonts/baloo2-600.woff2"];
  function gateFiles(phase){ return [PEEK, vo(PHASE_GATE_VO[phase])].filter(Boolean); }
  function init(){
    if(items.size) return;
    /* CRIT: the landing - what the boot loader waits for */
    ["startnew_bg_plain.webp", "start_card.webp", "bg_landing_v3.webp", "pv_rod11.webp", "pv_cube4.webp", "pv_cube10.webp",
     "btn-play-round-waiting.svg", "btn-play-round.svg", "bgdeco_star.svg", "bgdeco_star_o.svg", "bgdeco_spark.svg",
     ...((CARD.landing_hero && CARD.landing_hero.people) || []).map(w => (pvChar(w, true) || pvChar(w)).slice(7)),
     ...PVLanding.files(CARD.landing_hero)].forEach(f => add("assets/" + f, CRIT));
    add(art("new_landing_swiftee_anim.webp"), CRIT);                                // Swiftee's wave (sgMascotPlayer reads its Blob)
    add(FONTS[0], CRIT);                                                            // the title's weight; the others next
    add(vo("vo_landing"), CRIT);
    /* each slide, in lesson order: whenSlide's lists */
    const ids = Object.keys(A.audio || {});
    (CARD.slides || []).forEach((s, i)=>{
      const t = JSON.stringify(s), list = FONTS.slice();                            // (every slide: no text in a fallback face)
      (t.match(/assets\/[\w\/.\-]+\.(?:webp|png|svg|jpg|gif|ogg|mp3)/g) || []).forEach(src => list.push(src));
      ids.forEach(k =>{ if(t.indexOf('"' + k + '"') >= 0) list.push(vo(k)); });
      slideArt(s).forEach(src => list.push(src));
      const prev = CARD.slides[i - 1];
      if(PHASE_GATE_TITLE[s.phase] && (!prev || prev.phase !== s.phase)) gateFiles(s.phase).forEach(src => list.push(src));
      perSlide[i] = [...new Set(list)].filter(known);
      perSlide[i].forEach(src => add(src, i));
    });
    /* ...and EVERY other shipped file: the bar reaches 100% only when the whole lesson is local */
    Object.keys(ASSET_SIZES).forEach(src => add(src, REST));
  }
  /* the spinner: a slide that is still waiting for its own files */
  let waiting = 0;
  function spin(on){
    let el = document.getElementById("assetWait");
    if(!el){ el = document.createElement("div"); el.id = "assetWait"; el.className = "asset-wait"; el.setAttribute("aria-hidden", "true"); document.body.appendChild(el); }
    waiting = Math.max(0, waiting + (on ? 1 : -1));
    el.classList.toggle("show", waiting > 0);
  }
  function whenSlide(i, cb, phase){
    if(OFF || !perSlide[i]){ cb(); return; }
    const srcs = perSlide[i].concat(phase ? gateFiles(phase) : []);
    const pend = srcs.filter(s =>{ const it = items.get(s); return it && it.st !== 2; });
    if(!pend.length){ cb(); return; }
    pend.forEach(s =>{ const it = items.get(s); if(it.st === 0 && it.tag > GATE) it.tag = GATE; });   // jump the queue
    start();
    let fired = false, spun = false;
    const t0 = setTimeout(()=>{ if(!fired){ spun = true; spin(true); } }, 300);
    const go = ()=>{ if(fired) return; fired = true; clearTimeout(t0); clearTimeout(t1); if(spun) spin(false); cb(); };
    const t1 = setTimeout(go, 8000);
    whenDone(pend, go);
  }
  function start(){ if(!started){ started = true; init(); } pump(); }
  /* critical(extra, cb): cb once the landing's own files are in, and the extra promise (Swiftee's wave) has settled */
  function critical(extra, cb){
    init(); hold = true; start();
    const crit = [...items.values()].filter(it => it.tag <= CRIT).map(it => it.src);
    let left = 2; const one = ()=>{ if(--left === 0) release(); };
    const release = ()=>{ if(!hold) return; hold = false; pump(); cb(); };
    whenDone(crit, one);
    if(extra && extra.then) extra.then(one, one); else one();
    setTimeout(release, 10000);                                  // (the boot loader's own watchdog lifts it then too)
  }
  /* blobOf(src): a promise of the file's Blob (null when it could not be fetched) - sgMascotPlayer's one download */
  function blobOf(src){
    return new Promise(res =>{
      if(!HTTP || !known(src)) return res(null);
      init(); const it = items.get(src);
      const give = ()=> res(blobs.get(src) || null);
      if(!it || it.st === 2) give(); else it.cbs.push(give);
    });
  }
  /* url(src): one shared blob: URL of a fetched file, else the file's own path */
  function url(src){
    if(!blobs.has(src)) return src;
    if(!urls.has(src)) urls.set(src, URL.createObjectURL(blobs.get(src)));
    return urls.get(src);
  }
  /* a fresh blob: URL of a fetched animation (it plays from frame 0), else the file with a cache-bust (file://) */
  function fresh(src){ const b = blobs.get(src); return b ? URL.createObjectURL(b) : src + "?r=" + Date.now(); }
  /* ---- blob: swap: an <img>/<audio>/<video> given a fetched file's path shows the local copy instead. Only at the
     moment it is given the path (never a picture already on screen: no flash), and not on the landing card, whose
     pencil rules match its src. data-asset keeps the path (srcOf). A blob: URL that errors goes back, once, to the
     file's own URL (and a playing clip resumes). */
  function swap(el){
    if(!el || el._noBlob || !el.getAttribute) return;
    const s = el.getAttribute("src");
    if(!s || !blobs.has(s) || (el.closest && el.closest("#startGate"))) return;
    el.setAttribute("data-asset", s);
    if(!el._blobFallback){
      el._blobFallback = true;
      el.addEventListener("error", function onErr(){
        if(!/^blob:/.test(el.getAttribute("src") || "")) return;
        el.removeEventListener("error", onErr); el._noBlob = true;
        const playing = el.tagName !== "IMG" && el._wantPlay;
        el.setAttribute("src", el.getAttribute("data-asset"));
        if(playing && el.play) el.play().catch(()=>{});
      });
      if(el.tagName !== "IMG"){ el.addEventListener("play", ()=>{ el._wantPlay = true; }); el.addEventListener("pause", ()=>{ el._wantPlay = false; }); }
    }
    el.setAttribute("src", url(s));
  }
  const SWAP_SEL = "img[src],audio[src],video[src],source[src]";
  if(HTTP && !OFF && typeof MutationObserver === "function"){
    new MutationObserver(recs =>{
      for(const r of recs){
        if(r.type === "attributes"){ if(r.target.matches && r.target.matches(SWAP_SEL)) swap(r.target); continue; }
        r.addedNodes.forEach(n =>{
          if(n.nodeType !== 1) return;
          if(n.matches(SWAP_SEL)) swap(n);
          if(n.firstElementChild) n.querySelectorAll(SWAP_SEL).forEach(swap);
        });
      }
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  }
  return { CRIT: CRIT, GATE: GATE, UI: UI, REST: REST, start: start, critical: critical, whenSlide: whenSlide,
           ready: ready, blob: src => blobs.get(src) || null, blobOf: blobOf, url: url, fresh: fresh };
})();
/* srcOf(el): the file an element shows - its path, even while it plays a blob: URL of it (Assets) */
function srcOf(el){ return el ? (el.getAttribute("data-asset") || el.getAttribute("src") || "") : ""; }

/* ---------- 15. BOOT ---------- */
function boot(){
  /* [14] activity_launched - once, at mount */
  try{ XAPI.once("activity_launched", { skill_code: CARD.skill_code, title: (CARD.title&&CARD.title.en)||"" }); }catch(e){}
  // god-mode visual theme (opt-in via CARD.theme) — warms the whole stage; scoped CSS under .thm-*
  if(CARD.theme) $("stage").classList.add("thm-" + CARD.theme);
  // banner title = skill name only (strip "(भाग…)" and the ": letters" list)
  $("sgTitle").textContent = (CARD.title.hi || "").split(/[:：(]/)[0].trim();
  // VISUAL-FIRST landing hero: SHOW the concept (shapes row / a finger-hand / an image), not just the title text
  (function(){ const hero = CARD.landing_hero, el = $("sgHero"); if(!hero || !el) return;
    if(hero.kind === "concept_strip"){
      // r4/#2: each cell is a .sg-acell (keeps the staggered fingerPop pop-in) wrapping a visual example.
      el.innerHTML = (hero.cells || []).map(c => `<div class="sg-acell">${conceptTileHTML(c)}</div>`).join("");
      /* HI01 PARITY: the early `return` here kept MTG's own landing type scale - 60px title and a
         150px content margin - by skipping the .compact / .has-hero classes every other hero kind
         adds. That is the whole remaining title-size and spacing gap against HI01, which runs the
         42px compact title and a 120px has-hero margin. Falling through instead of returning. */
    }
    if(hero.kind === "shapes" && typeof shapeSVG === "function")
      el.innerHTML = (hero.shapes||[]).map(s=> shapeSVG(s.shape, {color:s.color, size:104, rotate:s.rotate||0})).join("");
    else if(hero.kind === "count"){
      // counting game: preview the WHOLE 1..n sequence — a row of hands (1,2,3…), each with its Arabic numeral
      const hi = Math.min(Math.max(parseInt(hero.n,10)||3, 1), 5);   // clamp to available hand art (1..5)
      let cells = "";
      for(let i=1;i<=hi;i++){
        cells += `<div class="sg-hand-cell">${fingerCount(i, "sg-hand")}<span class="sg-hand-num">${devNumeral(i)}</span></div>`;
      }
      el.innerHTML = cells;
    }
    else if(hero.kind === "image") el.innerHTML = `<img src="${hero.src}" alt="">`;
    else if(hero.kind === "pv_story") el.innerHTML = PVLanding.html(hero);   // [landing pv]
    if(el.innerHTML){ el.classList.add("show"); $("sgTitle").classList.add("compact");
      const c = el.closest && el.closest(".sg-content"); if(c){ c.classList.add("has-hero");
        // SME (S01 review deck): landing reads TITLE first, image BELOW it, image smaller.
        if(hero.title_first) c.classList.add("title-first"); } }
  })();

  // ----- landing-screen welcome VO (lead review) -----
  // A warm greeting on the title screen. Autoplay is often blocked before a gesture, so we also
  // (a) expose a pulsing 🔊 "listen" button, and (b) fire it on the first pointer-down. The whole
  // greeting lives HERE now (not on slide 0), which also kills the old overlap glitch where the
  // landing VO and slide-0 VO could talk over each other.
  const landSrc = (CARD.assets && CARD.assets.audio && CARD.assets.audio["vo_landing"]) || ("assets/voiceover/vo_landing." + AUDIO_EXT);
  /* ---- PLAY BUTTON WAITS FOR THE GREETING, THEN POPS (as HI02H11_L01_S01, the reference game) ----
     While the landing greeting speaks, the play button is shown but DISABLED in its grey waiting art
     (btn-play-blob-waiting.svg) - a bright button that ignores taps reads as broken. When the greeting
     ENDS it swaps to the gold art with a one-shot pop + gold ring (.sg-pop), and becomes tappable.
     If the child then does nothing for 5s it starts the strong idle pulse (.idle-pulse, the reference's
     sgBtnPulseStrong); any tap on the landing restarts that 5s timer.
     "Heard" means the clip really played to its end (voEl.ended). When the browser BLOCKS autoplay the
     button stays grey and the child's first tap - anywhere, the grey button included - starts the
     greeting, so the pop still lands exactly when the greeting ends. Never strands the child: an 18s
     watchdog releases the button even if the greeting never reports back at all.
     NB the waiting state is .sg-waiting + aria-disabled, NOT the disabled attribute - a disabled
     button swallows the tap that has to start a blocked greeting. */
  let _greetingHeard = false, _startIdleT = 0, _startWatchT = 0, _starting = false;
  const onLandingNow = ()=> { const g = $("startGate"); return g && !g.classList.contains("hidden"); };
  const startWaiting = ()=>{ const b = $("sgBtn"); return !b || b.classList.contains("sg-waiting"); };
  const disarmStartPulse = ()=>{ clearTimeout(_startIdleT); _startIdleT = 0; const b = $("sgBtn"); if(b) b.classList.remove("idle-pulse"); };
  const armStartPulse = ()=>{
    disarmStartPulse();
    /* QA checklist 2026-10-05: "the Play button pulsates immediately after the VO is complete" - it starts pulsing as
       its one-shot pop settles (was: only after 5s untouched) */
    _startIdleT = setTimeout(()=>{ const b = $("sgBtn"); if(b && !startWaiting() && onLandingNow()) b.classList.add("idle-pulse"); }, 600);
  };
  const setStartBtnReady = (ready)=>{
    const b = $("sgBtn"); if(!b) return;
    const img = b.querySelector("img");
    const was = !startWaiting();
    b.disabled = false;
    b.classList.toggle("sg-waiting", !ready);
    b.setAttribute("aria-disabled", ready ? "false" : "true");
    if(img) img.src = ready ? "assets/btn-play-round.svg" : "assets/btn-play-round-waiting.svg";   // HI02H11_L01_S01's round play button (review 2026-10-06)
    if(!ready){ disarmStartPulse(); b.classList.remove("sg-pop"); return; }
    if(!was){ b.classList.remove("sg-pop"); void b.offsetWidth; b.classList.add("sg-pop");
      setTimeout(()=> b.classList.remove("sg-pop"), 900); }
    armStartPulse();
  };
  setStartBtnReady(false);   // grey + disabled from first paint, until the greeting has been heard
  /* [landing intro] the gold pop waits for the whole intro too (title words -> cubes -> lines, "sg-intro-done"),
     so the button is the LAST thing to arrive (review 2026-09-29). The 18s watchdog still forces it - never stranded. */
  let _releasePending = false;
  const releaseStart = (force)=>{ if(!force && !window.__sgIntroDone){ _releasePending = true; return; }
    clearTimeout(_startWatchT); _releasePending = false; if(onLandingNow()) setStartBtnReady(true); };
  /* user 2026-10-15 ("play button is coming really late after the animation is complete"): the greeting (6.8s / 10s)
     outlasts the first screen's build (~4s), so the button no longer waits for its end - it pops as the build is done,
     once the greeting is audibly playing (a blocked greeting: still released by its end / the first tap / the watchdog) */
  document.addEventListener("sg-intro-done", ()=>{ if(_releasePending || (!voEl.paused && voEl.currentTime > 0)) releaseStart(); });
  const playLanding = ()=>{
    if(!onLandingNow()) return;
    document.dispatchEvent(new Event("sg-greeting-start"));                  // (the cube row's watchdog counts from here)
    clearTimeout(_startWatchT); _startWatchT = setTimeout(()=> releaseStart(true), 18000);   // watchdog (forces it; 18s: the intro now starts on "आज", ends ~13.5s)
    /* released only when the greeting was really heard; a blocked/failed start leaves it grey for the
       child's first tap (or the watchdog) */
    /* review 2026-10-05: "why is the sound box getting disabled - this should not happen anywhere in the game": the
       speaker is never greyed out (the QA checklist's disabled-while-the-greeting-speaks state is gone). A tap while the
       greeting is still playing is ignored, as on every speaker (replayTap), so it never restarts the line mid-way. */
    play(landSrc, ()=>{ if(voEl.ended){ _greetingHeard = true; releaseStart(); } });
  };
  // any tap on the landing restarts the 5s idle timer (only once the button is live)
  window.addEventListener("pointerdown", ()=>{ if(onLandingNow() && !startWaiting()) armStartPulse(); }, true);
  const sgVo = $("sgVo"); if(sgVo) sgVo.onclick = (e)=>{ e.stopPropagation();
    if(replayTap(null, "landing_chip")) playLanding(); };   // [QA 11] the landing chip reports audio_replayed too
  /* ---- [landing mascot player] (review 2026-09-29: "swifty is getting glitched ... at the starting only"). Measured
     on the landing with a frame-by-frame screen recording: in about half the loads Chrome paints NOTHING where Swifty
     is for 1-2 frames, exactly when the <img>'s animated WebP (alpha) steps to its next frame while the landing
     is busy starting up - with the original HI01 file too. A canvas cannot blink like that: it keeps its last picture
     until the next one is drawn. So where the browser can decode the file itself (WebCodecs ImageDecoder), Swifty is
     drawn on a canvas at its displayed size, the next frame always decoded ahead. Anything missing or failing (no
     ImageDecoder, a decode error, not ready when the loader lifts) keeps the plain <img> and its restart below.
     [loading] ONE download (2026-10-01): the clip used to be fetched for the decoder AND pulled by the <img src> beside
     it - 1.6MB twice on the landing's critical path, and once more by the ?r= restart. The <img> has only a data-src
     now: the file is fetched once (index.html starts it with the page, on http(s)), the decoder reads those bytes,
     and the <img> path shows them as a blob: URL. file:// can't fetch(): there the plain <img src>, as before.
     `ready` settles once Swiftee can be shown - one of the things the boot loader waits for. ---- */
  const sgMascotPlayer = (()=>{
    const img = document.querySelector(".sg-mascot");
    if(!img) return null;
    const url = img.getAttribute("data-src") || (img.getAttribute("src") || "").split("?")[0], TYPE = "image/webp";
    let dec = null, count = 0, first = null, ok = false, dead = false, blob = null, blobUrl = "", pending = true;
    const shown = ()=> new Promise(res =>{
      if(img.complete && img.naturalWidth) return res();
      img.onload = ()=> res(); img.onerror = ()=>{ img.style.display = "none"; res(); };
    });
    const show = src =>{ img.removeAttribute("data-src"); img.src = src; return shown(); };
    const ready = (async ()=>{                                     // fetch + decode start at once, under the loader
      let buf = null;
      try{ const b = await Assets.blobOf(url); if(b){ blob = new Blob([b], { type: TYPE }); buf = await blob.arrayBuffer(); } }catch(e){}   // the loader's one download (Assets, CRIT)
      if(!buf){ pending = false; return show(url); }
      try{
        if(typeof ImageDecoder !== "undefined" && !(ImageDecoder.isTypeSupported && !(await ImageDecoder.isTypeSupported(TYPE)))){
          dec = new ImageDecoder({ data: buf, type: TYPE });
          await dec.tracks.ready; count = dec.tracks.selectedTrack.frameCount;
          first = (await dec.decode({ frameIndex: 0 })).image;
          ok = count > 0 && !dead;
        }
      }catch(e){ ok = false; }
      pending = false;
      if(!ok) return show(blobUrl = URL.createObjectURL(blob));
    })().catch(()=>{ ok = false; pending = false; });
    function start(){                                              // the loader lifting; false = keep the <img>
      if(!ok || !img.isConnected){ dead = true; return false; }
      try {
        const r = img.getBoundingClientRect(), W = Math.max(1, Math.round(r.width * (window.devicePixelRatio || 1)));
        const H = Math.max(1, Math.round(W * first.displayHeight / first.displayWidth));
        const cv = document.createElement("canvas"); cv.className = img.className; cv.width = W; cv.height = H;
        cv.setAttribute("role", "img"); cv.setAttribute("aria-label", img.getAttribute("alt") || "");
        const ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
        const draw = f => { ctx.clearRect(0, 0, W, H); ctx.drawImage(f, 0, 0, W, H); };   // one task: never shown half-drawn
        draw(first); img.replaceWith(cv);
        let i = 0, cur = first, due = performance.now() + (cur.duration || 90000) / 1000;   // VideoFrame.duration is in us
        let next = count > 1 ? dec.decode({ frameIndex: 1 }) : null;
        const step = async ()=>{
          if(!next){ cur.close(); dec.close(); return; }             // plays once: the last frame stays drawn
          let n; try { n = (await next).image; } catch(e){ return; }  // a failed decode: the frame on show simply stays
          const wait = due - performance.now();
          if(wait > 1) await new Promise(res => setTimeout(res, wait));
          draw(n); cur.close(); cur = n; i++;
          due = Math.max(due, performance.now() - 30) + (n.duration || 90000) / 1000;
          next = i + 1 < count ? dec.decode({ frameIndex: i + 1 }) : null;   // decoded while this one is on show
          step();
        };
        step();
        return true;
      } catch(e){ dead = true; return false; }
    }
    /* the plain <img>: the wave from frame 0 again - a fresh blob: URL of the same bytes (file://: a cache-bust of the
       local file). Still downloading (the watchdog lifted the loader first): it shows from frame 0 when it lands. */
    function restart(){
      if(!img.isConnected || pending) return;
      const old = blobUrl;
      if(blob){ img.src = blobUrl = URL.createObjectURL(blob); if(old) URL.revokeObjectURL(old); }
      else img.src = url + "?r=" + Date.now();
    }
    return { start, restart, ready };
  })();
  // ---- [engine JS] r4/P2 boot loader: the loader until the LANDING's own files are in (Assets: CRIT + Swiftee's wave),
  // then it dismisses ITSELF into the landing (NO tap gate) - the rest of the lesson keeps loading behind the landing.
  // A 10s watchdog never strands the child; .done dedups the two. The same handler adds body.loaded (unblocks the
  // concept-strip stagger) and fires the landing VO. play() absorbs an autoplay block; the pulsing 🔊 chip is the fallback.
  // ===== QA CHECKLIST [02]: PRELOAD BEFORE THE START SCREEN - since 2026-10-01 only what the START SCREEN shows. It
  // used to be every image and clip of the lesson ([loading], Assets); each slide now waits for its own files instead
  // (mountSlide), so art and VO still never pop in mid-lesson. A FAILED ASSET COUNTS AS DONE: a 404 never strands. ----
  (function(){
    const bl = $("bootLoader");
    if(!bl){ document.body.classList.add("loaded"); playLanding(); Assets.start(); return; }
    const ready = ()=>{
      if(bl.classList.contains("done")) return;   // the files + the watchdog both land here → dedup
      bl.classList.add("done");
      document.body.classList.add("loaded");       // starts the .sg-acell pop chain
      /* [QA 03] the landing wave plays ONCE (the .webp's loop count is 1). It decodes under the loader, so without a
         restart the one wave would be spent before the child sees it: the moment the loader lifts it starts again
         from frame 0 - on the canvas player, or a fresh blob: URL of the same bytes (no second download). */
      if(sgMascotPlayer && !sgMascotPlayer.start()) sgMascotPlayer.restart();
      playLanding();
      setTimeout(()=> bl.remove(), 450);
    };
    Assets.critical(sgMascotPlayer && sgMascotPlayer.ready, ready);
    setTimeout(ready, 10000);   // hard watchdog: never strand the child on the loader
  })();
  // landing VO best-effort on first interaction too (some browsers block autoplay pre-gesture)
  /* ...but not when the greeting has already been heard or is playing now, and never on the play button
     itself - tapping the live gold button used to restart the greeting a split second before its click
     silenced it again. */
  window.addEventListener("pointerdown", function once(ev){ window.removeEventListener("pointerdown", once);
    if(ev && ev.target && ev.target.closest && ev.target.closest("#sgBtn")) return;
    if(!_greetingHeard && !isPlaying) playLanding(); }, { once:true });

  $("sgBtn").onclick = ()=>{
    if(startWaiting()){                 // still waiting for the greeting: a tap can only START it
      if(!_greetingHeard && !isPlaying) playLanding();
      return;
    }
    if(_starting) return;  // a second tap while slide 0's files finish loading
    disarmStartPulse(); clearTimeout(_startWatchT);
    stopAudio();          // silence the landing greeting BEFORE slide 0 speaks (no VO overlap)
    sfxPlay();            // QA checklist 2026-10-05: the standard play button SFX
    bgmStart();           // ...and the background music starts on this tap (never before it)
    _ac();                // unlock/resume WebAudio on the start gesture so the first clip never clips
    Screen.fullscreen();  // [responsive] a phone/tablet browser: the whole screen, held in landscape (Android)
    // [engine JS] r4/P1: peek gate into the tutorial. The landing stays visible-and-BLURRED behind the
    // peeking Swiftie + "चलिए शुरू करें"; it hides once the tutorial mounts (in the callback).
    // [loading] the gate's Swiftie and slide 0 are almost always in long before this tap; if not, a spinner holds here.
    _starting = true;
    Assets.whenSlide(0, ()=>{
      _gatedPhases.add("tutorial");
      phaseBlurTransition(()=>{
        _starting = false;
        $("startGate").classList.add("hidden");
        document.body.classList.remove("is-start");   // blue bg only on the title screen
        mountSlide(0);
      }, "tutorial");
    }, "tutorial");
  };

  // tapping आगे clears any pending nav-nudge, and sounds the standard next-button SFX
  $("navBtn").addEventListener("click", ()=>{ clearTimeout(state.navNudgeTimer); stopNudge(); sfxNext(); });
  /* [12][14] QA CHECKLIST: "hint_used event fires on every bulb tap." Each slide
     module rebinds $("hintBtn").onclick with its own `if(state.locked ...) return`
     guard, and only two of those seven handlers ever emitted hint_shown - so most
     bulb taps sent nothing. This capture-phase listener sits ahead of all of them
     and is the single place the verb is raised. */
  $("hintBtn").addEventListener("click", ()=>{
    const sl = CARD.slides[state.idx] || {};
    state.hintUsed = true;
    try{ XAPI.send("hint_used", { slide_id: sl.id, phase: sl.phase, type: sl.type },
                   { attempt: state.attempts }); }catch(e){}
  }, true);
  // [engine JS] r4 dev jump: ?slide=N skips the loader+gate and mounts slide N directly (QA/capture only)
  (function(){
    const j = parseInt(new URLSearchParams(location.search).get("slide"), 10);
    if(isNaN(j)) return;
    const bl = $("bootLoader"); if(bl) bl.remove();
    document.body.classList.add("loaded");
    $("startGate").classList.add("hidden");
    document.body.classList.remove("is-start");
    mountSlide(Math.max(0, Math.min(j, CARD.slides.length - 1)));
  })();
  // when the web font finishes loading, re-centre glyphs (metrics change vs fallback)
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=> centerAllGlyphs()); }
  // dev banner if ?dev=1 — show empty initially
  /* [QA 01] ?dev=1 JUMP PANEL. This engine revision shipped the dev BANNER but
     never the slide navigator - HI01 gained it in a later block (its line 7503)
     that MTG predates, which is why ?dev=1 looked like it "did nothing" here.
     buildDevNav() is ported verbatim; ?nav=1 is accepted too, as in HI01. */
  if(new URLSearchParams(location.search).has("dev") || new URLSearchParams(location.search).has("nav")){
    $("devBanner").textContent = "engine ready · slides=" + CARD.slides.length;
    $("devBanner").className = "dev-banner show";
    buildDevNav();
  }
}
/* ===== FLN ANIMATION KIT: core BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion = window.FLNMotion || {};
  M.still = function(){
    try{ return document.documentElement.classList.contains("no-anim") ||
      (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch(_){ return false; }
  };
  M.scale = function(){
    try{ return parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue("--scale")) || 1; }catch(_){ return 1; }
  };
  M.rect = function(r, sw){                    // screen rect -> stage coords (R1/R2)
    var s = M.scale();
    if(document.documentElement.classList.contains("rotated")){
      return { left:(r.top - sw.top)/s, top:(sw.right - r.right)/s, w:r.height/s, h:r.width/s };
    }
    return { left:(r.left - sw.left)/s, top:(r.top - sw.top)/s, w:r.width/s, h:r.height/s };
  };
  M.guard = function(fn){                      // R4
    try{ fn(); }catch(e){ try{ console.warn("[animation-kit]", e && e.message); }catch(_){} }
  };
  var _actx = null;
  M.audio = function(){
    try{
      var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
      _actx = _actx || new AC();
      if(_actx.state === "suspended") _actx.resume();
      return _actx;
    }catch(_){ return null; }
  };
  M.ready = function(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };
})();
/* ===== FLN ANIMATION KIT: core END ===== */

/* ===== FLN ANIMATION KIT: sky-drift BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;

  function build(o){
    var sky = typeof o.container === "string" ? document.querySelector(o.container) : o.container;
    if(!sky) return null;
    sky.textContent = "";
    var maxSize = 0, frag = document.createDocumentFragment();

    /* [landing card clear] every lane STARTS just outside the centre card, never behind it.
       The sky and the card share the viewport centre (body flex-centres the stage, the gate
       flex-centres the card), so per lane: distance from centre to where the ray leaves the
       card box (1114x456 design px x --scale) + the element's half-size + a gap, in vmax.
       Before this every star launched at a flat r0 = 22vmax - well inside the card - and slid
       out from under it. */
    var clear = null;
    if(o.avoid && document.querySelector(o.avoid)){
      var sc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
      var vmaxPx = Math.max(document.documentElement.clientWidth, document.documentElement.clientHeight) / 100 || 1;
      clear = { hw:(o.avoidBox[0] / 2) * sc / vmaxPx, hh:(o.avoidBox[1] / 2) * sc / vmaxPx, gap:o.avoidGap * sc / vmaxPx };
    }
    function startR(cos, sin, size){
      if(!clear) return o.r0;
      var t = Math.min(Math.abs(cos) > 1e-6 ? clear.hw / Math.abs(cos) : Infinity,
                       Math.abs(sin) > 1e-6 ? clear.hh / Math.abs(sin) : Infinity);
      return Math.max(o.r0, t + size * 0.75 + clear.gap);   // 0.75: half-size + the glow halo
    }

    o.layers.forEach(function(L, li){
      for(var i = 0; i < o.lanes; i++){
        var a = ((360 / o.lanes) * i + L.rot) * Math.PI / 180;
        var cos = Math.cos(a), sin = Math.sin(a);
        var size = +((o.size[0] + Math.random() * (o.size[1] - o.size[0])) * L.scale).toFixed(2);
        if(size > maxSize) maxSize = size;
        var dur = +(o.dur[0] + Math.random() * (o.dur[1] - o.dur[0])).toFixed(1);
        var el = document.createElement("i"), r0 = startR(cos, sin, size);
        el.className = o.shapes[(i + li) % o.shapes.length];
        el.style.cssText =
          "--s:"  + size + "vmax;" +
          "--x1:" + (r0 * cos).toFixed(2) + "vmax;--y1:" + (r0 * sin).toFixed(2) + "vmax;" +
          "--x2:" + (o.r1 * cos).toFixed(2) + "vmax;--y2:" + (o.r1 * sin).toFixed(2) + "vmax;" +
          "--t:"  + dur + "s;" +
          "--d:-" + (Math.random() * dur).toFixed(1) + "s;" +     // negative = de-sync
          "--g:"  + (o.glow[0] + Math.random() * (o.glow[1] - o.glow[0])).toFixed(1) + "s;" +
          "--gd:-" + (Math.random() * 4).toFixed(1) + "s;" +
          "--o:"  + (o.opacity[0] + Math.random() * (o.opacity[1] - o.opacity[0])).toFixed(2) + ";";
        frag.appendChild(el);
      }
    });
    sky.appendChild(frag);

    // collision proof: lane arc at the tightest radius must be >= 1.5x the largest element
    var arc = (2 * Math.PI * o.r0) / o.lanes, ok = arc >= maxSize * 1.5;
    if(!ok && o.warn !== false){
      console.warn("[animation-kit] sky lanes too tight: arc " + arc.toFixed(2) +
        "vmax vs element " + maxSize.toFixed(2) + "vmax. Reduce lanes or size.");
    }
    return { arc:arc, maxSize:maxSize, safe:ok, count:sky.children.length };
  }

  M.sky = {
    defaults: {
      container:".sg-sky", lanes:29,
      layers:[{rot:0,scale:1},{rot:6.2,scale:0.62},{rot:-6.2,scale:0.55}],
      r0:22, r1:72, size:[0.8,2.6], dur:[18,34], glow:[3.0,4.8],
      opacity:[0.62,0.92], shapes:["s1","s2","s3","s4","s5"], warn:true,
      avoid:".sg-card", avoidBox:[1114,456], avoidGap:24   // [landing card clear] design px
    },
    init: function(opts){
      var o = Object.assign({}, this.defaults, opts || {}), res = null;
      this._last = opts;
      M.guard(function(){ res = build(o); });
      return res;
    }
  };
  M.ready(function(){ M.guard(function(){ if(!window.__skyManual) M.sky.init(); }); });
  /* the card's size in vmax changes with aspect ratio (rotation, split-screen), so re-plan the
     lanes after a resize settles - otherwise start points drift back inside the card. */
  var skyRz = 0;
  window.addEventListener("resize", function(){
    clearTimeout(skyRz);
    skyRz = setTimeout(function(){ M.guard(function(){ if(!window.__skyManual) M.sky.init(M.sky._last); }); }, 250);
  });
})();
/* ===== FLN ANIMATION KIT: sky-drift END ===== */

/* ===== FLN ANIMATION KIT: sky-burst BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;

  function boom(o){                      // sine thud + noise tail + square crackles
    var actx = M.audio(); if(!actx) return;
    try{
      var t = actx.currentTime, out = actx.createGain();
      out.gain.value = o.volume; out.connect(actx.destination);

      var tg = actx.createGain();
      tg.gain.setValueAtTime(0.9, t);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      tg.connect(out);
      var osc = actx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
      osc.connect(tg); osc.start(t); osc.stop(t + 0.18);

      var n = actx.sampleRate * 0.45;
      var buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      for(var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
      var src = actx.createBufferSource(); src.buffer = buf;

      for(var c = 0; c < o.crackles; c++){
        var cg = actx.createGain(), ct = t + 0.10 + Math.random() * 0.30;
        cg.gain.setValueAtTime(0.0001, ct);
        cg.gain.exponentialRampToValueAtTime(0.18, ct + 0.006);
        cg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.07);
        cg.connect(out);
        var co = actx.createOscillator();
        co.type = "square";
        co.frequency.setValueAtTime(1500 + Math.random() * 2200, ct);
        co.connect(cg); co.start(ct); co.stop(ct + 0.08);
      }
      var bp = actx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 3400; bp.Q.value = 0.8;
      var ng = actx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      src.connect(bp); bp.connect(ng); ng.connect(out); src.start(t + 0.02);
    }catch(_){}
  }

  function pop(el, r, o){
    el.classList.add("popped");
    // respawn on the next FLIGHT lap - the glow cycle is much shorter, so filter by name
    el.addEventListener("animationiteration", function back(e){
      if(e.animationName !== "sgFly") return;
      el.classList.remove("popped");
      el.removeEventListener("animationiteration", back);
    });

    var kind = "k-dot", cls = el.classList;
    for(var ci = 0; ci < cls.length; ci++){ if(o.kind[cls[ci]]) kind = o.kind[cls[ci]]; }

    var bs = Math.max(11, r.width);
    var b = document.createElement("div");
    b.className = "sg-burst " + kind;
    b.style.left = (r.left + r.width / 2) + "px";
    b.style.top  = (r.top  + r.height / 2) + "px";
    b.style.setProperty("--bs", bs + "px");
    b.appendChild(document.createElement("div")).className = "fl";

    var k = 0;
    for(var g = 0; g < o.rings.length; g++){
      var R = o.rings[g], off = Math.random() * Math.PI * 2;
      for(var i = 0; i < R.n; i++, k++){
        var a = off + i / R.n * Math.PI * 2;
        var dist = bs * R.rad * (0.78 + Math.random() * 0.44);
        var p = document.createElement("i");
        p.style.cssText =
          "--ps:"  + (bs * R.size * (0.8 + Math.random() * 0.5)).toFixed(1) + "px;" +
          "--dx:"  + (Math.cos(a) * dist).toFixed(1) + "px;" +
          "--dy:"  + (Math.sin(a) * dist).toFixed(1) + "px;" +
          "--gy:"  + (dist * o.gravity).toFixed(1) + "px;" +
          "--sd:"  + (R.dur + Math.random() * 0.22).toFixed(2) + "s;" +
          "--sdl:" + (Math.random() * 0.06).toFixed(3) + "s;" +
          "color:" + o.hues[k % o.hues.length];
        b.appendChild(p);
      }
    }
    document.body.appendChild(b);
    if(o.sound) boom(o);
    setTimeout(function(){ b.remove(); }, o.life);
  }

  M.skyBurst = {
    defaults: {
      container:".sg-sky", when:["is-start","is-end"],
      rings:[{n:9,rad:3.1,size:.58,dur:.80},{n:7,rad:1.8,size:.78,dur:.62}],
      hues:["#FCB717","#3B7DD8","#21A74A","#E5484D","#7048D6","#F1781D"],
      kind:{s1:"k-star",s2:"k-star",s3:"k-spark",s4:"k-dot",s5:"k-dot"},
      gravity:0.42, pad:12, padRatio:0.7, minAlpha:0.08, life:1200,
      sound:true, volume:0.22, crackles:4
    },
    init: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        var sky = typeof o.container === "string"
          ? document.querySelector(o.container) : o.container;
        if(!sky) return;
        // capture phase: .sg-sky is pointer-events:none, so hit-test by rect (R6)
        document.addEventListener("pointerdown", function(e){
          if(M.still()) return;
          if(!o.when.some(function(c){ return document.body.classList.contains(c); })) return;
          var els = sky.querySelectorAll("i:not(.popped)");
          for(var i = 0; i < els.length; i++){
            var el = els[i], r = el.getBoundingClientRect();
            if(r.width < 2) continue;
            var pad = Math.max(o.pad, r.width * o.padRatio);   // ~4px targets need slack
            if(e.clientX < r.left - pad || e.clientX > r.right  + pad ||
               e.clientY < r.top  - pad || e.clientY > r.bottom + pad) continue;
            if(parseFloat(getComputedStyle(el).opacity) < o.minAlpha) continue;
            // claim the tap, or it also fires the button under the star
            e.stopPropagation(); e.preventDefault();
            pop(el, r, o);
            return;
          }
        }, true);
      });
    }
  };
  M.ready(function(){ M.guard(function(){ M.skyBurst.init(); }); });
})();
/* ===== FLN ANIMATION KIT: sky-burst END ===== */

/* ===== FLN ANIMATION KIT: still-switch BEGIN ===== */
/* R5, second half. The kit's M.still() and the shipped starBurst both READ
   html.no-anim, but nothing in this activity ever SET it and there was no
   ?still=1 handler at all - so the kill-switch was unreachable. */
(function(){ "use strict";
  try{
    var q = new URLSearchParams(location.search);
    if(q.has("still") || (window.matchMedia &&
       matchMedia("(prefers-reduced-motion: reduce)").matches)){
      document.documentElement.classList.add("no-anim");
    }
  }catch(_){}
})();
/* ===== FLN ANIMATION KIT: still-switch END ===== */

/* ===== FLN ANIMATION KIT: nudge BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function place(el, o){
    var nh = document.getElementById(o.hand); if(!nh || !el) return;
    var host = document.querySelector(o.host); if(!host) return;
    var r = el.getBoundingClientRect(), sw = host.getBoundingClientRect(), s = M.scale();
    nh.style.left = ((r.left - sw.left)/s + r.width/s/2 + o.dx) + "px";
    nh.style.top  = ((r.top  - sw.top )/s + r.height/s   + o.dy) + "px";
    nh.classList.add("show");
  }
  M.nudge = {
    defaults:{ hand:"nudgeHand", host:".slide-stage", dx:-34.2, dy:-7.8, oneHand:true },   /* [QA 12] fingertip 8px below target */
    pointAt: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        if(o.oneHand) document.querySelectorAll(".demo-hand").forEach(function(h){ h.remove(); });
        place(el, o);
      });
    },
    after: function(target, ms, opts){            // returns cancel()
      var o = Object.assign({}, this.defaults, opts || {}), t = null;
      M.guard(function(){
        if(!ms || M.still()) return;
        t = setTimeout(function(){
          var el = (typeof target === "string") ? document.querySelector(target) : target;
          if(el) place(el, o);
        }, ms);
      });
      return function(){ clearTimeout(t); };
    },
    hide: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      var nh = document.getElementById(o.hand); if(nh) nh.classList.remove("show");
    }
  };
})();
/* ===== FLN ANIMATION KIT: nudge END ===== */

/* ===== FLN ANIMATION KIT: confetti BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function rnd(a, b){ return a + Math.random() * (b - a); }

  M.confetti = {
    defaults: {
      host:".stage-inner", count:80, stagger:0.35,
      fall:[1.1,1.8], drift:45, sway:[10,34], bob:[3,7],
      rockT:[0.6,1.2], tumbleT:[0.75,1.5], tumbleShare:0.22,
      amp:[28,52], yaw:30, depth:[0.75,1.15], tilt:25,
      /* weighted: star 40%, rectangle 20%, line 20%, square 20%.
         Repeat an entry to weight it - the array is sampled uniformly. */
      shapes:["st","st","st","st","rc","rc","ln","ln","sq","sq"],
      /* VIBGYOR. Front/back pairs - the back is the SAME hue darkened, never a
         different hue, or it reads as two pieces flickering instead of one turning. */
      colors:[["#8B2FC9","#5E1C8C"],   /* violet */
              ["#3F51B5","#27358A"],   /* indigo */
              ["#1E88E5","#135FA6"],   /* blue   */
              ["#22B24C","#157A34"],   /* green  */
              ["#FFD21E","#D9A800"],   /* yellow */
              ["#FF8A1E","#C75F00"],   /* orange */
              ["#E5322D","#A81F1B"]],  /* red    */
      phases:["guided","practice","mastery"]   /* [] disables phase gating */
    },
    burst: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        /* confetti ONLY on activity phases - never tutorials, demos, landing, transitions */
        if(o.phases.length && o.phase && o.phases.indexOf(o.phase) < 0) return;
        var host = document.querySelector(o.host); if(!host) return;

        var dist = host.clientHeight + 60, maxLife = 0;
        var wrap = document.createElement("div");
        wrap.className = "fx-confetti";

        for(var i = 0; i < o.count; i++){
          var z     = rnd(o.depth[0], o.depth[1]);        /* depth */
          var fall  = rnd(o.fall[0], o.fall[1]) / z;      /* nearer = bigger = faster */
          var delay = rnd(0, o.stagger);
          if(fall + delay > maxLife) maxLife = fall + delay;
          var pair = o.colors[i % o.colors.length];
          /* most pieces flutter (face stays visible); a minority go end-over-end */
          /* Two regimes, and a real plate moves DIFFERENTLY in each:
             flutter = zigzags hard, almost no net sideways drift;
             tumble  = autorotation gives a steady lateral force, so it barely
                       zigzags but drifts consistently to one side. */
          var flutter = Math.random() > o.tumbleShare;
          var rockT   = flutter ? rnd(o.rockT[0], o.rockT[1])
                                : rnd(o.tumbleT[0], o.tumbleT[1]);
          var sway    = flutter ? rnd(o.sway[0], o.sway[1]) : rnd(2, 8);
          var drift   = flutter ? rnd(-o.drift/2.5, o.drift/2.5) : rnd(-o.drift, o.drift);
          var bob     = flutter ? rnd(o.bob[0], o.bob[1]) : rnd(2, 4);

          /* set every property once - they inherit down to .w and .f */
          var p = document.createElement("i"); p.className = "p";
          p.style.cssText =
            "--x:"     + rnd(-2, 98).toFixed(1) + "%;" +
            "--dist:"  + dist + "px;" +
            "--fall:"  + fall.toFixed(2) + "s;" +
            "--delay:" + delay.toFixed(2) + "s;" +
            "--drift:" + drift.toFixed(0) + "px;" +
            "--sway:"  + sway.toFixed(0) + "px;" +
            "--bob:"   + bob.toFixed(1) + "px;" +
            "--rockT:" + rockT.toFixed(2) + "s;" +
            /* capped short of 90deg: even at max tilt the face still reads */
            "--amp:"   + Math.round(rnd(o.amp[0], o.amp[1])) + "deg;" +
            "--yaw:"   + Math.round(rnd(-o.yaw, o.yaw)) + "deg;" +
            "--tilt:"  + Math.round(rnd(-o.tilt, o.tilt)) + "deg;" +
            "--z:"     + z.toFixed(2) + ";" +
            "--dim:"   + (0.72 + (z - o.depth[0]) /
                          (o.depth[1] - o.depth[0]) * 0.28).toFixed(2) + ";" +
            /* shapes stay legible by ASPECT RATIO, not size - see the shape table */
            "--c:"     + pair[0] + ";--c2:" + pair[1] + ";";

          var w = document.createElement("i"); w.className = "w";
          var f = document.createElement("i");
          f.className = "f " + o.shapes[Math.floor(Math.random() * o.shapes.length)] +
                        (flutter ? "" : " tum");
          w.appendChild(f); p.appendChild(w); wrap.appendChild(p);
        }
        host.appendChild(wrap);
        /* lifetime is computed, not hard-coded - a longer fall cannot be cut off */
        setTimeout(function(){ wrap.remove(); }, (maxLife + 0.3) * 1000);
      });
    },
    /* stops a slide advancing mid-celebration. 8s safety cap. */
    after: function(fn){
      var started = Date.now();
      (function check(){
        if(!document.querySelector(".fx-confetti") || Date.now() - started > 8000){ fn(); return; }
        setTimeout(check, 200);
      })();
    }
  };
})();
/* ===== FLN ANIMATION KIT: confetti END ===== */

/* ===== FLN ANIMATION KIT: star-burst BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  M.starBurst = {
    defaults:{ host:"#confetti", w:1333, h:750,
      colors:["#FFE400","#FFBD00","#E89400","#FFCA6C","#FDFFB8"],
      /* retuned: fewer, slower, longer. Travel distance is held at ~547px so the
         burst still fills the same area - only the density and pace changed. */
      ticks:150, decay:0.975, startV:14, shots:[0,220,440], spin:0.18,
      stars:32, starScale:1.8, circles:8, circleScale:1.0 },
    fire: function(opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(M.still()) return;
        var host = document.querySelector(o.host); if(!host) return;
        var cv = document.createElement("canvas");
        cv.width = o.w; cv.height = o.h;                 // design grid, scaled by CSS
        cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
        host.appendChild(cv);
        var ctx = cv.getContext("2d"), parts = [];

        function starPath(r){
          ctx.beginPath();
          for(var i = 0; i < 10; i++){
            var rad = (i % 2 === 0) ? r : r/2, a = Math.PI/5*i - Math.PI/2;
            ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a)*rad, Math.sin(a)*rad);
          }
          ctx.closePath();
        }
        function add(n, scalar, shape){
          for(var i = 0; i < n; i++){
            var a = Math.random()*Math.PI*2;
            parts.push({ x:cv.width/2, y:cv.height/2, ax:Math.cos(a), ay:Math.sin(a),
              vel:o.startV*(0.5 + Math.random()), tick:0, scalar:scalar, shape:shape,
              color:o.colors[Math.floor(Math.random()*o.colors.length)],
              rot:Math.random()*Math.PI*2, spin:(Math.random()-.5)*o.spin });
          }
        }
        function shoot(){ add(o.stars, o.starScale, "star"); add(o.circles, o.circleScale, "circle"); }
        o.shots.forEach(function(ms){ ms ? setTimeout(shoot, ms) : shoot(); });

        /* derived from the LAST shot, so retiming the shots cannot end the loop
           before they have all fired. A hard-coded 30 breaks if shots move later. */
        var minFrames = Math.max.apply(null, o.shots) / 16 + 20;
        var frames = 0;
        (function frame(){
          ctx.clearRect(0, 0, cv.width, cv.height);
          var alive = false;
          for(var i = 0; i < parts.length; i++){
            var p = parts[i];
            if(p.tick >= o.ticks) continue;
            alive = true;
            p.x += p.ax*p.vel; p.y += p.ay*p.vel; p.vel *= o.decay;
            p.rot += p.spin; p.tick++;
            ctx.globalAlpha = 1 - p.tick/o.ticks;
            ctx.fillStyle = p.color;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            if(p.shape === "star"){ starPath(8*p.scalar); ctx.fill(); }
            else { ctx.beginPath(); ctx.arc(0, 0, 6*p.scalar, 0, Math.PI*2); ctx.fill(); }
            ctx.restore();
          }
          frames++;
          if(alive || frames < minFrames) requestAnimationFrame(frame);  // survive delayed shots
          else setTimeout(function(){ cv.remove(); }, 300);
        })();
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: star-burst END ===== */

/* ===== FLN ANIMATION KIT: correct-select BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function mk(cls){ var i = document.createElement("i"); i.className = cls; return i; }

  /* Every deferred step is parked ON THE TILE so clear() can cancel it. Without this
     a second play inherits the FIRST play's pending timers and they strip the state
     off the new beat part-way through. Owning the timers is what makes these safely
     re-fireable, which the 2-attempt ladder needs. */
  function later(el, fn, ms){ (el._selT = el._selT || []).push(setTimeout(fn, ms)); }

  /* Tempo lives in CSS (--fx-beat / --fx-reward) so the two effects cannot drift
     apart. JS reads it rather than keeping a second copy, and only writes --ckT or
     --wgT when a caller explicitly passes `dur`. Custom properties do not resolve
     calc(), so the two numbers are read and multiplied here rather than reading
     the composed value. */
  function tempo(el){
    var cs = getComputedStyle(el);
    function num(p, d){
      var v = parseFloat(cs.getPropertyValue(p));
      if(!v && v !== 0) return d;
      return v > 20 ? v / 1000 : v;              /* tolerate ms as well as s */
    }
    var beat = num("--fx-beat", 0.4);
    return { beat: beat, reward: beat * (parseFloat(cs.getPropertyValue("--fx-reward")) || 2) };
  }

  M.answer = {
    clear: function(el){
      if(!el) return;
      if(el._selT){ for(var j = 0; j < el._selT.length; j++) clearTimeout(el._selT[j]); }
      el._selT = [];
      el.classList.remove("ck-correct", "wg-wrong", "wg-out", "wg-rel");
      var fx = el.querySelectorAll(".ck-fx,.wg-fx");
      for(var i = 0; i < fx.length; i++) fx[i].remove();
    }
  };

  M.correctSelect = {
    defaults:{ crown:5 },      /* dur comes from CSS unless you pass one */
    play: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;                 /* forced reflow - restarts the pop */
        var dur = o.dur || tempo(el).reward;            /* CSS owns the tempo */
        if(o.dur) el.style.setProperty("--ckT", dur + "s");

        var fx = mk("ck-fx");

        if(o.crown && !M.still()){
          var cr = mk("ck-crown");
          /* clientWidth is layout px INSIDE the scaled stage - design px already.
             getBoundingClientRect() would come back multiplied by --scale (R1). */
          var w = el.clientWidth || 96, h = el.clientHeight || 96;
          var rx = w * 0.46, ry = h * 0.46;               /* the tile's own edge */
          for(var i = 0; i < o.crown; i++){
            var t  = (o.crown === 1) ? 0.5 : i / (o.crown - 1);
            var a  = (-158 + t * 136 + rnd(-7, 7)) * Math.PI / 180;   /* TOP arc */
            var x0 = Math.cos(a) * rx, y0 = Math.sin(a) * ry;
            var out = rnd(.20, .34);
            var s = mk("");
            s.style.cssText =
              "--ss:" + rnd(7, 12).toFixed(1) + "px;" +
              "--x0:" + x0.toFixed(1) + "px;" +
              "--y0:" + y0.toFixed(1) + "px;" +
              "--sx:" + (x0 + Math.cos(a) * w * out).toFixed(1) + "px;" +
              "--sy:" + (y0 + Math.sin(a) * h * out).toFixed(1) + "px;" +
              "--sr:" + Math.round(rnd(-140, 140)) + "deg;";
            cr.appendChild(s);
          }
          fx.appendChild(cr);
        }

        /* class FIRST: the border and the pop are the feedback, and they must not
           wait on ~9 nodes of decoration being built. Measured 45ms of dead time
           before any pixel moved when this ran the other way round. */
        el.classList.add("ck-correct");
        el.appendChild(fx);
        /* Only the TRANSIENT layers are swept. .ck-correct stays: the green outline
           is the correct-mark and it belongs to the tile until the slide advances. */
        later(el, function(){
          var t = fx.querySelectorAll(".ck-crown");
          for(var i = 0; i < t.length; i++) t[i].remove();
        }, dur * 1050);
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: correct-select END ===== */

/* ===== FLN ANIMATION KIT: wrong-select BEGIN ===== */
/* needs the `later`, `tempo` and `M.answer.clear` helpers from recipe 19 */
(function(){ "use strict";
  var M = window.FLNMotion;
  function mk(cls){ var i = document.createElement("i"); i.className = cls; return i; }
  function later(el, fn, ms){ (el._selT = el._selT || []).push(setTimeout(fn, ms)); }
  /* ---- KIT PATCH (install-time), not part of the published block ----------
     Recipe 20's header says it "needs the `later`, `tempo` and `M.answer.clear`
     helpers from recipe 19". It re-declares `mk` and `later` in this IIFE but not
     `tempo`, which is local to recipe 19's IIFE - so both play() and out() threw
     `ReferenceError: tempo is not defined`. M.guard swallows it, so the wrong
     answer beat was silently DEAD rather than visibly broken. Verified with node
     before patching. Remove this once the kit block carries the helper itself. */
  function tempo(el){
    var cs = getComputedStyle(el);
    function num(p, d){
      var v = parseFloat(cs.getPropertyValue(p));
      if(!v && v !== 0) return d;
      return v > 20 ? v / 1000 : v;              /* tolerate ms as well as s */
    }
    var beat = num("--fx-beat", 0.4);
    return { beat: beat, reward: beat * (parseFloat(cs.getPropertyValue("--fx-reward")) || 2) };
  }

  M.wrongSelect = {
    defaults:{},               /* dur comes from CSS unless you pass one */

    /* transient: shakes, holds red, then RELEASES */
    play: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;
        var dur = o.dur || tempo(el).beat;              /* CSS owns the tempo */
        if(o.dur) el.style.setProperty("--wgT", dur + "s");
        el.classList.add("wg-wrong");          /* class first - see recipe 19 */
        var fx = mk("wg-fx"); fx.appendChild(mk("wg-pulse"));
        el.appendChild(fx);
        /* RELEASE on a timeout, never on animationend: under the reduced-motion kill
           switch animationend never fires and the tile would stay red forever - on
           exactly the devices least able to recover from it. (R5, second half.)
           .wg-rel goes on BEFORE .wg-wrong comes off so the border has something to
           transition with. */
        later(el, function(){
          el.classList.add("wg-rel");
          el.classList.remove("wg-wrong");
          var f = el.querySelector(".wg-fx"); if(f) f.remove();
          later(el, function(){
            el.classList.remove("wg-rel");
            if(o.then) o.then();
          }, 260);
        }, dur * 1500 + 40);
      });
    },

    /* elimination: shakes once, recedes, and STAYS recessed. No auto-clear. */
    out: function(el, opts){
      var o = Object.assign({}, this.defaults, opts || {});
      M.guard(function(){
        if(!el) return;
        M.answer.clear(el);
        void el.offsetWidth;
        var dur = o.dur || tempo(el).beat;
        if(o.dur) el.style.setProperty("--wgT", dur + "s");
        el.classList.add("wg-out");
        var fx = mk("wg-fx"); fx.appendChild(mk("wg-pulse"));
        el.appendChild(fx);
      });
    }
  };
})();
/* ===== FLN ANIMATION KIT: wrong-select END ===== */

/* ===== FLN ANIMATION KIT: object-outline BEGIN ===== */
(function(){ "use strict";
  var M = window.FLNMotion;
  var ST = ["is-correct", "is-wrong", "is-muted"];

  M.objectOutline = {
    /* state is just a class - both engines read the same ones */
    set: function(el, state){
      M.guard(function(){
        if(!el) return;
        for(var i = 0; i < ST.length; i++) el.classList.remove(ST[i]);
        void el.offsetWidth;                  /* restart - as in recipe 19 */
        if(state) el.classList.add("is-" + state);
      });
    },
    correct: function(el){ this.set(el, "correct"); },
    muted:   function(el){ this.set(el, "muted"); },
    reset:   function(el){ if(el && el._olT) clearTimeout(el._olT); this.set(el, ""); },

    /* wrong RELEASES back to idle white - the child has another attempt, exactly
       as the tile does in recipe 20. Timeout, never animationend: under the
       reduced-motion kill-switch animationend never fires. */
    wrong: function(el, opts){
      var o = opts || {}, self = this;
      M.guard(function(){
        if(!el) return;
        self.set(el, "wrong");
        var v = parseFloat(getComputedStyle(el).getPropertyValue("--olT")) || 0.4;
        if(v > 20) v = v / 1000;
        if(el._olT) clearTimeout(el._olT);
        el._olT = setTimeout(function(){
          el.classList.remove("is-wrong");
          if(o.then) o.then();
        }, v * 1500 + 40);
      });
    },

    /* OPTIONAL, and read the caveat. A rectangular hit box over an irregular sprite
       steals taps meant for whatever is behind it - two overlapping characters and
       the child taps the wrong one. This tests the tap against the sprite's ALPHA.
       It FAILS OPEN: reading pixels back taints the canvas on file://, which is how
       the activities ship, so there it always returns true and you are back to the
       bounding box. Treat it as a dev-server nicety, not a guarantee - the reliable
       fix is z-order and not overlapping the tappable parts in the first place. */
    alphaHit: function(img, clientX, clientY){
      var r = img.getBoundingClientRect();
      if(clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom)
        return false;
      if(img._olA === undefined){
        try{
          var w = Math.min(img.naturalWidth, 256);
          var h = Math.round(img.naturalHeight * w / img.naturalWidth);
          var c = document.createElement("canvas"); c.width = w; c.height = h;
          var x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
          img._olA = x.getImageData(0, 0, w, h);
        }catch(e){ img._olA = null; }         /* tainted - fail OPEN */
      }
      if(!img._olA) return true;
      var d = img._olA;
      var px = Math.floor((clientX - r.left) / r.width  * d.width);
      var py = Math.floor((clientY - r.top)  / r.height * d.height);
      return d.data[(py * d.width + px) * 4 + 3] > 24;
    }
  };
})();
/* ===== FLN ANIMATION KIT: object-outline END ===== */

/* [engine JS] DEV NAV — a review/QA slide navigator. Shows ONLY with ?dev=1 or ?nav=1 (children never
   see it). Jump to any slide by dropdown, step ◀▶, first/last, or back to the landing. Uses the
   engine's own mountSlide + state.idx; a light poll keeps the label synced when the game self-advances. */
function buildDevNav(){
  if(document.getElementById("devNav")) return;
  const bar = document.createElement("div"); bar.id = "devNav"; bar.className = "dev-nav";
  const mk = (txt, title)=>{ const b = document.createElement("button"); b.className = "dev-nav-btn"; b.textContent = txt; if(title) b.title = title; return b; };
  const land = mk("⌂", "landing"), first = mk("⏮", "first"), prev = mk("◀", "prev"), next = mk("▶", "next"), last = mk("⏭", "last");
  const sel = document.createElement("select"); sel.className = "dev-nav-sel"; sel.title = "jump to slide";
  CARD.slides.forEach((s, i)=>{ const o = document.createElement("option"); o.value = i; o.textContent = (i+1) + ". " + s.id + " · " + s.type; sel.appendChild(o); });
  const lbl = document.createElement("span"); lbl.className = "dev-nav-lbl";
  const cur = ()=> (state && typeof state.idx === "number") ? state.idx : 0;
  const leaveStart = ()=>{ const sg = $("startGate"); if(sg) sg.classList.add("hidden"); document.body.classList.remove("is-start"); document.body.classList.add("loaded"); const bl = $("bootLoader"); if(bl) bl.remove(); };
  const sync = ()=>{ const i = cur(); const s = CARD.slides[i]; if(document.activeElement !== sel) sel.value = i;
    lbl.textContent = (i+1) + "/" + CARD.slides.length + (s ? " · " + s.id : ""); };
  const go = (i)=>{ i = Math.max(0, Math.min(i, CARD.slides.length - 1)); leaveStart(); mountSlide(i); sync(); };
  land.onclick = ()=>{ const sg = $("startGate"); if(sg){ sg.classList.remove("hidden"); document.body.classList.add("is-start"); } };
  first.onclick = ()=> go(0); prev.onclick = ()=> go(cur() - 1); next.onclick = ()=> go(cur() + 1); last.onclick = ()=> go(CARD.slides.length - 1);
  sel.onchange = ()=> go(parseInt(sel.value, 10));
  bar.append(land, first, prev, sel, lbl, next, last);
  document.body.appendChild(bar);
  setInterval(sync, 300); sync();
}

boot();

/* ---------- [landing dust] sunlit dust motes on the first screen ----------
   Real dust in a sunbeam, not sprites on rails:
   - VISIBLE ONLY WHERE LIT. Each speck's brightness = the sunlight at its position:
     a falloff spilling down-right from the sun (.sg-sun, read live), so motes
     glint near the window and fade out toward the shaded right side.
   - DRIFTS ON AIR, NOT ON THE LIGHT. Light does not push dust: motion = a slow room
     draught from the window (down-right) + smooth per-particle turbulence + a tiny
     gravity settle + damping (dust is light, drag dominates). No straight paths.
   - TUMBLES. Flakes glint as they rotate to face the sun: brightness pulses ^3.
   - DEPTH. z 0..1: far = tiny, sharp, slow, dim; near = larger, softer (out of
     focus), faster across the screen (parallax). Most dust is far.
   - COMES FROM THE WINDOW (review 2026-09-29: "the particles coming from the direction of
     sunlight?" - 80 dim specks drifting ~5px/s were too faint to see): the draught blows ALONG the
     light (26deg, down-right), most specks re-enter in the sunlit window and fade in there, and
     there are more, slightly larger, brighter specks.
   Pauses off the landing and when the tab is hidden; one static frame under
   prefers-reduced-motion. Coordinates are .sg-fx-local design px (1096x438). */
(function(){
  const cv = document.getElementById("sgDust"); if(!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d"), W = 1096, H = 438, N = 120;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // soft round sprite (one draw per mote); small sizes read as crisp points
  const spr = document.createElement("canvas"); spr.width = spr.height = 32;
  (function(){ const g = spr.getContext("2d"), r = g.createRadialGradient(16,16,0,16,16,16);
    r.addColorStop(0, "rgba(255,251,236,1)"); r.addColorStop(.45, "rgba(255,244,215,.75)");
    r.addColorStop(1, "rgba(255,236,196,0)"); g.fillStyle = r; g.fillRect(0,0,32,32); })();

  /* light field = the sun (the .sg-sun anchor, read live) spilling into the room: an
     elongated falloff pointing down-right from the window (~26deg, the angle of the
     painted wall streak) - bright near the window, gone by the shaded right side. */
  let sun = { x:170, y:70 };
  const LA = 26 * Math.PI / 180, LC = Math.cos(LA), LS = Math.sin(LA);
  function readSun(){
    const f = document.querySelector(".sg-fx .sg-sun");
    if(f) sun = { x:f.offsetLeft, y:f.offsetTop };            // .sg-sun is a 0x0 anchor AT the sun
  }
  function light(x, y){
    const dx = x - sun.x, dy = y - sun.y;
    const s = dx * LC + dy * LS, c = -dx * LS + dy * LC;       // along / across the spill
    const sa = s >= 0 ? s / 520 : s / 150;                     // reaches far into the room, little behind the sun
    return Math.exp(-(sa * sa + (c / 230) * (c / 230)));
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn(p, fresh){
    p.z = Math.pow(Math.random(), 1.8);                        // bias far
    // start anywhere on screen the first time; later mostly re-enter IN the sunlit window (fading in there,
    // so they visibly come out of the light), the rest from the window-side edges
    const r0 = Math.random();
    if(fresh){ p.x = rnd(-20, W * .75); p.y = rnd(-10, H); }
    else if(r0 < .7){ p.x = sun.x + rnd(-130, 70); p.y = sun.y + rnd(-60, 90); }
    else if(r0 < .85){ p.x = rnd(-30, -5); p.y = rnd(0, H * .6); }
    else { p.x = rnd(0, W * .4); p.y = rnd(-30, -5); }
    p.vx = rnd(-2, 2); p.vy = rnd(-2, 2);
    p.r  = 1.1 + p.z * 3.4;                                    // radius px
    p.f1 = rnd(.07, .19); p.f2 = rnd(.11, .27); p.ph1 = rnd(0, 6.3); p.ph2 = rnd(0, 6.3);
    p.spin = rnd(.6, 2.2); p.sph = rnd(0, 6.3);
    p.fade = fresh ? 1 : 0;                                    // ease in after respawn
    return p;
  }
  const P = Array.from({length:N}, () => spawn({}, true));

  function fit(){
    const sc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
    const k = Math.min(sc * (window.devicePixelRatio || 1), 2);  // cap backing store for low-end GPUs
    cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    readSun();
    if(reduce) draw(8);                                        // resizing clears the canvas
  }

  function step(p, t, dt){
    const par = .45 + p.z * .9;                                // parallax: near crosses faster
    // room draught from the window, ALONG the light (LA) + slow global gusts
    const ws = 13 + 4 * Math.sin(t * .09);
    const wx = ws * LC, wy = ws * LS + 1.2 * Math.sin(t * .07 + 1.3);
    // smooth turbulence (two incommensurate sines per axis = no visible loop)
    const tx = 7 * Math.sin(t * p.f1 + p.ph1) + 4 * Math.sin(t * p.f2 * 1.7 + p.ph2);
    const ty = 6 * Math.cos(t * p.f2 + p.ph2) + 3 * Math.sin(t * p.f1 * 2.3 + p.ph1);
    const g  = .8 + p.z * .9;                                  // settling: heavier near flakes sink a touch faster
    // drag toward the local air velocity (dust has almost no inertia) + Brownian jitter
    const k = 1 - Math.exp(-1.6 * dt);
    p.vx += ((wx + tx) - p.vx) * k + rnd(-1, 1) * 6 * dt;
    p.vy += ((wy + ty + g) - p.vy) * k + rnd(-1, 1) * 6 * dt;
    p.x += p.vx * par * dt; p.y += p.vy * par * dt;
    if(p.fade < 1) p.fade = Math.min(1, p.fade + dt / 1.5);
    if(p.x > W + 20 || p.y > H + 20 || p.x < -40 || p.y < -40) spawn(p, false);
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for(const p of P){
      const L = light(p.x, p.y);
      if(L < .02) continue;                                    // in shade: invisible, like real dust
      const glint = .5 + .5 * Math.pow(Math.max(0, Math.sin(t * p.spin + p.sph)), 3);
      const depth = .45 + .55 * (1 - Math.abs(p.z - .35));     // far dim, very near slightly defocused
      const a = Math.min(1, L * 1.7) * glint * depth * p.fade;
      if(a < .02) continue;
      const d = p.r * 2 * (p.z > .7 ? 1.35 : 1);               // near = out-of-focus blur disc
      ctx.globalAlpha = p.z > .7 ? a * .6 : a;
      ctx.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  let last = 0, t = 0;
  function frame(now){
    requestAnimationFrame(frame);
    if(!document.body.classList.contains("is-start")){ last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now; t += dt;
    for(const p of P) step(p, t, dt);
    draw(t);
  }

  fit();
  window.addEventListener("resize", () => { clearTimeout(fit._t); fit._t = setTimeout(fit, 200); });
  window.addEventListener("load", fit);
  if(reduce){ for(let i = 0; i < 240; i++) for(const p of P) step(p, i / 30, 1 / 30); draw(8); }
  else requestAnimationFrame(frame);
})();

PVLanding.intro();   // [landing pv] the picture comes in with the greeting
