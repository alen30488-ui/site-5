/* «НИ В сказке сказать, НИ ПЕРОМ описать» — интерактив сайта */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var doc = document, html = doc.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var finePointer = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Интро ---------- */
  if (cfg.intro === false || window.scrollY > 80) html.classList.add('no-intro');
  var introOn = !html.classList.contains('no-intro');
  var intro = $('.intro');
  if (intro) setTimeout(function () { intro.remove(); }, introOn ? 3200 : 0);
  var INTRO_MS = introOn ? 2600 : 300;

  /* ---------- Аналитика и цели ---------- */
  var ymId = String(cfg.yandexMetrikaId || '').trim();
  var gaId = String(cfg.ga4Id || '').trim();
  var analyticsLoaded = false;
  function loadAnalytics() {
    if (analyticsLoaded) return; analyticsLoaded = true;
    if (ymId) {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, doc, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
      window.ym(Number(ymId), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }
    if (gaId) {
      var s = doc.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      doc.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', gaId, { anonymize_ip: true });
    }
  }
  function track(goal, params) {
    try {
      if (ymId && window.ym) window.ym(Number(ymId), 'reachGoal', goal, params || {});
      if (gaId && window.gtag) window.gtag('event', goal, params || {});
    } catch (e) {}
  }
  window.vsTrack = track;
  if (ymId || gaId) {
    var consent = store.get('vs-consent');
    if (!cfg.requireConsent || consent === 'yes') loadAnalytics();
    if (!consent) setTimeout(showCookie, INTRO_MS + 600);
  }
  function showCookie() {
    var el = doc.createElement('div');
    el.className = 'cookie'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Уведомление о cookie');
    el.innerHTML = '<p>Мы используем cookie и сервисы веб-аналитики, чтобы сайт становился лучше. Подробнее — в <a href="privacy.html">политике конфиденциальности</a>.</p><button class="btn btn--gold" type="button">Хорошо</button>';
    doc.body.appendChild(el); html.classList.add('cookie-open');
    el.querySelector('button').addEventListener('click', function () {
      store.set('vs-consent', 'yes'); loadAnalytics(); el.remove(); html.classList.remove('cookie-open');
    });
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-goal]');
    if (t) track(t.getAttribute('data-goal'));
  });

  /* ---------- Шапка, меню ---------- */
  var hdr = $('#hdr'), burger = $('.hdr__burger'), menu = $('#menu');
  var lastY = window.scrollY;
  function onScrollHeader() {
    var y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 40);
    if (html.classList.contains('menu-open')) return;
    if (y > window.innerHeight * 0.9 && y > lastY + 6) hdr.classList.add('is-hidden');
    else if (y < lastY - 6 || y < window.innerHeight * 0.5) hdr.classList.remove('is-hidden');
    if (Math.abs(y - lastY) > 6) lastY = y;
  }
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    html.classList.toggle('menu-open', open);
    html.style.overflow = open ? 'hidden' : '';
    if (open) hdr.classList.remove('is-hidden');
  }
  if (menu && burger) {
    menu.inert = true;
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && menu.classList.contains('is-open')) setMenu(false); });
  }

  /* ---------- Главный экран: параллакс ---------- */
  var hero = $('.hero');
  var heroVisible = true, tx = 0, ty = 0, mx = 0, my = 0, raf = 0;
  function heroFrame() {
    raf = 0;
    if (!heroVisible || !hero) return;
    mx += (tx - mx) * 0.07; my += (ty - my) * 0.07;
    var sy = reduce ? 0 : Math.min(window.scrollY, window.innerHeight * 1.3);
    hero.style.setProperty('--mx', mx.toFixed(4));
    hero.style.setProperty('--my', my.toFixed(4));
    hero.style.setProperty('--sy', sy.toFixed(1));
    if (Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) startHero();
  }
  function startHero() { if (!raf) raf = requestAnimationFrame(heroFrame); }
  if (hero && !reduce) {
    if (finePointer) window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX / window.innerWidth * 2 - 1; ty = e.clientY / window.innerHeight * 2 - 1; startHero();
    }, { passive: true });
  }
  window.addEventListener('scroll', function () { onScrollHeader(); startHero(); checkBottom(); }, { passive: true });
  onScrollHeader();

  /* ---------- Золотая пыль на главном экране ---------- */
  var dust = null;
  (function initDust() {
    var cv = $('.hero__dust');
    if (!cv || reduce || !cv.getContext) return;
    var ctx = cv.getContext('2d'), w = 0, h = 0, parts = [], running = false, last = 0;
    var sprite = doc.createElement('canvas'); sprite.width = sprite.height = 32;
    var sc = sprite.getContext('2d'), g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,252,232,1)'); g.addColorStop(0.22, 'rgba(255,228,160,.9)'); g.addColorStop(1, 'rgba(255,200,110,0)');
    sc.fillStyle = g; sc.fillRect(0, 0, 32, 32);
    function spawn(any) {
      return { x: Math.random() * w, y: any ? Math.random() * h : h + 12, r: 1.6 + Math.random() * 4.2, vy: -(0.12 + Math.random() * 0.42), vx: (Math.random() - 0.5) * 0.18, ph: Math.random() * 6.28, sp: 0.008 + Math.random() * 0.03 };
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.max(18, Math.min(80, w * h / 15000)));
      parts = []; for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    function frame(t) {
      if (!running) return;
      var dt = Math.min(50, t - (last || t)) / 16.7; last = t;
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.ph += p.sp * dt; p.x += (p.vx + Math.sin(p.ph) * 0.22) * dt; p.y += p.vy * dt;
        if (p.y < -20 || p.x < -20 || p.x > w + 20) parts[i] = p = spawn(false);
        var a = 0.3 + 0.7 * Math.abs(Math.sin(p.ph * 1.8)), s = p.r * (0.7 + 0.3 * a);
        ctx.globalAlpha = a * 0.75; ctx.drawImage(sprite, p.x - s, p.y - s, s * 2, s * 2);
      }
      requestAnimationFrame(frame);
    }
    dust = {
      start: function () { if (running || doc.hidden) return; running = true; last = 0; requestAnimationFrame(frame); },
      stop: function () { running = false; }
    };
    resize(); window.addEventListener('resize', resize);
    setTimeout(function () { if (heroVisible) dust.start(); }, introOn ? 1200 : 0);
  })();

  /* ---------- Пауза анимаций вне экрана ---------- */
  if ('IntersectionObserver' in window) {
    var pauseIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('is-paused', !en.isIntersecting);
        if (en.target === hero) {
          heroVisible = en.isIntersecting;
          if (dust) { if (heroVisible) dust.start(); else dust.stop(); }
          if (heroVisible) startHero();
        }
      });
    }, { rootMargin: '120px 0px' });
    $$('.hero, .collection, .story, .quality, .buy, .partners, .footer').forEach(function (s) { pauseIO.observe(s); });
  }
  doc.addEventListener('visibilitychange', function () { if (!dust) return; if (doc.hidden) dust.stop(); else if (heroVisible) dust.start(); });

  /* ---------- Искры за курсором ---------- */
  if (finePointer && !reduce && cfg.cursorSparkles !== false) (function () {
    var cv = doc.createElement('canvas'); cv.className = 'sparkle-canvas'; cv.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(cv);
    var ctx = cv.getContext('2d'), w = 0, h = 0, parts = [], running = false, lx = -99, ly = -99;
    function resize() { var dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; h = window.innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    resize(); window.addEventListener('resize', resize);
    function star(x, y, s) {
      ctx.beginPath(); ctx.moveTo(x, y - s * 2);
      ctx.quadraticCurveTo(x, y, x + s * 2, y); ctx.quadraticCurveTo(x, y, x, y + s * 2);
      ctx.quadraticCurveTo(x, y, x - s * 2, y); ctx.quadraticCurveTo(x, y, x, y - s * 2); ctx.fill();
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life -= 0.024;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy; p.vy += 0.035;
        ctx.globalAlpha = p.life; ctx.fillStyle = p.c; star(p.x, p.y, p.s * p.life);
      }
      if (parts.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, w, h); }
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var dx = e.clientX - lx, dy = e.clientY - ly;
      if (dx * dx + dy * dy < 180 || parts.length > 50) return;
      lx = e.clientX; ly = e.clientY;
      parts.push({ x: lx, y: ly, vx: (Math.random() - 0.5) * 1.3, vy: -0.3 - Math.random() * 0.7, life: 1, s: 1.6 + Math.random() * 2.6, c: Math.random() > 0.35 ? '#ffe3a0' : '#fffaf0' });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  })();

  /* ---------- Появление при прокрутке ---------- */
  var revealEls = $$('[data-reveal]');
  revealEls.forEach(function (el) { if (el.dataset.d) el.style.setProperty('--d', el.dataset.d); });
  if ('IntersectionObserver' in window && !reduce) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add('is-in'); });

  /* ---------- Диалоги ---------- */
  var lastFocus = null;
  function openDialog(d, opener) {
    if (!d) return;
    lastFocus = opener || doc.activeElement;
    $$('dialog[open]').forEach(function (o) { if (o !== d) o.close(); });
    if (!d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    html.classList.add('modal-open');
  }
  $$('dialog.modal').forEach(function (d) {
    d.addEventListener('close', function () {
      setTimeout(function () {
        if (!$('dialog[open]')) { html.classList.remove('modal-open'); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
      }, 0);
    });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });
  doc.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openDialog(doc.getElementById(o.getAttribute('data-open')), o); return; }
    var c = e.target.closest('[data-close]');
    if (c) { var d = c.closest('dialog'); if (d) d.close(); }
  });

  /* ---------- Коллекция: наклон плиток, окно продукта, карусель ---------- */
  var products = $$('.product'), pdlg = $('#product-dialog'), cur = 0;
  function cleanName(btn) { var t = doc.createElement('div'); t.innerHTML = btn.innerHTML.replace(/<br\s*\/?>/gi, ' '); return t.textContent.replace(/\s+/g, ' ').trim().replace(/ (с|в|и|на|из) /g, ' $1\u00a0'); }
  function fillProduct(i, dir) {
    var p = products[i]; if (!p || !pdlg) return; cur = i;
    var cs = getComputedStyle(p);
    pdlg.style.setProperty('--accent-rgb', cs.getPropertyValue('--accent-rgb').trim());
    pdlg.style.setProperty('--edge', cs.getPropertyValue('--edge').trim());
    $('.pd__title', pdlg).textContent = cleanName($('.product__open', p));
    $('.pd__tagline', pdlg).textContent = $('.product__desc', p).textContent;
    var det = $('.product__details', p), body = $('.pd__body', pdlg); body.innerHTML = '';
    [['.pd-lead', 'pd__lead'], ['.pd-notes', 'pd__notes'], ['.pd-facts', 'pd__facts']].forEach(function (m) {
      var src = $(m[0], det); if (src) { var el = src.cloneNode(true); el.className = m[1]; body.appendChild(el); }
    });
    var buy = $('.pd__buy', pdlg); buy.innerHTML = '';
    $$('.pd-links a', det).forEach(function (a) {
      var s = a.getAttribute('data-store'), b = doc.createElement('a');
      b.href = a.getAttribute('href'); b.target = '_blank'; b.rel = 'noopener';
      b.className = 'store store--' + s;
      b.setAttribute('data-goal', 'click_' + (s === 'ym' ? 'ymarket' : s) + '_' + p.getAttribute('data-product'));
      b.innerHTML = s === 'ym' ? 'Яндекс&nbsp;Маркет' : (s === 'wb' ? 'WILDBERRIES' : (s === 'ozon' ? 'OZON' : a.textContent));
      buy.appendChild(b);
    });
    var srcImg = $('.pack3d__front img', p), img = $('.pd__img', pdlg);
    img.srcset = srcImg.getAttribute('srcset') || ''; img.sizes = '(max-width: 760px) 150px, 240px';
    img.src = srcImg.getAttribute('src').replace('-420.', '-848.'); img.alt = srcImg.alt;
    var pile = $('.pd__pile', pdlg), ps = $('.product__pile', p);
    pile.src = ps.getAttribute('src'); pile.srcset = ps.getAttribute('srcset') || ''; pile.sizes = '420px';
    $('.pd__count', pdlg).textContent = (i + 1) + ' / ' + products.length;
    if (dir) { var pd = $('.pd', pdlg); pd.style.setProperty('--sx', (dir * 26) + 'px'); pd.classList.remove('is-switching'); void pd.offsetWidth; pd.classList.add('is-switching'); }
    track('product_view', { product: p.getAttribute('data-product') });
  }
  products.forEach(function (p, i) {
    var btn = $('.product__open', p), pack = $('.product__pack .pack3d', p);
    btn.addEventListener('click', function () { fillProduct(i, 0); openDialog(pdlg, btn); });
    if (finePointer && !reduce && pack) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        pack.style.setProperty('--ry', (x * 36).toFixed(1) + 'deg');
        pack.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
        pack.style.setProperty('--gx', (50 - x * 90).toFixed(0) + '%');
      });
      p.addEventListener('pointerleave', function () { ['--ry', '--rx', '--gx'].forEach(function (v) { pack.style.removeProperty(v); }); });
    }
  });
  if (pdlg) {
    $('.pd__nav .prev', pdlg).addEventListener('click', function () { fillProduct((cur + products.length - 1) % products.length, -1); });
    $('.pd__nav .next', pdlg).addEventListener('click', function () { fillProduct((cur + 1) % products.length, 1); });
    pdlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') fillProduct((cur + 1) % products.length, 1);
      if (e.key === 'ArrowLeft') fillProduct((cur + products.length - 1) % products.length, -1);
    });
  }
  (function carousel() {
    var list = $('#products'), dots = $('.dots'); if (!list || !dots) return;
    var btns = products.map(function (p) {
      var b = doc.createElement('button'); b.type = 'button'; b.tabIndex = -1;
      b.addEventListener('click', function () {
        var lr = list.getBoundingClientRect(), pr = p.getBoundingClientRect();
        list.scrollBy({ left: pr.left + pr.width / 2 - (lr.left + lr.width / 2), behavior: reduce ? 'auto' : 'smooth' });
      });
      dots.appendChild(b); return b;
    });
    function update() {
      var lr = list.getBoundingClientRect(), c = lr.left + lr.width / 2, best = 0, bd = 1e9;
      products.forEach(function (p, i) { var r = p.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - c); if (d < bd) { bd = d; best = i; } });
      btns.forEach(function (b, i) { b.setAttribute('aria-current', String(i === best)); });
    }
    list.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update); update();
  })();

  /* ---------- История: «Узнать больше» ---------- */
  (function () {
    var btn = $('.story .link-more'), more = $('#story-more'); if (!btn || !more) return;
    more.inert = true;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      more.classList.toggle('is-open', open); more.inert = !open;
      $('span', btn).textContent = open ? 'Свернуть' : 'Узнать больше';
    });
  })();

  /* ---------- Форма партнёра ---------- */
  (function () {
    var form = $('#partner-form'), dlg = $('#partner-dialog'); if (!form || !dlg) return;
    var wrap = $('.form-wrap', dlg), ok = $('.form-ok', dlg), status = $('.form__status', form), submit = $('.form__submit', form);
    var mail = cfg.contactEmail || 'info@vskazke.ru';
    function setErr(name, msg) {
      var f = form.elements[name].closest('.field'); f.classList.toggle('is-invalid', !!msg);
      var er = $('.field__err', f); if (er) er.textContent = msg || '';
      return !msg;
    }
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field, .check'); if (f) { f.classList.remove('is-invalid'); var er = $('.field__err', f); if (er) er.textContent = ''; }
      status.textContent = '';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (fd.get('website')) return;
      var name = String(fd.get('name') || '').trim(), contact = String(fd.get('contact') || '').trim();
      var good = setErr('name', name.length < 2 ? 'Пожалуйста, укажите имя' : '');
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact), isPhone = contact.replace(/\D/g, '').length >= 10;
      good = setErr('contact', (isEmail || isPhone) ? '' : 'Укажите телефон или e-mail') && good;
      var cons = form.elements.consent; cons.closest('.check').classList.toggle('is-invalid', !cons.checked);
      if (!cons.checked) { good = false; status.textContent = 'Нужно согласие на обработку персональных данных.'; }
      if (!good) { var first = $('.is-invalid input, .is-invalid textarea', form); if (first) first.focus(); return; }
      fd.delete('website');
      var done = function () {
        track('partner_form_sent', { topic: String(fd.get('topic') || '') });
        wrap.hidden = true; ok.hidden = false; form.reset();
      };
      if (cfg.formEndpoint) {
        submit.disabled = true;
        fetch(cfg.formEndpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
          .catch(function () { status.textContent = 'Не удалось отправить заявку. Напишите нам на ' + mail; })
          .then(function () { submit.disabled = false; });
      } else {
        var body = 'Имя: ' + name + '\nКомпания: ' + (fd.get('company') || '—') + '\nКонтакт: ' + contact + '\nНаправление: ' + (fd.get('topic') || '') + '\n\n' + (fd.get('message') || '');
        window.location.href = 'mailto:' + mail + '?subject=' + encodeURIComponent('Заявка на партнёрство — ' + name) + '&body=' + encodeURIComponent(body);
        done();
      }
    });
    dlg.addEventListener('close', function () { setTimeout(function () { wrap.hidden = false; ok.hidden = true; status.textContent = ''; }, 300); });
  })();

  /* ---------- Секции: активный пункт меню, цели просмотра, проводник ---------- */
  var sections = $$('[data-guide]');
  var navLinks = $$('.hdr__link');
  var seen = {}, current = -1;
  var guide = $('#guide'), say = function () {};
  function setCurrent(i) {
    if (i === current || i < 0) return; current = i;
    var s = sections[i], id = s.id;
    navLinks.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + id)); });
    if (!seen[id]) { seen[id] = 1; track('view_' + id); }
    if (guide) guide.classList.toggle('in-hero', i === 0);
    say(i);
  }
  function checkBottom() {
    if (window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 4) setCurrent(sections.length - 1);
  }
  if (guide && cfg.guide !== false) (function () {
    var bubble = $('.guide__bubble', guide), text = $('.guide__text', guide), face = $('.guide__face', guide), imgs = $$('.guide__img', guide), nextBtn = $('.guide__next', guide);
    var hideT = 0, typeT = 0, muted = store.sget('vs-guide') === 'muted', ready = false, pending = -1;
    say = function (i, force) {
      if (!ready) { pending = i; return; }
      var s = sections[i]; if (!s) return;
      var who = s.getAttribute('data-guide');
      imgs.forEach(function (im) { im.classList.toggle('is-off', im.getAttribute('data-who') !== who); });
      if (muted && !force) return;
      clearTimeout(hideT); clearInterval(typeT);
      var msg = s.getAttribute('data-guide-text') || '';
      bubble.classList.remove('is-off');
      nextBtn.hidden = i >= sections.length - 1;
      if (reduce) text.textContent = msg;
      else { var k = 0; text.textContent = ''; typeT = setInterval(function () { k += 2; text.textContent = msg.slice(0, k); if (k >= msg.length) clearInterval(typeT); }, 26); }
      hideT = setTimeout(function () { bubble.classList.add('is-off'); }, mq('(max-width: 599px)') ? 6500 : 9000);
    };
    function goNext() {
      var n = sections[Math.min(current + 1, sections.length - 1)];
      if (n) n.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      track('guide_next');
    }
    face.addEventListener('click', function () {
      if (bubble.classList.contains('is-off')) { muted = false; store.sset('vs-guide', ''); say(Math.max(current, 0), true); }
      else goNext();
    });
    nextBtn.addEventListener('click', goNext);
    $('.guide__close', guide).addEventListener('click', function () {
      clearTimeout(hideT); clearInterval(typeT); bubble.classList.add('is-off'); muted = true; store.sset('vs-guide', 'muted');
    });
    setTimeout(function () {
      ready = true; guide.classList.remove('is-away');
      if (pending >= 0) say(pending);
    }, INTRO_MS);
  })(); else if (guide) guide.remove();

  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setCurrent(sections.indexOf(en.target)); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- Мелочи ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
