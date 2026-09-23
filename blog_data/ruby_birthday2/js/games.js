/* ============================================================
   卢比比打地鼠（使用真实卢比比表情包图片）
   普通卢比比 +10 / 大笑卢比比 +25 / 墨镜拽酷卢比比 -15
   ============================================================ */
(function () {
  'use strict';

  var KINDS = {
    normal: { files: ['smile.jpg', 'bee.jpg', 'shock.jpg'], pts: 10 },
    laugh:  { files: ['laugh1.jpg', 'hero.jpg'],            pts: 25 },
    cool:   { files: ['cool.jpg'],                           pts: -15 }
  };

  var grid = document.getElementById('whack-grid');
  var scoreEl = document.getElementById('whack-score');
  var timeEl = document.getElementById('whack-time');
  var bestEl = document.getElementById('whack-best');
  var startBtn = document.getElementById('whack-start');
  var overEl = document.getElementById('whack-over');
  var finalEl = document.getElementById('whack-final');
  var rankEl = document.getElementById('whack-rank');

  var GAME_SECS = 30;
  var score = 0, best = 0, timeLeft = GAME_SECS, running = false;
  var spawnT = null, tickI = null;

  /* 建 9 个洞 */
  for (var i = 0; i < 9; i++) {
    var hole = document.createElement('div');
    hole.className = 'hole';
    hole.innerHTML = '<div class="hole-mouth"></div><div class="ruby-wrap"></div><div class="hole-lip"></div>';
    hole.addEventListener('pointerdown', onWhack);
    grid.appendChild(hole);
  }
  var holes = Array.prototype.slice.call(grid.children);

  function onWhack(e) {
    if (!running) return;
    var holeEl = e.currentTarget;
    var wrap = holeEl.querySelector('.ruby-wrap');
    if (!holeEl.classList.contains('up') || wrap.dataset.hit === '1') return;
    wrap.dataset.hit = '1';
    wrap.dataset.token = ''; /* 让隐藏定时器失效 */
    var pts = KINDS[wrap.dataset.kind].pts;
    score = Math.max(0, score + pts);
    scoreEl.textContent = score;
    floatScore(holeEl, (pts > 0 ? '+' : '') + pts, pts < 0);
    window.Song.sfx(pts < 0 ? 'bad' : 'hit');
    holeEl.classList.remove('up');
  }

  function floatScore(holeEl, txt, bad) {
    var s = document.createElement('span');
    s.className = 'float-score' + (bad ? ' bad' : '');
    s.textContent = txt;
    holeEl.appendChild(s);
    setTimeout(function () { s.remove(); }, 800);
  }

  function showMole() {
    var free = holes.filter(function (h) { return !h.classList.contains('up'); });
    if (!free.length) return;
    var holeEl = free[Math.floor(Math.random() * free.length)];
    var r = Math.random();
    var kind = r < .15 ? 'cool' : (r < .32 ? 'laugh' : 'normal');
    var files = KINDS[kind].files;
    var file = files[Math.floor(Math.random() * files.length)];
    var wrap = holeEl.querySelector('.ruby-wrap');
    var token = String(Math.random());
    wrap.dataset.hit = '0';
    wrap.dataset.kind = kind;
    wrap.dataset.token = token;
    wrap.innerHTML = '<img src="images/' + file + '" alt="卢比比">';
    holeEl.classList.add('up');
    /* 越到后面卢比比缩得越快 */
    var elapsed = GAME_SECS - timeLeft;
    var upDur = Math.max(520, 900 - elapsed * 13);
    setTimeout(function () {
      if (wrap.dataset.token === token) holeEl.classList.remove('up');
    }, upDur);
  }

  function loopSpawn() {
    if (!running) return;
    showMole();
    var elapsed = GAME_SECS - timeLeft;
    var gap = Math.max(380, 950 - elapsed * 18);
    spawnT = setTimeout(loopSpawn, gap);
  }

  function start() {
    if (running) return;
    running = true;
    score = 0; timeLeft = GAME_SECS;
    scoreEl.textContent = '0';
    timeEl.textContent = String(GAME_SECS);
    overEl.classList.add('hidden');
    startBtn.disabled = true;
    startBtn.textContent = '游戏中...';
    holes.forEach(function (h) { h.classList.remove('up'); });
    tickI = setInterval(function () {
      timeLeft--;
      timeEl.textContent = String(Math.max(timeLeft, 0));
      if (timeLeft <= 0) end();
    }, 1000);
    loopSpawn();
  }

  function end() {
    running = false;
    clearTimeout(spawnT);
    clearInterval(tickI);
    holes.forEach(function (h) { h.classList.remove('up'); });
    startBtn.disabled = false;
    startBtn.textContent = '再来一局';
    finalEl.textContent = String(score);
    if (score > best) { best = score; bestEl.textContent = String(best); }
    rankEl.textContent =
      score >= 250 ? '卢比比认证：木头大师！🪵' :
      score >= 150 ? '超级敏捷！卢比比被你摸秃了 😂' :
      score >= 80 ? '不错不错，卢比比很开心～' :
      '多练练，卢比比在等你哦！';
    overEl.classList.remove('hidden');
    if (score > 0) {
      window.Song.sfx('win');
      window.FX.rain(2200);
    }
  }

  startBtn.addEventListener('click', start);
})();
