// player.js — the thief: movement, wall collision, loot, doors and the
// zipline getaway. Speed 2.6 — slower than a chasing guard (2.95), so a
// chase is a real threat and cover, smoke and vents matter.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  SV.makePlayer = function (start) {
    return { x: start.x, y: start.y, r: 13, facing: -Math.PI / 2, moving: false };
  };

  SV.movePlayer = function (S, room, dt, keys) {
    var p = S.player;
    var dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    p.moving = (dx !== 0 || dy !== 0);
    if (!p.moving) return;
    var len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
    var step = SV.PLAYER_SPEED * dt * 60;
    var nx = p.x + dx * step, ny = p.y + dy * step;
    var fixed = SV.resolveWalls(nx, ny, p.r, room);
    p.x = fixed.x; p.y = fixed.y;
    p.facing = Math.atan2(dy, dx);
  };

  // E key: take loot, open the case, use a door, or ride the zipline.
  SV.interact = function (S, room) {
    var p = S.player;
    if (S.caught || S.won) return;

    // Small loot: coin pouches lying on the floor.
    for (var i = 0; i < room.smallLoot.length; i++) {
      var sl = room.smallLoot[i];
      if (!sl.taken && SV.dist(p.x, p.y, sl.x, sl.y) < 34) {
        sl.taken = true;
        S.coins += sl.value;
        S.banner = '+' + sl.value + ' COINS — small loot pocketed';
        S.bannerUntil = S.time + 2;
        SV.sfx('pickup');
        return;
      }
    }

    // Room loot (Star Chart / Brass Key) on its table or pedestal.
    if (!S.lootTaken[S.room] && SV.dist(p.x, p.y, room.lootPos.x, room.lootPos.y) < 60) {
      if (S.room === 2) {
        // The diamond lives in a glass case: it must be open first.
        if (!S.caseOpen) {
          S.banner = 'GLASS CASE — LOCKED. Buy a lockpick (key 1), then press E';
          S.bannerUntil = S.time + 3;
          return;
        }
        S.lootTaken[2] = true;
        S.diamondTaken = true;
        S.banner = 'COMET DIAMOND TAKEN — GET TO THE ZIPLINE!';
        S.bannerUntil = S.time + 3.5;
        SV.sfx('diamond');
        return;
      }
      S.lootTaken[S.room] = true;
      S.banner = room.lootName + ' TAKEN — find the door to the next room';
      S.bannerUntil = S.time + 3;
      SV.sfx('pickup');
      return;
    }

    // Glass case: open it with a lockpick (key 1 buys one first).
    if (S.room === 2 && !S.caseOpen && SV.dist(p.x, p.y, room.casePos.x, room.casePos.y) < 110) {
      if (S.tools.lockpick > 0) {
        S.tools.lockpick -= 1;
        S.caseOpen = true;
        S.caseTimer = 10;
        S.banner = 'LOCKPICKED — case reseals in 10s. Grab the diamond!';
        S.bannerUntil = S.time + 3;
        SV.sfx('lockpick');
      } else {
        S.banner = 'NO LOCKPICK — buy one first (key 1, 10 coins)';
        S.bannerUntil = S.time + 2.5;
      }
      return;
    }

    // Zipline: only after the diamond is taken.
    if (room.zipline && SV.dist(p.x, p.y, room.zipline.x + 40, room.zipline.y + 30) < 70) {
      if (S.diamondTaken) {
        S.won = true;
        SV.sfx('win');
      } else {
        S.banner = 'ZIPLINE — take the COMET DIAMOND first';
        S.bannerUntil = S.time + 2.5;
      }
      return;
    }

    // Door to the next room: needs this room's loot first.
    if (room.exit && SV.pointInRect(p.x, p.y, room.exit)) {
      if (S.lootTaken[S.room]) {
        SV.enterRoom(S, room.exit.next);
      } else {
        S.banner = 'LOCKED — steal the ' + room.lootName + ' first';
        S.bannerUntil = S.time + 2.5;
      }
    }
  };

  SV.enterRoom = function (S, idx) {
    S.room = idx;
    var room = SV.ROOMS[idx];
    S.player = SV.makePlayer(room.playerStart);
    S.guards = room.guards.map(SV.makeGuard);
    S.cameras = room.cameras.map(SV.makeCamera);
    S.banner = room.name + ' — ' + room.sub;
    S.bannerUntil = S.time + 3.5;
    SV.sfx('door');
  };

  // Prompt line shown when the player stands near something usable.
  SV.nearPrompt = function (S, room) {
    var p = S.player;
    for (var i = 0; i < room.smallLoot.length; i++) {
      var sl = room.smallLoot[i];
      if (!sl.taken && SV.dist(p.x, p.y, sl.x, sl.y) < 34) return 'E — POCKET COINS';
    }
    if (!S.lootTaken[S.room] && SV.dist(p.x, p.y, room.lootPos.x, room.lootPos.y) < 60) {
      if (S.room === 2 && !S.caseOpen) return 'E — GLASS CASE (LOCKED)';
      return 'E — TAKE THE ' + room.lootName;
    }
    if (S.room === 2 && !S.caseOpen && SV.dist(p.x, p.y, room.casePos.x, room.casePos.y) < 110) {
      return 'E — LOCKPICK THE CASE';
    }
    if (room.zipline && SV.dist(p.x, p.y, room.zipline.x + 40, room.zipline.y + 30) < 70) {
      return 'E — RIDE THE ZIPLINE OUT';
    }
    if (room.exit && SV.pointInRect(p.x, p.y, room.exit)) return 'E — GO THROUGH THE DOOR';
    return '';
  };
})();
