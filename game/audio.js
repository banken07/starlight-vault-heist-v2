// audio.js — tiny WebAudio bleeps: pickup, lockpick, alarm ticks, win.
// No audio files, no network — every sound is a synthesized oscillator.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;
  var ctx = null;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, when) {
    var ac = ensureCtx();
    if (!ac) return;
    try {
      var t0 = ac.currentTime + (when || 0);
      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* audio is decoration, never fatal */ }
  }

  SV.sfx = function (kind) {
    if (kind === 'pickup') { tone(660, 0.12, 'sine', 0.09); tone(880, 0.14, 'sine', 0.07, 0.08); }
    else if (kind === 'buy') { tone(520, 0.1, 'triangle', 0.08); }
    else if (kind === 'lockpick') { tone(440, 0.08, 'square', 0.05); tone(660, 0.08, 'square', 0.05, 0.09); tone(880, 0.12, 'square', 0.05, 0.18); }
    else if (kind === 'diamond') { tone(880, 0.15, 'sine', 0.09); tone(1174, 0.15, 'sine', 0.09, 0.1); tone(1568, 0.3, 'sine', 0.09, 0.2); }
    else if (kind === 'smoke') { tone(220, 0.3, 'sawtooth', 0.04); }
    else if (kind === 'cap') { tone(330, 0.1, 'triangle', 0.07); }
    else if (kind === 'door') { tone(392, 0.12, 'triangle', 0.07); tone(523, 0.15, 'triangle', 0.07, 0.1); }
    else if (kind === 'alarm') { tone(980, 0.09, 'square', 0.045); }
    else if (kind === 'caught') { tone(220, 0.25, 'sawtooth', 0.09); tone(165, 0.4, 'sawtooth', 0.09, 0.2); }
    else if (kind === 'win') {
      [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.22, 'sine', 0.09, i * 0.13); });
    }
  };

  SV.unlockAudio = function () { ensureCtx(); };
})();
