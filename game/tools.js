// tools.js — the thief's kit. Every tool costs coins; coins come from the
// small loot pouches on the floor. Nothing here is free after the start.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  SV.TOOLS = {
    lockpick: { name: 'LOCKPICK', cost: 10, key: '1', desc: 'opens the glass case' },
    smoke: { name: 'SMOKE BOMB', cost: 15, key: '2', desc: 'blinds cones near you (F to throw)' },
    lenscap: { name: 'LENS CAP', cost: 8, key: '3', desc: 'blinds the nearest camera 10s (C to use)' }
  };

  SV.buyTool = function (S, kind) {
    var t = SV.TOOLS[kind];
    if (!t) return;
    if (S.coins < t.cost) {
      S.banner = 'NOT ENOUGH COINS — ' + t.name + ' costs ' + t.cost;
      S.bannerUntil = S.time + 2;
      return;
    }
    S.coins -= t.cost;
    S.tools[kind] += 1;
    S.banner = t.name + ' BOUGHT (' + t.cost + ' coins) — ' + t.desc;
    S.bannerUntil = S.time + 2.5;
    SV.sfx('buy');
  };

  SV.useSmoke = function (S) {
    if (S.tools.smoke <= 0) {
      S.banner = 'NO SMOKE BOMB — buy one (key 2, 15 coins)';
      S.bannerUntil = S.time + 2;
      return;
    }
    S.tools.smoke -= 1;
    S.smokeUntil = S.time + 6;
    S.smokePos = { x: S.player.x, y: S.player.y };
    S.banner = 'SMOKE! Cones near you are blind for 6s — move!';
    S.bannerUntil = S.time + 2.5;
    SV.sfx('smoke');
  };

  SV.useLensCap = function (S) {
    if (S.tools.lenscap <= 0) {
      S.banner = 'NO LENS CAP — buy one (key 3, 8 coins)';
      S.bannerUntil = S.time + 2;
      return;
    }
    var cam = SV.nearestCamera(S);
    if (!cam) return;
    S.tools.lenscap -= 1;
    cam.blindUntil = S.time + 10;
    S.banner = 'LENS CAP ON — nearest camera blind for 10s';
    S.bannerUntil = S.time + 2.5;
    SV.sfx('cap');
  };
})();
