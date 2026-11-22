// cameras.js — brass-eye cameras: sweeping red cones, blindable with a lens
// cap or smoke. A camera that spots the thief raises the alarm fast.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  SV.CAMERA_HALF = 0.30; // radians either side of the sweep angle

  SV.makeCamera = function (def) {
    return {
      x: def.x, y: def.y, base: def.base, sweep: def.sweep,
      range: def.range, speed: def.speed, angle: def.base,
      blindUntil: 0
    };
  };

  SV.updateCameras = function (S, room, dt) {
    var anySeen = false;
    for (var i = 0; i < S.cameras.length; i++) {
      var c = S.cameras[i];
      // Shot 1 freezes the top camera of the Star Vault so its cone tip
      // rests exactly on the diamond's glass case for the cover frame.
      if (S.staged && S.shot === 1 && S.room === 2 && i === 0) {
        c.angle = 1.273;
      } else {
        c.angle = c.base + Math.sin(S.time * c.speed) * c.sweep;
      }
      if (S.time < c.blindUntil) continue;
      if (S.smokeUntil > S.time && SV.dist(c.x, c.y, S.player.x, S.player.y) < 190) continue;
      var d = SV.dist(c.x, c.y, S.player.x, S.player.y);
      if (d > c.range) continue;
      var ang = SV.angleTo(c.x, c.y, S.player.x, S.player.y);
      if (Math.abs(SV.angleDiff(ang, c.angle)) > SV.CAMERA_HALF) continue;
      if (SV.lineBlocked(c.x, c.y, S.player.x, S.player.y, room)) continue;
      anySeen = true;
    }
    return anySeen;
  };

  SV.nearestCamera = function (S) {
    var best = null, bestD = 1e9;
    for (var i = 0; i < S.cameras.length; i++) {
      var d = SV.dist(S.cameras[i].x, S.cameras[i].y, S.player.x, S.player.y);
      if (d < bestD) { bestD = d; best = S.cameras[i]; }
    }
    return best;
  };
})();
