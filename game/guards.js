// guards.js — named guards: patrol waypoints, vision cones, suspicion,
// investigate-then-chase, and a fair catch (touch only while chasing).
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  SV.GUARD_VISION_RANGE = 235;
  SV.GUARD_VISION_HALF = 0.42; // radians either side of facing
  SV.GUARD_INVESTIGATE_SPEED = 1.9;
  SV.GUARD_CATCH_DIST = 26;

  SV.makeGuard = function (def) {
    return {
      name: def.name, x: def.x, y: def.y,
      waypoints: def.waypoints, wp: 0,
      facing: def.facing || 0,
      state: 'PATROL', // PATROL | INVESTIGATE | CHASE
      suspicion: 0,
      lastSeen: null,
      loseSight: 0,
      speed: SV.GUARD_PATROL_SPEED
    };
  };

  SV.guardSeesPlayer = function (g, S, room) {
    if (S.smokeUntil > S.time) {
      var dSmoke = SV.dist(g.x, g.y, S.player.x, S.player.y);
      if (dSmoke < 190) return false; // smoke blinds nearby cones
    }
    var d = SV.dist(g.x, g.y, S.player.x, S.player.y);
    if (d > SV.GUARD_VISION_RANGE) return false;
    var ang = SV.angleTo(g.x, g.y, S.player.x, S.player.y);
    if (Math.abs(SV.angleDiff(ang, g.facing)) > SV.GUARD_VISION_HALF) return false;
    if (SV.lineBlocked(g.x, g.y, S.player.x, S.player.y, room)) return false;
    return true;
  };

  SV.updateGuards = function (S, room, dt) {
    var anySeen = false;
    for (var i = 0; i < S.guards.length; i++) {
      var g = S.guards[i];
      var sees = SV.guardSeesPlayer(g, S, room);
      if (sees) {
        anySeen = true;
        g.suspicion = Math.min(1, g.suspicion + 0.9 * dt);
        g.lastSeen = { x: S.player.x, y: S.player.y };
        g.loseSight = 0;
      } else {
        g.suspicion = Math.max(0, g.suspicion - 0.22 * dt);
        g.loseSight += dt;
      }

      // State machine: suspicion first, investigate, then chase. Never
      // an instant catch — the player always gets a warning first.
      if (g.suspicion >= 0.8 || S.alarm >= 55) {
        if (g.state !== 'CHASE' && g.suspicion >= 0.8) {
          S.banner = g.name + ' SPOTTED YOU — RUN!';
          S.bannerUntil = S.time + 2.5;
        }
        g.state = 'CHASE';
      } else if (g.suspicion >= 0.35) {
        if (g.state !== 'INVESTIGATE') {
          S.banner = g.name + ' IS SUSPICIOUS — INVESTIGATING';
          S.bannerUntil = S.time + 2.5;
        }
        g.state = 'INVESTIGATE';
      } else if (g.loseSight > 4 && g.state !== 'PATROL') {
        g.state = 'PATROL';
      }

      var tx, ty, speed;
      if (g.state === 'CHASE') {
        // Chase the thief while seen; once sight is broken, hunt the last
        // seen spot instead — breaking line of sight can drop the chase.
        if (sees) { tx = S.player.x; ty = S.player.y; }
        else if (g.lastSeen) { tx = g.lastSeen.x; ty = g.lastSeen.y; }
        else { tx = S.player.x; ty = S.player.y; }
        speed = SV.GUARD_CHASE_SPEED;
      } else if (g.state === 'INVESTIGATE' && g.lastSeen) {
        tx = g.lastSeen.x; ty = g.lastSeen.y; speed = SV.GUARD_INVESTIGATE_SPEED;
        if (SV.dist(g.x, g.y, tx, ty) < 18) { g.state = 'PATROL'; g.suspicion = 0; }
      } else {
        var wp = g.waypoints[g.wp];
        tx = wp[0]; ty = wp[1]; speed = SV.GUARD_PATROL_SPEED;
        if (SV.dist(g.x, g.y, tx, ty) < 14) g.wp = (g.wp + 1) % g.waypoints.length;
      }
      var d = SV.dist(g.x, g.y, tx, ty);
      if (d > 1) {
        var step = Math.min(d, speed * dt * 60);
        var nx = g.x + (tx - g.x) / d * step;
        var ny = g.y + (ty - g.y) / d * step;
        var fixed = SV.resolveWalls(nx, ny, 14, room);
        g.x = fixed.x; g.y = fixed.y;
        g.facing = SV.angleTo(g.x, g.y, tx, ty);
      }
      g.speed = speed;

      // Fair catch: only a chasing guard that actually touches the thief.
      if (g.state === 'CHASE' && SV.dist(g.x, g.y, S.player.x, S.player.y) < SV.GUARD_CATCH_DIST) {
        S.caught = true;
        S.caughtBy = g.name;
      }
    }
    return anySeen;
  };
})();
