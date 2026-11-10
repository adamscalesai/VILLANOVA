/* VILLA NOVA · shared UI: icons, nav/footer shell, property card, toast */
(function () {
  const V = window.VN;
  const I = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5-.1-.1-.6-1.6-.9-2.1-.2-.6-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.5 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3zM12 2A10 10 0 002 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1120.2 12 8.2 8.2 0 0112 20.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.6C1.6 7.3 4 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4 20 4 22.4 7.3 21.2 10.9c-1.7 5-9.2 9.6-9.2 9.6z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7"/><rect x="13.5" y="3.5" width="7" height="7"/><rect x="3.5" y="13.5" width="7" height="7"/><rect x="13.5" y="13.5" width="7" height="7"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 004 0"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>'
  };

  const WA_HELLO = V.wa('Bonjour Villa Nova 👋');

  function shell(active) {
    const nav = document.createElement('div');
    const cur = (k) => active === k ? ' aria-current="page"' : '';
    nav.innerHTML =
      (V.store.demo ? '<div class="demo-bar"><b>Aperçu</b> · biens de démonstration, rien n\'est encore en ligne sur villanova.tn</div>' : '') +
      '<nav class="nav" id="nav">' +
      '<a href="index.html" class="brand"><img src="assets/logo.png" alt="Villa Nova Holdings"><span><span class="name">VILLA <b>NOVA</b></span><span class="sub">HOLDINGS</span></span></a>' +
      '<ul class="nav-links">' +
      '<li><a href="biens.html?t=vente"' + cur('vente') + '>Acheter</a></li>' +
      '<li><a href="biens.html?t=location"' + cur('location') + '>Louer</a></li>' +
      '<li><a href="biens.html#proprietaires">Confier mon bien</a></li>' +
      '<li><a href="index.html#apropos">À propos</a></li></ul>' +
      '<div class="nav-right">' +
      '<a class="btn btn-ghost" href="index.html#estimation">Estimer mon bien</a>' +
      '<a class="btn btn-wa" href="' + WA_HELLO + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + I.wa + '<span class="lbl">WhatsApp</span></a>' +
      '<button class="nav-burger" id="burger" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>' +
      '</div></nav>' +
      '<div class="mobile-menu" id="mobileMenu"><button class="close" aria-label="Fermer">×</button>' +
      '<a href="index.html">Accueil</a><a href="biens.html?t=vente">Acheter</a><a href="biens.html?t=location">Louer</a>' +
      '<a href="biens.html#proprietaires">Confier mon bien</a><a href="index.html#estimation">Estimer mon bien</a><a href="index.html#apropos">À propos</a></div>';
    document.body.prepend(...nav.childNodes);
    const mm = document.getElementById('mobileMenu');
    document.getElementById('burger').onclick = () => mm.classList.add('open');
    mm.querySelector('.close').onclick = () => mm.classList.remove('open');
    mm.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mm.classList.remove('open')));

    const foot = document.createElement('div');
    foot.innerHTML =
      '<footer class="foot"><div class="wrap"><div class="foot-grid">' +
      '<div><a href="index.html" class="brand"><img src="assets/logo.png" alt=""><span><span class="name">VILLA <b>NOVA</b></span><span class="sub">HOLDINGS</span></span></a>' +
      '<p>Immobilier premium en Tunisie. Achat, vente, location et estimation.</p></div>' +
      '<div><h5>Biens</h5><ul><li><a href="biens.html?t=vente">Acheter</a></li><li><a href="biens.html?t=location">Louer</a></li>' +
      '<li><a href="biens.html?type=terrain">Terrains</a></li><li><a href="biens.html#proprietaires">Confier mon bien</a></li></ul></div>' +
      '<div><h5>Contact</h5><ul><li><a href="https://wa.me/' + V.PHONE + '" target="_blank" rel="noopener">WhatsApp · ' + V.PHONE_DISPLAY + '</a></li>' +
      '<li><a href="tel:+' + V.PHONE + '">Tél · ' + V.PHONE_DISPLAY + '</a></li><li>Tunis, Tunisie</li></ul></div>' +
      '</div><div class="foot-bottom"><small>© ' + new Date().getFullYear() + ' Villa Nova Holdings · Immobilier Premium · Tunisie</small></div></div></footer>' +
      '<a class="wa-float" href="' + WA_HELLO + '" target="_blank" rel="noopener" aria-label="WhatsApp Villa Nova">' + I.wa + '</a>';
    document.body.append(...foot.childNodes);
  }

  // one badge at most, in order of what matters to a buyer
  function badge(p) {
    if (p.status === 'reserve') return '<span class="badge res">Réservé</span>';
    if (p.status === 'vendu') return '<span class="badge sold">' + V.statusLabel(p) + '</span>';
    if (p.featured) return '<span class="badge excl">Exclusivité</span>';
    if (V.isNew(p)) return '<span class="badge">Nouveau</span>';
    return '';
  }
  const kicker = (p) => V.esc(p.area || p.city || '') + ' · ' + (p.transaction === 'location' ? 'À louer' : 'À vendre');

  // a card; `live:false` = admin preview (no links out)
  function card(p, opts) {
    opts = opts || {};
    const photos = (p.photos && p.photos.length) ? p.photos : [{ thumb: 'assets/placeholder.jpg' }];
    const url = opts.live === false ? '#' : 'bien.html?ref=' + encodeURIComponent(p.ref);
    const n = photos.length;
    return '<article class="card' + (p.status === 'reserve' ? ' is-res' : '') + '" data-ref="' + V.esc(p.ref) + '">' +
      '<div class="card-media"><div class="slides">' +
      photos.map((ph, i) => '<img src="' + V.esc(ph.thumb || ph.full) + '" alt="' + V.esc(p.title) + ', photo ' + (i + 1) + '" loading="lazy" decoding="async">').join('') +
      '</div>' + badge(p) +
      (n > 1 ? '<button class="media-nav prev" aria-label="Photo précédente">' + I.left + '</button><button class="media-nav next" aria-label="Photo suivante">' + I.right + '</button>' +
        '<div class="dots">' + photos.slice(0, 6).map((_, i) => '<i' + (i ? '' : ' class="on"') + '></i>').join('') + '</div>' : '') +
      (opts.live === false ? '' : '<button class="heart" aria-pressed="' + V.favs.has(p.ref) + '" aria-label="Ajouter aux favoris">' + I.heart + '</button>') +
      '</div><div class="card-body">' +
      '<div class="where caps">' + kicker(p) + '</div>' +
      '<h3><a href="' + url + '">' + V.esc(p.title || 'Titre du bien') + '</a></h3>' +
      '<div class="spec">' + V.esc(V.specLine(p)) + '</div>' +
      '<div class="price">' + V.priceHTML(p) + '</div>' +
      '</div></article>';
  }

  function bindSlides(root) {
    root.querySelectorAll('.card-media, .m-hero, .lb').forEach((m) => {
      const s = m.querySelector('.slides'); if (!s || s.dataset.bound) return;
      s.dataset.bound = '1';
      const n = s.children.length;
      const dots = m.querySelectorAll('.dots i');
      const count = m.querySelector('.count, .lb-count');
      const idx = () => Math.round(s.scrollLeft / s.clientWidth);
      s.addEventListener('scroll', () => {
        const i = idx();
        dots.forEach((d, k) => d.classList.toggle('on', k === Math.min(i, dots.length - 1)));
        if (count) count.textContent = (i + 1) + ' / ' + n;
      }, { passive: true });
      const go = (d) => s.scrollTo({ left: ((idx() + d + n) % n) * s.clientWidth, behavior: 'smooth' });
      const pv = m.querySelector('.media-nav.prev'), nx = m.querySelector('.media-nav.next');
      if (pv) pv.onclick = (e) => { e.preventDefault(); e.stopPropagation(); go(-1); };
      if (nx) nx.onclick = (e) => { e.preventDefault(); e.stopPropagation(); go(1); };
    });
  }

  function bindHearts(root) {
    root.querySelectorAll('.heart, [data-fav]').forEach((h) => {
      if (h.dataset.bound) return; h.dataset.bound = '1';
      h.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const ref = h.dataset.fav || h.closest('[data-ref]').dataset.ref;
        const on = V.favs.toggle(ref);
        const q = CSS.escape(ref);
        document.querySelectorAll('[data-fav="' + q + '"], [data-ref="' + q + '"] .heart').forEach((x) => x.setAttribute('aria-pressed', on));
        toast(on ? 'Ajouté à vos favoris' : 'Retiré de vos favoris');
      });
    });
  }

  // tapping a photo opens the property (photos sit above the card link so they can swipe)
  function bindPhotoOpen(root) {
    root.addEventListener('click', (e) => {
      const img = e.target.closest('.card .slides img');
      if (img) { const a = img.closest('.card').querySelector('h3 a'); if (a && a.getAttribute('href') !== '#') location.href = a.href; }
    });
  }

  let tt;
  function toast(html, ms) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.innerHTML = html; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), ms || 2400);
  }

  async function share(p) {
    const url = V.propertyUrl(p);
    if (navigator.share) { try { await navigator.share({ title: p.title, text: p.title + ' · ' + V.priceText(p), url }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); toast('Lien copié'); } catch (e) { prompt('Copiez le lien :', url); }
  }

  window.VNUI = { I, shell, card, badge, bindSlides, bindHearts, bindPhotoOpen, toast, share };
})();
