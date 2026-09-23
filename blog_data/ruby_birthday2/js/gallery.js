/* ============================================================
   表情包画廊：网络真实卢比比表情包 + 点击放大弹窗
   ============================================================ */
(function () {
  'use strict';

  var DATA = [
    { file: 'laugh1.jpg',   title: '大笑卢比比',   caption: '哈哈哈哈泰裤辣！' },
    { file: 'smile.jpg',     title: '开心卢比比',   caption: '今天尊嘟超开心！' },
    { file: 'bee.jpg',       title: '软萌卢比比',   caption: '小小一只，萌力 max！' },
    { file: 'shock.jpg',     title: '呆萌卢比比',   caption: '啊？你再说一遍？' },
    { file: 'cry1.jpg',      title: '哭哭卢比比',   caption: '呜呜呜，痛痛' },
    { file: 'cry2.jpg',      title: '流泪卢比比',   caption: '眼泪汪汪，谁欺负我了' },
    { file: 'confused.jpg',  title: '学问卢比比',   caption: '我不李姐？' },
    { file: 'sleepy.jpg',    title: '睡觉卢比比',   caption: '困困，先睡为敬 zZZ' },
    { file: 'cool.jpg',      title: '拽酷卢比比',   caption: '墨镜一戴，谁都不爱' },
    { file: 'cheer.jpg',     title: '加油卢比比',   caption: '又是努力活下去的一天！加油！' },
    { file: 'money.jpg',     title: '发财卢比比',   caption: '啃个金元宝，财运旺旺！' },
    { file: 'shy.jpg',       title: '害羞卢比比',   caption: '干嘛啦，人家会害羞的啦～' },
    { file: 'work1.jpg',     title: '打工人卢比比', caption: '勤勤恳恳，打工本狸 🧹' },
    { file: 'work2.jpg',     title: '摆烂卢比比',   caption: '今天什么也没干，还是辛苦我了' },
    { file: 'work3.jpg',     title: '吃饼卢比比',   caption: '老板画的饼，吃不完了 🫓' },
    { file: 'work4.jpg',     title: '讨薪卢比比',   caption: '工资什么时候发？！💸' }
  ];

  var grid = document.getElementById('gallery-grid');
  var modal = document.getElementById('gallery-modal');
  var modalRuby = document.getElementById('modal-ruby');
  var modalTitle = document.getElementById('modal-title');
  var modalCaption = document.getElementById('modal-caption');

  DATA.forEach(function (item) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'gallery-card';
    card.innerHTML =
      '<img src="images/' + item.file + '" loading="lazy" alt="' + item.title + '">' +
      '<p class="caption">' + item.caption + '</p>';
    card.addEventListener('click', function () { openModal(item); });
    grid.appendChild(card);
  });

  function openModal(item) {
    modalRuby.innerHTML = '<img src="images/' + item.file + '" alt="' + item.title + '">';
    modalTitle.textContent = item.title;
    modalCaption.textContent = item.caption;
    modal.classList.remove('hidden');
  }

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) modal.classList.add('hidden');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') modal.classList.add('hidden');
  });
})();
