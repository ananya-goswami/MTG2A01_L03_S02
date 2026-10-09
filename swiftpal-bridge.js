/* SWIFTPAL PLATFORM BRIDGE - routes every xAPI statement to the host: Android JavascriptInterface,
   iOS WKWebView (webkit.messageHandlers.swiftpal), or web/electron postMessage.
   Verbatim from the HI01H01_L02_S04 reference build (where it is inlined, that book being a single
   file). Loaded BEFORE app.js. Guarded with `||` so a host that injects its own window.SwiftPAL
   first always wins. The game's own internal signal bus is window.GameBus, never this name. */
window.SwiftPAL = window.SwiftPAL || (function(){
  const _platform = (window.Android && typeof window.Android.sendEvent === "function") ? "android"
    : (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.swiftpal) ? "ios"
    : (window.parent !== window) ? "web"
    : (window.opener) ? "electron" : "web";
  function _call(name, args){
    try{
      if(_platform === "android"){
        if(window.Android && typeof window.Android[name] === "function") window.Android[name](...args);
        else console.warn("[SwiftPAL Bridge] Android." + name + " not found");
      } else if(_platform === "ios"){
        window.webkit.messageHandlers.swiftpal.postMessage({ fn: name, args });
      } else {
        const target = (window.parent !== window) ? window.parent : (window.opener || null);
        if(target) target.postMessage({ source: "swiftpal", fn: name, args }, "*");
      }
    }catch(e){ console.warn("[SwiftPAL Bridge] _call error for " + name + ":", e); }
    try{ window.dispatchEvent(new CustomEvent("swiftpal:" + name, { detail: { fn: name, args } })); }catch(e){}
    try{ console.log("[SwiftPAL Bridge] " + _platform + "." + name, ...args); }catch(e){}
  }
  return {
    _platform: _platform,
    sendEvent(statement){ _call("sendEvent", [JSON.stringify(statement)]); }
  };
})();
