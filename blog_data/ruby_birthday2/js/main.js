/* ============================================================
   主逻辑：彩带特效(FX)、生日歌/音效(Song)、倒计时、首屏互动、背景漂浮
   ============================================================ */
(function () {
  'use strict';
  var CFG = window.CONFIG;

  /* ---------------- 彩带特效 ---------------- */
  window.FX = (function () {
    var canvas = document.getElementById('confetti-canvas');
    var ctx = canvas.getContext('2d');
    var parts = [];
    var raf = null;
    var COLORS = ['#F06292', '#FFD54F', '#7EC8F0', '#8CE0B0', '#C5A3FF', '#FF8A65', '#FF5C8A'];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter(function (p) { return p.life > 0 && p.y < canvas.height + 40; });
      parts.forEach(function (p) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        p.vx *= 0.99; p.life -= p.decay;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(Math.min(p.life, 1), 0);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, 7);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      });
      if (parts.length) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    function start() { if (!raf) raf = requestAnimationFrame(loop); }

    /* 在某一点炸开一圈 */
    function burst(x, y, n) {
      n = n || 90;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = 2 + Math.random() * 7;
        parts.push({
          x: x, y: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
          g: .18, size: 5 + Math.random() * 6,
          rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
          color: COLORS[i % COLORS.length],
          shape: Math.random() < .4 ? 'circle' : 'rect',
          life: 1, decay: .006 + Math.random() * .006
        });
      }
      start();
    }

    /* 从天而降一阵子 */
    function rain(ms) {
      ms = ms || 2600;
      var t0 = Date.now();
      var iv = setInterval(function () {
        if (Date.now() - t0 > ms) { clearInterval(iv); return; }
        for (var i = 0; i < 6; i++) {
          parts.push({
            x: Math.random() * canvas.width, y: -20,
            vx: (Math.random() - .5) * 2, vy: 1 + Math.random() * 3,
            g: .05, size: 6 + Math.random() * 7,
            rot: Math.random() * 6, vr: (Math.random() - .5) * .25,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            shape: Math.random() < .4 ? 'circle' : 'rect',
            life: 1.4, decay: .004
          });
        }
        start();
      }, 90);
    }

    return { burst: burst, rain: rain };
  })();

  /* ---------------- 卢比比之歌 & 音效（Web Audio 合成，无需音频文件） ---------------- */
  window.Song = (function () {
    var ctx = null, playing = false, nodes = [], stopTimer = null, btn = null;
    function nf(s) { return 440 * Math.pow(2, s / 12); }
    var BEAT = .42;  /* 一拍的秒数 */
    /* 《祝你生日快乐》旋律：[相对A4的半音数, 拍数] */
    var MELODY = [
      [-2, .75], [-2, .25], [0, 1], [-2, 1], [3, 1], [2, 1.9],
      [-2, .75], [-2, .25], [0, 1], [-2, 1], [5, 1], [3, 1.9],
      [-2, .75], [-2, .25], [10, 1], [7, 1], [3, 1], [2, 1], [0, 1.9],
      [-2, .75], [-2, .25], [8, 1], [7, 1], [3, 1], [5, 1], [3, 2.4]
    ];
    var LINE_START = [0, 6, 12, 19];   /* 四句在旋律里的起始音序号 */
    var LINE_LEN = [6, 6, 7, 7];       /* 每句的音符数 */
    /* 四句歌词：每句开唱后，每字隔半拍落下（念白式，紧凑上口） */
    var WORDS = [
      ['我', '叫', '卢', '比', '比'],
      ['天', '天', '发', '神', '经'],
      ['没', '事', '打', '游', '戏'],
      ['然', '后', '乱', '放', '屁']
    ];

    function ensure() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    }
    function tone(freq, t, dur, vol, type) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'triangle';
      o.frequency.value = freq;
      vol = vol || .22;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + .03);
      g.gain.setValueAtTime(vol, t + Math.max(dur - .08, .03));
      g.gain.linearRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + .05);
      nodes.push(o);
    }
    function heroDance(on) {
      var r = document.getElementById('hero-ruby');
      if (r) r.classList.toggle('dancing', on);
    }
    function updateBtn() {
      if (!btn) return;
      btn.innerHTML = playing ? '⏹ 停止播放' : '🎤 播放卢比比之歌';
      btn.classList.toggle('btn-playing', playing);
    }
    /* 逐字唱：一个字一个语音，钉在音符的时间点上，语调高低跟着音符走 */
    if (window.speechSynthesis) { try { window.speechSynthesis.getVoices(); } catch (e) { /* 忽略 */ } }
    function singChar(ch, at, semi, held) {
      if (!window.speechSynthesis) return;
      setTimeout(function () {
        if (!playing) return;
        var u = new SpeechSynthesisUtterance(ch);
        u.lang = 'zh-CN';
        u.pitch = Math.max(.6, Math.min(1.8, .9 + (semi + 2) / 12 * .5));
        u.rate = held ? .8 : 1.9;
        var vs = window.speechSynthesis.getVoices();
        for (var i = 0; i < vs.length; i++) {
          if (vs[i].lang && vs[i].lang.indexOf('zh') === 0) { u.voice = vs[i]; break; }
        }
        window.speechSynthesis.speak(u);
      }, Math.max(0, (at - ctx.currentTime) * 1000));
    }
    function play() {
      ensure();
      playing = true; updateBtn();
      var t = ctx.currentTime + .15;
      /* 旋律：先排好每个音的精确时间 */
      var noteT = [];
      MELODY.forEach(function (n) {
        noteT.push(t);
        tone(nf(n[0]), t, n[1] * BEAT, .2, 'triangle');
        t += n[1] * BEAT;
      });
      heroDance(true);
      /* 四句歌词：开唱后每字隔四分之一拍落下，机关枪念白 */
      for (var li = 0; li < 4; li++) {
        var base = noteT[LINE_START[li]];
        for (var ci = 0; ci < WORDS[li].length; ci++) {
          var ni = LINE_START[li] + Math.min(ci, LINE_LEN[li] - 1);
          singChar(WORDS[li][ci], base + ci * BEAT * .25, MELODY[ni][0], false);
        }
      }
      /* 曲终：干净收尾 */
      window.FX.rain(2200);
      stopTimer = setTimeout(stop, (t - ctx.currentTime) * 1000 + 300);
    }
    function stop() {
      playing = false;
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
      nodes.forEach(function (o) { try { o.stop(); } catch (e) { /* 已结束 */ } });
      nodes = [];
      clearTimeout(stopTimer);
      heroDance(false);
      updateBtn();
    }
    /* 小音效：游戏点击 / 配对 / 胜利 */
    function sfx(kind) {
      try {
        ensure();
        var t = ctx.currentTime;
        if (kind === 'hit') { tone(660, t, .12, .18, 'square'); tone(990, t + .06, .1, .15, 'square'); }
        else if (kind === 'bad') { tone(200, t, .2, .2, 'sawtooth'); }
        else if (kind === 'match') { tone(523, t, .12, .18); tone(659, t + .1, .14, .18); }
        else if (kind === 'flip') { tone(440, t, .06, .12, 'sine'); }
        else if (kind === 'win') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * .12, .25, .2); }); }
      } catch (e) { /* 音频不可用时静默 */ }
    }

    return { toggle: function () { playing ? stop() : play(); }, sfx: sfx, setButton: function (b) { btn = b; } };
  })();

  /* ---------------- 页面初始化 ---------------- */
  document.title = CFG.name + '卢比比的生日派对 🎂';
  var nameEl = document.getElementById('hero-name');
  if (nameEl) nameEl.textContent = CFG.name;

  /* 首屏卢比比：点击换表情 + 弹跳 + 撒彩带 */
  var heroRuby = document.getElementById('hero-ruby');
  var HERO_IMGS = ['hero.jpg', 'smile.jpg', 'bee.jpg', 'cheer.jpg', 'confused.jpg', 'sleepy.jpg', 'laugh1.jpg', 'shy.jpg'];
  var heroIdx = 0;
  function renderHero(i) {
    heroRuby.innerHTML = '<img src="images/' + HERO_IMGS[i % HERO_IMGS.length] + '" alt="卢比比">';
  }
  renderHero(0);
  heroRuby.addEventListener('click', function (e) {
    heroIdx++;
    renderHero(heroIdx);
    heroRuby.classList.remove('bounce');
    void heroRuby.offsetWidth; /* 强制重排，让动画可以重复播放 */
    heroRuby.classList.add('bounce');
    window.FX.burst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 70);
    window.Song.sfx('flip');
  });

  var footerRuby = document.getElementById('footer-ruby');
  if (footerRuby) footerRuby.innerHTML = '<img src="images/smile.jpg" alt="卢比比">';

  var songBtn = document.getElementById('song-btn');
  window.Song.setButton(songBtn);
  songBtn.addEventListener('click', window.Song.toggle);

  /* ---------------- 生日倒计时 ---------------- */
  var cd = document.getElementById('countdown');
  var label = document.getElementById('countdown-label');
  var tiles = document.querySelector('.countdown-tiles');
  var elD = document.getElementById('cd-days');
  var elH = document.getElementById('cd-hours');
  var elM = document.getElementById('cd-mins');
  var elS = document.getElementById('cd-secs');
  var partied = false;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var b = CFG.birthday;
    var now = new Date();
    if (now.getMonth() + 1 === b.month && now.getDate() === b.day) {
      cd.classList.add('today');
      tiles.style.display = 'none';
      label.textContent = '🎉 今天就是 ' + CFG.name + ' 的生日！祝她生日快乐！🎉';
      if (!partied) { partied = true; window.FX.rain(4000); }
      return;
    }
    var target = new Date(now.getFullYear(), b.month - 1, b.day);
    if (target <= now) target = new Date(now.getFullYear() + 1, b.month - 1, b.day);
    var diff = Math.floor((target - now) / 1000);
    elD.textContent = Math.floor(diff / 86400);
    elH.textContent = pad(Math.floor(diff % 86400 / 3600));
    elM.textContent = pad(Math.floor(diff % 3600 / 60));
    elS.textContent = pad(diff % 60);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- 背景漂浮装饰 ---------------- */
  var bg = document.getElementById('bg-fx');
  var ICONS = ['🎈', '🎈', '🎉', '🎂', '🌸', '🎁', '⭐', '🩷', '🪵', '🎀'];
  for (var i = 0; i < 14; i++) {
    var sp = document.createElement('span');
    sp.textContent = ICONS[Math.floor(Math.random() * ICONS.length)];
    sp.style.left = (Math.random() * 96) + '%';
    sp.style.fontSize = (16 + Math.random() * 26) + 'px';
    var dur = 14 + Math.random() * 16;
    sp.style.animationDuration = dur + 's';
    sp.style.animationDelay = (-Math.random() * dur) + 's';
    bg.appendChild(sp);
  }
})();
