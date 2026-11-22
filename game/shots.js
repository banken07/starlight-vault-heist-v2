// shots.js — deterministic staging for screenshots and verification.
// ?shot=1 cover, ?shot=2 camera, ?shot=3 lockpick, ?shot=4 zipline,
// ?shot=5 CAUGHT overlay, ?shot=6 WIN overlay. Staged frames freeze the
// guards in place so every capture of the same shot looks the same.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;

  SV.shotFromUrl = function () {
    try {
      var m = /[?&]shot=(\d)/.exec(window.location.search || '');
      return m ? parseInt(m[1], 10) : 0;
    } catch (e) { return 0; }
  };

  SV.applyShot = function (S, n) {
    if (!n || n < 1 || n > 6) return;
    S.staged = true;
    S.shot = n;
    var room;
    if (n === 1) {
      // COVER: Star Vault, diamond in case, top camera cone tip on the
      // case, both guards with cones, alarm UNEASY.
      SV.enterRoom(S, 2);
      room = SV.ROOMS[2];
      S.alarm = 35;
      S.coins = 24;
      S.tools.lockpick = 1;
      S.lootTaken = [true, true, false];
      S.player.x = 330; S.player.y = 640; S.player.facing = 0.5;
      S.guards[0].x = 500; S.guards[0].y = 345; S.guards[0].facing = 0.35; S.guards[0].state = 'PATROL';
      S.guards[1].x = 980; S.guards[1].y = 650; S.guards[1].facing = -2.2; S.guards[1].state = 'PATROL';
      S.cameras[0].angle = 1.273; // frozen: cone tip touches the glass case
      S.banner = 'THE STAR VAULT — STEAL THE COMET DIAMOND';
      S.bannerUntil = 9999;
    } else if (n === 2) {
      // CAMERA: Map Room, thief behind a bookcase, camera sweeping, CALM.
      SV.enterRoom(S, 0);
      S.alarm = 8;
      S.coins = 12;
      S.player.x = 520; S.player.y = 545; S.player.facing = -Math.PI / 2;
      S.guards[0].x = 780; S.guards[0].y = 250; S.guards[0].facing = 1.2; S.guards[0].state = 'PATROL';
      S.cameras[0].angle = 1.5;
      S.banner = 'CAMERA SWEEPING — WAIT FOR THE GAP';
      S.bannerUntil = 9999;
    } else if (n === 3) {
      // LOCKPICK: Star Vault, case open, reseal countdown, UNEASY, JULES near.
      SV.enterRoom(S, 2);
      S.alarm = 38;
      S.coins = 14;
      S.lootTaken = [true, true, false];
      S.caseOpen = true;
      S.caseTimer = 9;
      S.player.x = 700; S.player.y = 510; S.player.facing = -Math.PI / 2;
      S.guards[0].x = 500; S.guards[0].y = 345; S.guards[0].facing = 0.5; S.guards[0].state = 'PATROL';
      S.guards[1].x = 950; S.guards[1].y = 650; S.guards[1].facing = -1.8; S.guards[1].state = 'INVESTIGATE';
      S.banner = 'LOCKPICKED — RESEALS IN 9s. GRAB THE DIAMOND!';
      S.bannerUntil = 9999;
    } else if (n === 4) {
      // ZIPLINE: Star Vault, loot 3/3, HUNTED, both guards chasing,
      // thief at the zipline, banner centred in the frame.
      SV.enterRoom(S, 2);
      S.alarm = 62;
      S.coins = 4;
      S.lootTaken = [true, true, true];
      S.diamondTaken = true;
      S.player.x = 1160; S.player.y = 150; S.player.facing = 0.8;
      S.guards[0].x = 900; S.guards[0].y = 300; S.guards[0].facing = 0.9; S.guards[0].state = 'CHASE'; S.guards[0].suspicion = 1;
      S.guards[1].x = 1000; S.guards[1].y = 420; S.guards[1].facing = 0.5; S.guards[1].state = 'CHASE'; S.guards[1].suspicion = 1;
      S.banner = 'GO! GO! GO! — ZIPLINE OUT!';
      S.bannerUntil = 9999;
    } else if (n === 5) {
      // CAUGHT overlay proof.
      SV.enterRoom(S, 2);
      S.alarm = 88;
      S.lootTaken = [true, true, false];
      S.caught = true;
      S.caughtBy = 'MARA';
      S.timeStr = '02:41';
      S.banner = '';
      S.bannerUntil = 0;
    } else if (n === 6) {
      // WIN overlay proof.
      SV.enterRoom(S, 2);
      S.alarm = 47;
      S.lootTaken = [true, true, true];
      S.diamondTaken = true;
      S.won = true;
      S.timeStr = '03:12';
      S.banner = '';
      S.bannerUntil = 0;
    }
  };
})();
