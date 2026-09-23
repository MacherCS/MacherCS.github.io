/* ============================================================
   祝福墙：三张固定祝福卡（各附一段生日顺口溜）
   ============================================================ */
(function () {
  'use strict';

  var CARDS = [
    {
      name: '祝福1',
      text: '卢比比，财运旺，\n金元宝，排成行；\n工资涨，红包抢，\n钱包鼓得像太阳；\n祝你早日暴富，\n财富自由把歌唱！💰',
      avatar: 'money.jpg', c: '#FFF6BF', t: Date.now()
    },
    {
      name: '祝福2',
      text: '卢比比，身体棒，\n牙口好，吃嘛香；\n早睡早起精神爽，\n跑跑跳跳像弹簧；\n小病小痛全跑光，\n健健康康寿命长！💪',
      avatar: 'cheer.jpg', c: '#D5F5E3', t: Date.now()
    },
    {
      name: '祝福3',
      text: '卢比比，心情好，\n烦恼见她绕道跑；\n开心事儿天天好，\n嘴角翘得像蜜桃；\n祝你天天乐淘淘，\n年年十八不会老！🌈',
      avatar: 'smile.jpg', c: '#FFDAD6', t: Date.now()
    }
  ];

  var gridEl = document.getElementById('wish-grid');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function fmtDate(t) {
    var d = new Date(t);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  CARDS.forEach(function (w) {
    var el = document.createElement('div');
    el.className = 'wish-card';
    el.style.setProperty('--c', w.c);
    el.style.setProperty('--r', ((Math.random() * 3) - 1.5).toFixed(2) + 'deg');
    el.innerHTML =
      '<div class="wish-head"><img class="wish-avatar" src="images/' + w.avatar + '" alt="卢比比"><b>' + esc(w.name) + '</b></div>' +
      '<p class="wish-text">' + esc(w.text) + '</p>' +
      '<time>' + fmtDate(w.t) + '</time>';
    /* 点卡片重播一次弹跳 */
    el.addEventListener('click', function () {
      el.classList.remove('new');
      void el.offsetWidth;
      el.classList.add('new');
    });
    gridEl.appendChild(el);
  });
})();
