// rooms.js — the three observatory rooms: layout, cover, routes, loot, exits.
// Every room has a main floor, a walkable VENT corridor and a walkable BALCONY
// strip, each labelled in the render and reachable on foot (no teleports).
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  SV.PLAY = { x: 184, y: 72, w: 1088, h: 720 }; // playfield inside HUD + legend
  SV.PLAYER_SPEED = 2.6;
  SV.GUARD_PATROL_SPEED = 1.2;
  SV.GUARD_CHASE_SPEED = 2.95;

  function wall(x, y, w, h, label, kind) {
    return { x: x, y: y, w: w, h: h, label: label || '', kind: kind || 'cover' };
  }
  function vent(x, y, w, h, label) {
    return { x: x, y: y, w: w, h: h, label: label || 'VENT — QUIET ROUTE' };
  }
  function balcony(x, y, w, h, label) {
    return { x: x, y: y, w: w, h: h, label: label || 'BALCONY — HIGH ROUTE' };
  }

  // Room 1 — The Map Room. Loot: STAR CHART on the map table.
  var roomMap = {
    name: 'THE MAP ROOM',
    sub: 'Room 1 of 3 — steal the STAR CHART',
    lootName: 'STAR CHART',
    lootPos: { x: 700, y: 400 },
    playerStart: { x: 300, y: 660 },
    walls: [
      wall(430, 300, 150, 60, 'BOOKCASE', 'bookcase'),
      wall(430, 470, 150, 60, 'BOOKCASE', 'bookcase'),
      wall(820, 300, 150, 60, 'BOOKCASE', 'bookcase'),
      wall(820, 470, 150, 60, 'BOOKCASE', 'bookcase'),
      wall(640, 360, 130, 80, 'MAP TABLE', 'table'),
      wall(250, 180, 90, 90, 'GLOBE STAND', 'pedestal'),
      wall(1010, 560, 110, 70, 'CRATES', 'crate')
    ],
    vents: [vent(220, 84, 980, 40)],
    balconies: [balcony(1196, 160, 68, 480)],
    stairs: [{ x: 1196, y: 640, w: 68, h: 60, label: 'STAIRS' }],
    smallLoot: [
      { x: 300, y: 250, taken: false, value: 6 },
      { x: 1080, y: 250, taken: false, value: 6 },
      { x: 1080, y: 690, taken: false, value: 6 }
    ],
    guards: [
      { name: 'MARA', x: 620, y: 250, waypoints: [[620, 250], [900, 250], [900, 620], [620, 620]], facing: 0 }
    ],
    cameras: [
      { x: 300, y: 110, base: 0.9, sweep: 0.7, range: 250, speed: 0.55, blindUntil: 0 }
    ],
    exit: { x: 1030, y: 748, w: 150, h: 44, label: 'DOOR — TELESCOPE DOME', next: 1 },
    zipline: null
  };

  // Room 2 — The Telescope Dome. Loot: BRASS KEY on a pedestal.
  var roomDome = {
    name: 'THE TELESCOPE DOME',
    sub: 'Room 2 of 3 — steal the BRASS KEY',
    lootName: 'BRASS KEY',
    lootPos: { x: 980, y: 300 },
    playerStart: { x: 300, y: 660 },
    walls: [
      wall(560, 380, 300, 90, 'GREAT TELESCOPE', 'telescope'),
      wall(300, 220, 130, 60, 'STAR ATLAS SHELF', 'bookcase'),
      wall(980, 520, 130, 60, 'CHART CABINET', 'bookcase'),
      wall(1080, 200, 100, 70, 'LENS CRATES', 'crate'),
      wall(920, 260, 120, 70, 'KEY PEDESTAL', 'pedestal')
    ],
    vents: [vent(196, 150, 40, 540)],
    balconies: [balcony(220, 84, 980, 40)],
    stairs: [{ x: 220, y: 84, w: 70, h: 44, label: 'STAIRS' }],
    smallLoot: [
      { x: 420, y: 620, taken: false, value: 6 },
      { x: 1120, y: 420, taken: false, value: 6 },
      { x: 620, y: 180, taken: false, value: 6 }
    ],
    guards: [
      { name: 'JULES', x: 700, y: 220, waypoints: [[700, 220], [1050, 220], [1050, 600], [700, 600]], facing: 0 }
    ],
    cameras: [
      { x: 1150, y: 110, base: 2.4, sweep: 0.8, range: 250, speed: 0.5, blindUntil: 0 },
      { x: 260, y: 110, base: 0.6, sweep: 0.7, range: 240, speed: 0.62, blindUntil: 0 }
    ],
    exit: { x: 1030, y: 748, w: 150, h: 44, label: 'DOOR — THE STAR VAULT', next: 2 },
    zipline: null
  };

  // Room 3 — The Star Vault. Loot: COMET DIAMOND in a glass case.
  // Top camera at (640,100) aims at the case centre (738,420):
  // angle = atan2(420-100, 738-640) = atan2(320,98) = 1.273 rad.
  // Range 340 so the cone tip reaches the case (distance is ~335).
  var roomVault = {
    name: 'THE STAR VAULT',
    sub: 'Room 3 of 3 — steal the COMET DIAMOND',
    lootName: 'COMET DIAMOND',
    lootPos: { x: 738, y: 420 },
    casePos: { x: 738, y: 420 },
    playerStart: { x: 300, y: 660 },
    walls: [
      wall(420, 250, 170, 70, 'TELESCOPE', 'telescope'),
      wall(950, 250, 170, 70, 'STAR GLOBE', 'pedestal'),
      wall(420, 540, 170, 70, 'DISPLAY PEDESTAL', 'pedestal'),
      wall(950, 540, 170, 70, 'DISPLAY PEDESTAL', 'pedestal'),
      wall(300, 380, 90, 90, 'CRATES', 'crate'),
      wall(1080, 380, 90, 90, 'CRATES', 'crate')
    ],
    vents: [vent(220, 716, 980, 40)],
    balconies: [balcony(196, 150, 60, 490)],
    stairs: [{ x: 196, y: 640, w: 60, h: 60, label: 'STAIRS' }],
    smallLoot: [
      { x: 330, y: 180, taken: false, value: 6 },
      { x: 1120, y: 640, taken: false, value: 6 },
      { x: 700, y: 640, taken: false, value: 6 }
    ],
    guards: [
      { name: 'MARA', x: 500, y: 360, waypoints: [[500, 360], [900, 360], [900, 660], [500, 660]], facing: 0 },
      { name: 'JULES', x: 980, y: 660, waypoints: [[980, 660], [600, 660], [600, 180], [980, 180]], facing: 0 }
    ],
    cameras: [
      { x: 640, y: 100, base: 1.273, sweep: 0.9, range: 340, speed: 0.45, blindUntil: 0 },
      { x: 1150, y: 130, base: 2.6, sweep: 0.8, range: 250, speed: 0.55, blindUntil: 0 }
    ],
    exit: null,
    zipline: { x: 1180, y: 108, w: 80, h: 60, label: 'ZIPLINE — GETAWAY' }
  };

  SV.ROOMS = [roomMap, roomDome, roomVault];

  // ---- geometry helpers shared by guards, cameras and the player ----
  SV.pointInRect = function (x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };
  SV.dist = function (x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };
  SV.angleTo = function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); };
  SV.angleDiff = function (a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  function segHitsRect(x1, y1, x2, y2, r) {
    // segment vs axis-aligned rect: test the four edges
    function segSeg(ax, ay, bx, by, cx, cy, dx, dy) {
      var d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
      var d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
      var d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      var d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
      return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
    }
    if (SV.pointInRect(x1, y1, r) || SV.pointInRect(x2, y2, r)) return true;
    var x3 = r.x + r.w, y3 = r.y + r.h;
    return segSeg(x1, y1, x2, y2, r.x, r.y, x3, r.y) ||
      segSeg(x1, y1, x2, y2, x3, r.y, x3, y3) ||
      segSeg(x1, y1, x2, y2, x3, y3, r.x, y3) ||
      segSeg(x1, y1, x2, y2, r.x, y3, r.x, r.y);
  }
  SV.lineBlocked = function (x1, y1, x2, y2, room) {
    for (var i = 0; i < room.walls.length; i++) {
      if (segHitsRect(x1, y1, x2, y2, room.walls[i])) return true;
    }
    return false;
  };
  // Circle vs wall collision: push the circle out of every overlapping wall.
  SV.resolveWalls = function (px, py, r, room) {
    var p = SV.PLAY;
    px = Math.max(p.x + r, Math.min(p.x + p.w - r, px));
    py = Math.max(p.y + r, Math.min(p.y + p.h - r, py));
    for (var i = 0; i < room.walls.length; i++) {
      var w = room.walls[i];
      var cx = Math.max(w.x, Math.min(px, w.x + w.w));
      var cy = Math.max(w.y, Math.min(py, w.y + w.h));
      var dx = px - cx, dy = py - cy;
      var d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        if (d2 === 0) { py = w.y - r; continue; }
        var d = Math.sqrt(d2);
        px = cx + (dx / d) * r;
        py = cy + (dy / d) * r;
      }
    }
    return { x: px, y: py };
  };
  SV.inVent = function (x, y, room) {
    for (var i = 0; i < room.vents.length; i++) {
      if (SV.pointInRect(x, y, room.vents[i])) return true;
    }
    return false;
  };
  SV.inBalcony = function (x, y, room) {
    for (var i = 0; i < room.balconies.length; i++) {
      if (SV.pointInRect(x, y, room.balconies[i])) return true;
    }
    return false;
  };
})();
