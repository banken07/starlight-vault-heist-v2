// render.js — every pixel of Starlight Vault: marble floor, starfield, brass
// cover, glowing loot, gradient vision cones, HUD, legend, banners, overlays.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCone(ctx, x, y, angle, half, range, color) {
    var grad = ctx.createRadialGradient(x, y, 8, x, y, range);
    grad.addColorStop(0, color.replace('A', '0.42'));
    grad.addColorStop(0.7, color.replace('A', '0.16'));
    grad.addColorStop(1, color.replace('A', '0'));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - half, angle + half);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color.replace('A', '0.5');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle - half) * range, y + Math.sin(angle - half) * range);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle + half) * range, y + Math.sin(angle + half) * range);
    ctx.stroke();
  }

  function starPoints(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 8; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 4;
      var rad = (i % 2 === 0) ? r : r * 0.42;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    return pts;
  }

  SV.drawDiamond = function (ctx, x, y, r, glow) {
    ctx.save();
    if (glow) { ctx.shadowColor = '#9fe8ff'; ctx.shadowBlur = 26; }
    var pts = starPoints(x, y, r);
    ctx.beginPath();
    pts.forEach(function (p, i) { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
    ctx.closePath();
    var g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, '#eafcff');
    g.addColorStop(0.5, '#7fd4ff');
    g.addColorStop(1, '#2f7fd0');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y);
    ctx.lineTo(x + r * 0.45, y);
    ctx.moveTo(x, y - r * 0.45);
    ctx.lineTo(x, y + r * 0.45);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  function drawFloor(ctx, S) {
    var p = SV.PLAY;
    var g = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    g.addColorStop(0, '#141d33');
    g.addColorStop(0.5, '#101828');
    g.addColorStop(1, '#0c1220');
    ctx.fillStyle = g;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    // marble tiles
    ctx.strokeStyle = 'rgba(150,170,220,0.07)';
    ctx.lineWidth = 1;
    for (var x = p.x + 68; x < p.x + p.w; x += 68) {
      ctx.beginPath(); ctx.moveTo(x, p.y); ctx.lineTo(x, p.y + p.h); ctx.stroke();
    }
    for (var y = p.y + 68; y < p.y + p.h; y += 68) {
      ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x + p.w, y); ctx.stroke();
    }
    // faint marble veins
    ctx.strokeStyle = 'rgba(180,200,255,0.05)';
    ctx.lineWidth = 2;
    for (var i = 0; i < 7; i++) {
      var vy = p.y + 60 + i * 96 + (i % 3) * 17;
      ctx.beginPath();
      ctx.moveTo(p.x + 20, vy);
      ctx.bezierCurveTo(p.x + 300, vy - 26, p.x + 700, vy + 22, p.x + p.w - 30, vy - 8);
      ctx.stroke();
    }
    // starfield dust on the floor
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (var s = 0; s < 60; s++) {
      var sx = p.x + ((s * 173) % p.w);
      var sy = p.y + ((s * 311) % p.h);
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    // brass border around the room
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3);
  }

  function drawVent(ctx, v) {
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = 'rgba(201,162,39,0.75)';
    ctx.lineWidth = 2;
    var horizontal = v.w > v.h;
    if (horizontal) {
      for (var x = v.x + 12; x < v.x + v.w - 6; x += 18) {
        ctx.beginPath(); ctx.moveTo(x, v.y + 5); ctx.lineTo(x, v.y + v.h - 5); ctx.stroke();
      }
    } else {
      for (var y = v.y + 12; y < v.y + v.h - 6; y += 18) {
        ctx.beginPath(); ctx.moveTo(v.x + 5, y); ctx.lineTo(v.x + v.w - 5, y); ctx.stroke();
      }
    }
    // grate openings at both ends
    ctx.fillStyle = '#0a0f1c';
    if (horizontal) {
      ctx.fillRect(v.x + 2, v.y + 2, 16, v.h - 4);
      ctx.fillRect(v.x + v.w - 18, v.y + 2, 16, v.h - 4);
    } else {
      ctx.fillRect(v.x + 2, v.y + 2, v.w - 4, 16);
      ctx.fillRect(v.x + 2, v.y + v.h - 18, v.w - 4, 16);
    }
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v.label, v.x + v.w / 2, v.y + v.h / 2 + 4);
  }

  function drawBalcony(ctx, b) {
    ctx.fillStyle = '#232c47';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    // railing bars
    ctx.strokeStyle = 'rgba(201,162,39,0.8)';
    ctx.lineWidth = 2;
    var horizontal = b.w > b.h;
    if (horizontal) {
      for (var x = b.x + 14; x < b.x + b.w - 6; x += 22) {
        ctx.beginPath(); ctx.moveTo(x, b.y + 4); ctx.lineTo(x, b.y + b.h - 4); ctx.stroke();
      }
    } else {
      for (var y = b.y + 14; y < b.y + b.h - 6; y += 22) {
        ctx.beginPath(); ctx.moveTo(b.x + 4, y); ctx.lineTo(b.x + b.w - 4, y); ctx.stroke();
      }
    }
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (horizontal) ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4);
    else {
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(b.label, 0, 4);
      ctx.restore();
    }
  }

  function drawWall(ctx, w) {
    var g = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
    if (w.kind === 'telescope') { g.addColorStop(0, '#6b5220'); g.addColorStop(1, '#3a2c10'); }
    else if (w.kind === 'bookcase') { g.addColorStop(0, '#4a3220'); g.addColorStop(1, '#2c1d10'); }
    else if (w.kind === 'table') { g.addColorStop(0, '#5a4026'); g.addColorStop(1, '#33240f'); }
    else if (w.kind === 'pedestal') { g.addColorStop(0, '#54401c'); g.addColorStop(1, '#2e2110'); }
    else { g.addColorStop(0, '#3d4a68'); g.addColorStop(1, '#232c44'); }
    ctx.fillStyle = g;
    rr(ctx, w.x, w.y, w.w, w.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,150,0.25)';
    ctx.lineWidth = 1;
    rr(ctx, w.x + 5, w.y + 5, w.w - 10, w.h - 10, 5);
    ctx.stroke();
    if (w.label) {
      ctx.fillStyle = '#f2d98c';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.label, w.x + w.w / 2, w.y + w.h / 2 + 4);
    }
  }

  function drawGuard(ctx, g) {
    var chasing = g.state === 'CHASE';
    var color = chasing ? 'rgba(255,60,50,A)' : 'rgba(255,200,40,A)';
    drawCone(ctx, g.x, g.y, g.facing, SV.GUARD_VISION_HALF, SV.GUARD_VISION_RANGE, color);
    ctx.save();
    ctx.shadowColor = chasing ? '#ff3c32' : '#ffcc33';
    ctx.shadowBlur = 10;
    ctx.fillStyle = chasing ? '#7a1d18' : '#1d2f5e';
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.stroke();
    // facing tick + brass helmet dot
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
    ctx.stroke();
    ctx.fillStyle = '#e8c85a';
    ctx.beginPath(); ctx.arc(g.x, g.y - 3, 4, 0, Math.PI * 2); ctx.fill();
    // name + state
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(g.name, g.x, g.y - 22);
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillStyle = chasing ? '#ff6b5e' : (g.state === 'INVESTIGATE' ? '#ffb347' : '#9fb4dd');
    ctx.fillText(g.state, g.x, g.y + 28);
  }

  function drawCamera(ctx, c, S) {
    var blind = S.time < c.blindUntil;
    if (!blind) drawCone(ctx, c.x, c.y, c.angle, SV.CAMERA_HALF, c.range, 'rgba(255,60,50,A)');
    ctx.save();
    ctx.shadowColor = blind ? '#888' : '#ff3c32';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#6b5220';
    ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#e8c85a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = blind ? '#555' : '#ff2e22';
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = blind ? '#aaa' : '#ff8a80';
    ctx.fillText(blind ? 'CAMERA BLIND' : 'CAMERA', c.x, c.y - 18);
  }

  function drawLoot(ctx, S, room) {
    var p = S.player;
    // small coin pouches
    room.smallLoot.forEach(function (sl) {
      if (sl.taken) return;
      ctx.save();
      ctx.shadowColor = '#ffd94a'; ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath(); ctx.arc(sl.x, sl.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#7a5c00';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¢', sl.x, sl.y + 3.5);
    });
    if (S.lootTaken[S.room]) {
      // Room 3 keeps its (now empty) open glass case visible after the grab.
      if (S.room === 2) {
        var ex = room.casePos.x, ey = room.casePos.y;
        ctx.fillStyle = 'rgba(160,220,255,0.08)';
        rr(ctx, ex - 46, ey - 36, 92, 72, 8); ctx.fill();
        ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3;
        rr(ctx, ex - 46, ey - 36, 92, 72, 8); ctx.stroke();
        ctx.fillStyle = '#9fb4dd';
        ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GLASS CASE — EMPTY', ex, ey + 54);
      }
      return;
    }
    var lx = room.lootPos.x, ly = room.lootPos.y;
    if (S.room === 0) {
      // star chart: parchment with stars
      ctx.save();
      ctx.shadowColor = '#ffe9a8'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#f4e3b2';
      rr(ctx, lx - 34, ly - 24, 68, 48, 4); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#8a6d2f'; ctx.lineWidth = 2;
      rr(ctx, lx - 34, ly - 24, 68, 48, 4); ctx.stroke();
      ctx.fillStyle = '#27407a';
      [[-18, -8], [0, -12], [18, -6], [-8, 8], [12, 10]].forEach(function (pt) {
        ctx.beginPath(); ctx.arc(lx + pt[0], ly + pt[1], 2.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#27407a';
      ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('STAR CHART', lx, ly + 54);
    } else if (S.room === 1) {
      ctx.save();
      ctx.shadowColor = '#ffd94a'; ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(lx, ly, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx + 10, ly); ctx.lineTo(lx + 30, ly); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx + 22, ly); ctx.lineTo(lx + 26, ly - 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx + 22, ly); ctx.lineTo(lx + 26, ly + 7); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('BRASS KEY', lx, ly + 38);
    } else {
      // glass case + comet diamond
      ctx.save();
      ctx.shadowColor = '#9fe8ff'; ctx.shadowBlur = S.caseOpen ? 6 : 18;
      ctx.fillStyle = S.caseOpen ? 'rgba(160,220,255,0.10)' : 'rgba(160,220,255,0.28)';
      rr(ctx, lx - 46, ly - 36, 92, 72, 8); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3;
      rr(ctx, lx - 46, ly - 36, 92, 72, 8); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx - 46, ly - 36); ctx.lineTo(lx + 46, ly + 36); ctx.stroke();
      SV.drawDiamond(ctx, lx, ly, 20, true);
      ctx.fillStyle = '#bfefff';
      ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(S.caseOpen ? 'COMET DIAMOND — GRAB IT!' : 'COMET DIAMOND — IN GLASS CASE', lx, ly + 54);
      if (S.caseOpen) {
        ctx.fillStyle = '#ffb347';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('RESEALS IN ' + Math.ceil(S.caseTimer) + 's', lx, ly - 48);
      }
    }
  }

  function drawPlayer(ctx, S) {
    var p = S.player;
    ctx.save();
    ctx.shadowColor = '#8a5cff'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#241a3d';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#b79bff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    // hood + gold mask
    ctx.fillStyle = '#e8c85a';
    ctx.beginPath(); ctx.arc(p.x, p.y - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.facing) * 18, p.y + Math.sin(p.facing) * 18);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('YOU — THE THIEF', p.x, p.y + 27);
  }

  function alarmLabel(a) {
    if (a < 25) return 'CALM';
    if (a < 50) return 'UNEASY';
    if (a < 75) return 'HUNTED';
    return 'ALARM';
  }
  function alarmColor(a) {
    if (a < 25) return '#58d68d';
    if (a < 50) return '#ffd94a';
    if (a < 75) return '#ff8c42';
    return '#ff3c32';
  }

  SV.render = function (ctx, S) {
    var room = SV.ROOMS[S.room];
    ctx.clearRect(0, 0, 1280, 800);
    // backdrop
    ctx.fillStyle = '#070b16';
    ctx.fillRect(0, 0, 1280, 800);

    drawFloor(ctx, S);
    room.vents.forEach(function (v) { drawVent(ctx, v); });
    room.balconies.forEach(function (b) { drawBalcony(ctx, b); });
    (room.stairs || []).forEach(function (st) {
      ctx.fillStyle = '#2a3350';
      ctx.fillRect(st.x, st.y, st.w, st.h);
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5;
      ctx.strokeRect(st.x, st.y, st.w, st.h);
      ctx.fillStyle = '#e8c85a';
      ctx.font = 'bold 10px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('STAIRS', st.x + st.w / 2, st.y + st.h / 2 + 3);
    });
    room.walls.forEach(function (w) { drawWall(ctx, w); });
    // exit door / zipline
    if (room.exit) {
      ctx.fillStyle = '#3a2c10';
      ctx.fillRect(room.exit.x, room.exit.y, room.exit.w, room.exit.h);
      ctx.strokeStyle = '#e8c85a'; ctx.lineWidth = 2.5;
      ctx.strokeRect(room.exit.x, room.exit.y, room.exit.w, room.exit.h);
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(room.exit.label, room.exit.x + room.exit.w / 2, room.exit.y + 26);
    }
    if (room.zipline) {
      var z = room.zipline;
      ctx.strokeStyle = '#e8c85a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(z.x + 40, z.y + 30); ctx.lineTo(1272, 72); ctx.stroke();
      ctx.fillStyle = '#3a2c10';
      rr(ctx, z.x, z.y, z.w, z.h, 6); ctx.fill();
      ctx.strokeStyle = '#e8c85a'; ctx.lineWidth = 2.5;
      rr(ctx, z.x, z.y, z.w, z.h, 6); ctx.stroke();
      ctx.fillStyle = S.diamondTaken ? '#7dff9e' : '#ffe9a8';
      ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ZIPLINE', z.x + 40, z.y + 26);
      ctx.fillText('GETAWAY', z.x + 40, z.y + 42);
    }
    drawLoot(ctx, S, room);
    // smoke cloud
    if (S.smokeUntil > S.time && S.smokePos) {
      ctx.fillStyle = 'rgba(200,200,210,0.35)';
      ctx.beginPath(); ctx.arc(S.smokePos.x, S.smokePos.y, 90, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(220,220,230,0.35)';
      ctx.beginPath(); ctx.arc(S.smokePos.x - 30, S.smokePos.y + 15, 55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(S.smokePos.x + 35, S.smokePos.y - 10, 60, 0, Math.PI * 2); ctx.fill();
    }
    S.cameras.forEach(function (c) { drawCamera(ctx, c, S); });
    S.guards.forEach(function (g) { drawGuard(ctx, g); });
    drawPlayer(ctx, S);

    // room title on the playfield (below the top vent / balcony strips)
    ctx.fillStyle = '#f2d98c';
    ctx.font = 'bold 20px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(room.name, 280, 150);
    ctx.fillStyle = '#9fb4dd';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(room.sub, 280, 170);

    // ---------- HUD (top bar) ----------
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, 1280, 64);
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 64); ctx.lineTo(1280, 64); ctx.stroke();
    ctx.fillStyle = '#f2d98c';
    ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('★ STARLIGHT VAULT', 14, 28);
    ctx.fillStyle = '#9fb4dd';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('midnight observatory heist', 14, 48);
    // objective
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    var obj = S.diamondTaken ? 'OBJECTIVE: reach the ZIPLINE!' :
      ('OBJECTIVE: steal the ' + room.lootName);
    ctx.fillText(obj, 300, 28);
    ctx.fillStyle = '#9fb4dd';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Loot ' + S.lootTaken.filter(Boolean).length + '/3   •   Room ' + (S.room + 1) + '/3', 300, 48);
    // alarm meter
    var ax = 640, ay = 16, aw = 230, ah = 20;
    ctx.fillStyle = '#1a2233';
    rr(ctx, ax, ay, aw, ah, 5); ctx.fill();
    ctx.fillStyle = alarmColor(S.alarm);
    if (S.alarm > 0.5) { rr(ctx, ax, ay, aw * (S.alarm / 100), ah, 5); ctx.fill(); }
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5;
    rr(ctx, ax, ay, aw, ah, 5); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('ALARM ' + alarmLabel(S.alarm) + '  ' + Math.round(S.alarm), ax, ay + 34);
    // coins + tools + timer
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('◉ ' + S.coins + ' coins', 1150, 26);
    ctx.fillStyle = '#fff';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('lockpick ×' + S.tools.lockpick + '   smoke ×' + S.tools.smoke + '   lens ×' + S.tools.lenscap, 1150, 46);
    ctx.fillStyle = '#9fb4dd';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(S.timeStr, 1268, 26);

    // ---------- Legend (left panel) ----------
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 64, 176, 736);
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(176, 64); ctx.lineTo(176, 800); ctx.stroke();
    var lx = 14, ly = 92;
    ctx.fillStyle = '#f2d98c';
    ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('LEGEND', lx, ly); ly += 26;
    ctx.font = '13px system-ui, sans-serif';
    function legendRow(color, text) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(lx + 7, ly - 4, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dfe6f5';
      ctx.fillText(text, lx + 20, ly);
      ly += 22;
    }
    legendRow('rgba(255,200,40,0.9)', 'Guard cone — seen!');
    legendRow('rgba(255,60,50,0.9)', 'Camera cone — seen!');
    legendRow('rgba(88,214,141,0.9)', 'Vent / balcony — safe');
    legendRow('#9fe8ff', 'Loot — glowing');
    ly += 10;
    ctx.fillStyle = '#f2d98c';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('CONTROLS', lx, ly); ly += 22;
    ctx.fillStyle = '#dfe6f5';
    ctx.font = '12px system-ui, sans-serif';
    ['WASD / arrows — move', 'E — take / open / exit', '1 lockpick 10¢', '2 smoke bomb 15¢', '3 lens cap 8¢', 'F — throw smoke', 'C — cap a camera', 'R — retry after caught'].forEach(function (t) {
      ctx.fillText(t, lx, ly); ly += 19;
    });
    ly += 12;
    ctx.fillStyle = '#f2d98c';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('ROUTES', lx, ly); ly += 22;
    ctx.fillStyle = '#dfe6f5';
    ctx.font = '12px system-ui, sans-serif';
    ['Main floor — fast,', 'watched by cones', 'Vent — quiet,', 'guards never enter', 'Balcony — high,', 'stairs at one end'].forEach(function (t) {
      ctx.fillText(t, lx, ly); ly += 19;
    });
    ly += 12;
    ctx.fillStyle = '#f2d98c';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('THE CREW', lx, ly); ly += 22;
    ctx.fillStyle = '#dfe6f5';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('MARA — patrols', lx, ly); ly += 19;
    ctx.fillText('JULES — patrols', lx, ly); ly += 19;
    ctx.fillText('Brass-eye cameras', lx, ly); ly += 19;
    ctx.fillText('sweep red cones', lx, ly); ly += 19;
    ly += 12;
    ctx.fillStyle = '#9fb4dd';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Chase speed 2.95 —', lx, ly); ly += 16;
    ctx.fillText('faster than you (2.6).', lx, ly); ly += 16;
    ctx.fillText('Break line of sight', lx, ly); ly += 16;
    ctx.fillText('to drop a chase.', lx, ly);

    // ---------- banner (bottom centre, always inside the frame) ----------
    if (S.time < S.bannerUntil && S.banner) {
      ctx.font = 'bold 17px system-ui, sans-serif';
      var bw = ctx.measureText(S.banner).width + 36;
      var bx = 640 - bw / 2, by = 756;
      ctx.fillStyle = 'rgba(10,15,30,0.92)';
      rr(ctx, bx, by, bw, 34, 8); ctx.fill();
      ctx.strokeStyle = '#e8c85a'; ctx.lineWidth = 2;
      rr(ctx, bx, by, bw, 34, 8); ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      ctx.textAlign = 'center';
      ctx.fillText(S.banner, 640, by + 23);
    }

    // near-use prompt
    var prompt = SV.nearPrompt(S, room);
    if (prompt && !S.caught && !S.won) {
      ctx.font = 'bold 14px system-ui, sans-serif';
      var pw = ctx.measureText(prompt).width + 28;
      ctx.fillStyle = 'rgba(10,15,30,0.9)';
      rr(ctx, S.player.x - pw / 2, S.player.y - 62, pw, 28, 7); ctx.fill();
      ctx.strokeStyle = '#7dff9e'; ctx.lineWidth = 1.5;
      rr(ctx, S.player.x - pw / 2, S.player.y - 62, pw, 28, 7); ctx.stroke();
      ctx.fillStyle = '#7dff9e';
      ctx.textAlign = 'center';
      ctx.fillText(prompt, S.player.x, S.player.y - 43);
    }

    // ---------- overlays ----------
    if (S.caught) {
      ctx.fillStyle = 'rgba(20,4,6,0.82)';
      ctx.fillRect(184, 72, 1088, 720);
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 64px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CAUGHT!', 728, 340);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText((S.caughtBy || 'A guard') + ' caught you in the ' + room.name, 728, 392);
      ctx.fillStyle = '#ffd94a';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('The chase was fair — you were warned, then hunted.', 728, 428);
      ctx.fillText('Hide in a vent, throw smoke, or break line of sight next time.', 728, 456);
      ctx.fillStyle = '#9fb4dd';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('Press R to retry the heist', 728, 510);
      ctx.fillStyle = '#fff';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Loot ' + S.lootTaken.filter(Boolean).length + '/3   •   Alarm hit ' + Math.round(S.alarm) + '   •   ' + S.timeStr, 728, 544);
    }
    if (S.won) {
      ctx.fillStyle = 'rgba(6,16,10,0.82)';
      ctx.fillRect(184, 72, 1088, 720);
      ctx.fillStyle = '#ffd94a';
      ctx.font = 'bold 58px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CLEAN GETAWAY!', 728, 340);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('The Comet Diamond is yours — ziplined out under the stars.', 728, 392);
      SV.drawDiamond(ctx, 728, 460, 26, true);
      ctx.fillStyle = '#ffd94a';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('Loot 3/3 — Star Chart, Brass Key, Comet Diamond', 728, 520);
      ctx.fillStyle = '#9fb4dd';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('Time ' + S.timeStr + '   •   Press R to play again', 728, 556);
    }
  };
})();
