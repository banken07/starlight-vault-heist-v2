// input.js — keyboard: move, interact, buy and use tools, retry.
window.SV = window.SV || {};
(function () {
  var SV = window.SV;
  SV.keys = {};

  SV.bindInput = function (S) {
    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      SV.keys[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
      SV.unlockAudio();
      if (k === 'e') SV.interact(S, SV.ROOMS[S.room]);
      if (k === '1') SV.buyTool(S, 'lockpick');
      if (k === '2') SV.buyTool(S, 'smoke');
      if (k === '3') SV.buyTool(S, 'lenscap');
      if (k === 'f') SV.useSmoke(S);
      if (k === 'c') SV.useLensCap(S);
      if (k === 'r' && (S.caught || S.won)) SV.resetGame(S);
      // room jump for playtesting (not shown in the legend)
      if (k === '7') SV.enterRoom(S, 0);
      if (k === '8') SV.enterRoom(S, 1);
      if (k === '9') SV.enterRoom(S, 2);
    });
    window.addEventListener('keyup', function (e) {
      SV.keys[e.key.toLowerCase()] = false;
    });
    window.addEventListener('mousedown', function () { SV.unlockAudio(); });
  };
})();
