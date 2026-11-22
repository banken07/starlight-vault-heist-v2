// game.js — Starlight Vault main loop: state, alarm, win / caught, render.
// Alarm: CALM <25, UNEASY 25-49, HUNTED 50-74, ALARM 75-100. It rises
// while any guard or camera sees the thief and decays while unseen —
// faster while the thief hides in a vent.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  window.__errors = [];
  window.addEventListener('error', function (e) {
    window.__errors.push(String(e.message || e.error || 'error'));
  });

  function freshState() {
    var room = SV.ROOMS[0];
    return {
      room: 0,
      player: SV.makePlayer(room.playerStart),
      guards: room.guards.map(SV.makeGuard),
      cameras: room.cameras.map(SV.makeCamera),
      alarm: 0,
      coins: 12,
      tools: { lockpick: 0, smoke: 0, lenscap: 0 },
      lootTaken: [false, false, false],
      diamondTaken: false,
      caseOpen: false,
      caseTimer: 0,
      smokeUntil: 0,
      smokePos: null,
      caught: false,
      caughtBy: '',
      won: false,
      time: 0,
      timeStr: '00:00',
      banner: 'THE MAP ROOM — steal the STAR CHART, then find the door',
      bannerUntil: 6,
      staged: false,
      shot: 0
    };
  }

  SV.resetGame = function (S) {
    var fresh = freshState();    Object.keys(fresh).forEach(function (k) { S[k] = fresh[k]; });
    // fresh small-loot state: rebuild rooms' taken flags
    SV.ROOMS.forEach(function (r) {
      r.smallLoot.forEach(function (sl) { sl.taken = false; });
    });
    S.banner = 'THE MAP ROOM — steal the STAR CHART, then find the door';
    S.bannerUntil = S.time + 6;
  };

  function fmtTime(t) {
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function update(S, dt) {
    var room = SV.ROOMS[S.room];
    if (S.caught || S.won) return;
    S.time += dt;
    S.timeStr = fmtTime(S.time);

    SV.movePlayer(S, room, dt, SV.keys);

    var seenByGuard = SV.updateGuards(S, room, dt);
    var seenByCamera = SV.updateCameras(S, room, dt);
    var seen = seenByGuard || seenByCamera;

    if (seen) {
      S.alarm = Math.min(100, S.alarm + (seenByCamera ? 20 : 0) * dt + (seenByGuard ? 28 : 0) * dt);
      if (S.alarm >= 50 && Math.random() < dt * 0.5) SV.sfx('alarm');
    } else {
      var decay = SV.inVent(S.player.x, S.player.y, room) ? 12 : 6;
      S.alarm = Math.max(0, S.alarm - decay * dt);
    }
    if (S.alarm >= 100) {
      S.caught = true;
      S.caughtBy = 'THE ALARM';
    }
    if (S.caught) SV.sfx('caught');

    if (S.caseOpen) {
      S.caseTimer -= dt;
      if (S.caseTimer <= 0) {
        S.caseOpen = false;
        S.banner = 'THE CASE RESEALED — lockpick it again';
        S.bannerUntil = S.time + 2.5;
      }
    }
  }

  // Test hooks: let a headless playtest drive the real update loop.
  SV._freshState = freshState;
  SV._update = update;
  SV._fmtTime = fmtTime;

  function main() {
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    var S = freshState();
    SV.S = S;
    var shot = SV.shotFromUrl();
    if (shot) SV.applyShot(S, shot);
    SV.bindInput(S);

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Staged screenshot frames are frozen: no AI, no alarm drift, no
      // timer — the capture is deterministic.
      if (!S.staged) update(S, dt);
      SV.render(ctx, S);
      window.__shotReady = true;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
