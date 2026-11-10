/* ─────────────────────────────────────────────────────────
   VILLA NOVA · data layer + shared helpers
   PREVIEW MODE: properties live in this browser (IndexedDB),
   seeded with demo properties. Go-live swaps `store` for the
   Supabase implementation; every page only calls VN.store.*
   ───────────────────────────────────────────────────────── */
(function () {
  const PHONE = '21699002757';
  const PHONE_DISPLAY = '+216 99 002 757';
  const CFG = Object.assign({ supabaseUrl: '', supabaseKey: '', agency: 'villanova' }, window.VN_CONFIG || {});
  const DEMO = !(CFG.supabaseUrl && CFG.supabaseKey);

  /* ── vocabularies ─────────────────────────────────────── */
  const TYPES = {
    appartement: 'Appartement',
    duplex: 'Duplex',
    etage_villa: 'Étage de villa',
    villa: 'Villa',
    maison: 'Maison',
    terrain: 'Terrain',
    bureau: 'Bureau',
    commerce: 'Local commercial',
    depot: 'Dépôt',
    immeuble: 'Immeuble'
  };
  const RESIDENTIAL = ['appartement', 'duplex', 'etage_villa', 'villa', 'maison'];
  // what visitors filter on: grouped, so a small catalogue never splits too thin
  const TYPE_GROUPS = {
    appartement: { label: 'Appartement', types: ['appartement', 'duplex', 'etage_villa'] },
    villa: { label: 'Villa & maison', types: ['villa', 'maison'] },
    terrain: { label: 'Terrain', types: ['terrain'] },
    pro: { label: 'Bureau & commerce', types: ['bureau', 'commerce', 'depot', 'immeuble'] }
  };
  const FEATURES = {
    piscine: 'Piscine', jardin: 'Jardin', garage: 'Garage', parking: 'Parking',
    ascenseur: 'Ascenseur', meuble: 'Meublé', climatisation: 'Climatisation',
    chauffage: 'Chauffage central', vue_mer: 'Vue mer', terrasse: 'Terrasse',
    securite: 'Résidence sécurisée', cuisine: 'Cuisine équipée'
  };
  const CITIES = ['Tunis', 'Ariana', 'Ben Arous', 'La Manouba', 'Nabeul', 'Sousse', 'Monastir', 'Sfax', 'Bizerte'];
  const AREAS = ['La Marsa', 'Gammarth', 'Sidi Bou Saïd', 'Carthage', 'Les Berges du Lac', 'Lac 2', 'La Goulette',
    'Centre Urbain Nord', 'Menzah', 'Ennasr', 'La Soukra', 'Ain Zaghouan', 'Mutuelleville', 'El Manar',
    'Hammamet', 'Yasmine Hammamet', 'Nabeul', 'Sousse', 'Port El Kantaoui'];
  const STATUS = { disponible: 'Disponible', reserve: 'Réservé', vendu: 'Vendu' };
  const TITLE_DEEDS = { titre_bleu: 'Titre bleu (immatriculé)', acte_arabe: 'Acte arabe', titre_en_cours: 'Titre en cours', autre: 'Autre' };
  // only https links ever reach an href (admin input is untrusted on the public page)
  const safeUrl = (u) => (typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(u.trim())) ? u.trim() : '';
  const BUDGETS = {
    vente: [[0, 300000], [300000, 600000], [600000, 1000000], [1000000, 2000000], [2000000, 0]],
    location: [[0, 1000], [1000, 2000], [2000, 4000], [4000, 0]]
  };

  /* ── helpers ──────────────────────────────────────────── */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => Number(n || 0).toLocaleString('fr-FR').replace(/ | /g, ' ');
  const statusLabel = (p) => p.status === 'vendu' ? (p.transaction === 'location' ? 'Loué' : 'Vendu') : STATUS[p.status] || '';
  function priceHTML(p) {
    if (!p.price) return '<span class="pr-ask">Prix sur demande</span>';
    return num(p.price) + '<small> TND' + (p.transaction === 'location' ? ' / mois' : '') + '</small>';
  }
  function priceText(p) {
    if (!p.price) return 'Prix sur demande';
    return num(p.price) + ' TND' + (p.transaction === 'location' ? ' / mois' : '');
  }
  function perM2(p) {
    const s = p.type === 'terrain' ? (p.land_surface || p.surface) : p.surface;
    if (!p.price || !s || p.transaction !== 'vente') return '';
    return num(Math.round(p.price / s)) + ' TND / m²';
  }
  const roomsLabel = (p) => p.rooms ? 'S+' + p.rooms : '';
  const where = (p) => [p.area, p.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  // one quiet line of facts, Engel & Völkers style: "Villa · S+4 · 380 m² · terrain 720 m²"
  function specLine(p) {
    const a = [TYPES[p.type]];
    if (p.rooms && RESIDENTIAL.includes(p.type)) a.push('S+' + p.rooms);
    if (p.surface) a.push(num(p.surface) + ' m²');
    if (p.land_surface) a.push((p.type === 'terrain' ? '' : 'terrain ') + num(p.land_surface) + ' m²');
    return a.filter(Boolean).join(' · ');
  }
  const isNew = (p) => (Date.now() - new Date(p.created_at).getTime()) < 14 * 864e5;
  const siteBase = () => location.href.replace(/[^/]*([?#].*)?$/, '');
  const propertyUrl = (p) => siteBase() + 'bien.html?ref=' + encodeURIComponent(p.ref);
  const wa = (text) => 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);
  const waProperty = (p) => wa('Bonjour Villa Nova, je suis intéressé(e) par le bien « ' + p.title + ' » (Réf. ' + p.ref + ') : ' + propertyUrl(p));
  const waVisit = (p) => wa('Bonjour Villa Nova, je souhaite visiter le bien « ' + p.title + ' » (Réf. ' + p.ref + '). Mes disponibilités : ');
  function suggestTitle(p) {
    const t = TYPES[p.type] || 'Bien';
    const rooms = p.rooms && RESIDENTIAL.includes(p.type) ? ' S+' + p.rooms : '';
    const tx = p.transaction === 'location' ? 'à louer' : 'à vendre';
    const size = p.type === 'terrain' && (p.land_surface || p.surface) ? ' de ' + num(p.land_surface || p.surface) + ' m²' : '';
    return (t + rooms + size + ' ' + tx + (p.area ? ', ' + p.area : '')).trim();
  }

  /* ── favourites (per visitor, this browser) ───────────── */
  const FKEY = 'vn-favs';
  const favs = {
    all() { try { return JSON.parse(localStorage.getItem(FKEY) || '[]'); } catch (e) { return []; } },
    has(ref) { return this.all().includes(ref); },
    toggle(ref) {
      let a = this.all();
      a = a.includes(ref) ? a.filter((r) => r !== ref) : a.concat(ref);
      try { localStorage.setItem(FKEY, JSON.stringify(a)); } catch (e) { /* storage blocked */ }
      document.dispatchEvent(new CustomEvent('vn:favs'));
      return a.includes(ref);
    }
  };

  /* ── image compression (admin upload) ─────────────────── */
  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { res(img); URL.revokeObjectURL(url); };
      img.onerror = rej;
      img.src = url;
    });
  }
  function resize(img, max, q) {
    const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * r);
    c.height = Math.round(img.naturalHeight * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  const toBlob = (c, q) => new Promise((res) => c.toBlob(res, 'image/jpeg', q));
  async function processPhotoDemo(file) {
    const img = await loadImage(file);
    return { full: resize(img, 1600, 0.82).toDataURL('image/jpeg', 0.82), thumb: resize(img, 640, 0.76).toDataURL('image/jpeg', 0.76) };
  }

  /* ── demo seed ────────────────────────────────────────── */
  const ph = (n) => ({ full: 'assets/demo/' + n + '.jpg', thumb: 'assets/demo/' + n + '.jpg' });
  const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString();
  const SEED = [
    { ref: 'VN-0001', published: true, status: 'disponible', featured: true, transaction: 'vente', type: 'villa',
      title: 'Villa contemporaine avec piscine, Gammarth', tagline: 'Une villa de plain-pied qui vit autour de sa piscine', price: 1950000, city: 'Tunis', area: 'Gammarth',
      surface: 380, land_surface: 720, rooms: 4, bathrooms: 4, year_built: 2022,
      features: ['piscine', 'jardin', 'garage', 'climatisation', 'chauffage', 'cuisine', 'securite'],
      description: "Villa de plain-pied aux lignes contemporaines, sur un terrain de 720 m² entièrement clôturé.\n\nGrand séjour ouvert sur la piscine, cuisine équipée, suite parentale avec dressing, trois chambres et un studio indépendant pour les invités. Garage deux voitures.",
      photos: [ph('villa-pool'), ph('courtyard'), ph('terrace-sea'), ph('living')], created_at: daysAgo(3) },
    { ref: 'VN-0002', published: true, status: 'disponible', featured: false, transaction: 'location', type: 'appartement',
      title: 'Appartement S+2 meublé, Lac 2', tagline: 'Prêt à vivre, au calme, à deux pas des bureaux du Lac', price: 2400, city: 'Tunis', area: 'Lac 2',
      surface: 120, rooms: 2, bathrooms: 2, floor: 3,
      features: ['meuble', 'ascenseur', 'parking', 'climatisation', 'cuisine', 'securite'],
      description: "Appartement lumineux au troisième étage d'une résidence sécurisée, entièrement meublé et équipé.\n\nDeux chambres dont une suite, séjour avec balcon, cuisine ouverte. Place de parking en sous-sol.",
      photos: [ph('living'), ph('terrace-sea')], created_at: daysAgo(6) },
    { ref: 'VN-0003', published: true, status: 'disponible', featured: false, transaction: 'vente', type: 'maison',
      title: 'Maison traditionnelle, Sidi Bou Saïd', tagline: 'Une maison de village, son patio et sa terrasse sur la baie', price: 1350000, city: 'Tunis', area: 'Sidi Bou Saïd',
      surface: 260, land_surface: 400, rooms: 3, bathrooms: 2, year_built: 1965,
      features: ['jardin', 'terrasse', 'vue_mer'],
      description: "Maison de caractère au cœur du village, patio, terrasse sur le toit avec vue sur la baie.\n\nTrois chambres, deux salles d'eau, boiseries et faïences d'origine.",
      photos: [ph('sidi-bou'), ph('traditional'), ph('courtyard')], created_at: daysAgo(20) },
    { ref: 'VN-0004', published: true, status: 'disponible', featured: false, transaction: 'location', type: 'bureau',
      title: 'Bureau 150 m², Centre Urbain Nord', tagline: 'Un plateau aménagé, prêt pour une équipe de cinq', price: 3800, city: 'Tunis', area: 'Centre Urbain Nord',
      surface: 150, bathrooms: 1, floor: 5,
      features: ['ascenseur', 'parking', 'climatisation'],
      description: "Plateau de bureaux aménagé, cinq postes et une salle de réunion, fibre disponible.\n\nImmeuble de standing avec gardiennage et parking.",
      photos: [ph('office')], created_at: daysAgo(35) },
    { ref: 'VN-0005', published: true, status: 'disponible', featured: false, transaction: 'vente', type: 'terrain',
      title: 'Terrain constructible de 600 m², La Soukra', tagline: 'Un terrain plat en zone villas, titre bleu', price: 420000, city: 'Ariana', area: 'La Soukra',
      land_surface: 600, features: [],
      description: "Terrain plat de 600 m² en zone villas, titre bleu, façade de 20 m sur une voie de 12 m.\n\nIdéal pour une villa individuelle.",
      photos: [ph('terrain-plan')], created_at: daysAgo(9) },
    { ref: 'VN-0006', published: true, status: 'reserve', featured: false, transaction: 'vente', type: 'villa',
      title: 'Villa S+5 avec jardin, Hammamet', tagline: 'Une maison de famille dans un jardin de 1 500 m²', price: 2850000, city: 'Nabeul', area: 'Hammamet',
      surface: 450, land_surface: 1500, rooms: 5, bathrooms: 4, year_built: 2016,
      features: ['piscine', 'jardin', 'garage', 'vue_mer', 'terrasse'],
      description: "Grande villa familiale à quelques minutes de la plage, jardin arboré de 1 500 m².\n\nCinq chambres, piscine, dépendance pour le personnel.",
      photos: [ph('garden-villa'), ph('terrace-sea'), ph('villa-pool')], created_at: daysAgo(45) }
  ];

  /* ── store A: IndexedDB demo (preview, no config) ─────── */
  const DB = 'villanova-demo', OS = 'properties';
  let dbp;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(OS, { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      const t = d.transaction(OS, mode);
      const out = fn(t.objectStore(OS));
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
      t.onerror = () => rej(t.error);
    }));
  }
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  async function ensureSeed() {
    let seeded = false;
    try { seeded = localStorage.getItem('vn-seeded') === '1'; } catch (e) { /* ignore */ }
    if (seeded) return;
    const n = await tx('readonly', (s) => s.count());
    if (!n) await tx('readwrite', (s) => { SEED.forEach((p) => s.put(Object.assign({ id: uid(), updated_at: p.created_at }, p))); });
    try { localStorage.setItem('vn-seeded', '1'); } catch (e) { /* ignore */ }
  }
  const memory = SEED.map((p) => Object.assign({ id: p.ref }, p)); // fallback if IndexedDB is blocked
  const nextRefFrom = (rows) => 'VN-' + String(rows.reduce((m, p) => Math.max(m, parseInt(String(p.ref).replace(/\D/g, ''), 10) || 0), 0) + 1).padStart(4, '0');

  const demoStore = {
    demo: true,
    async list() {
      try { await ensureSeed(); return await tx('readonly', (s) => s.getAll()); }
      catch (e) { return memory.slice(); }
    },
    async listPublic() { return (await this.list()).filter((p) => p.published); },
    async get(ref) { return (await this.list()).find((p) => p.ref === ref) || null; },
    async nextRef() { return nextRefFrom(await this.list()); },
    async save(p) {
      const now = new Date().toISOString();
      const row = Object.assign({}, p, { updated_at: now });
      if (!row.id) { row.id = uid(); row.created_at = now; }
      if (!row.ref) row.ref = await this.nextRef();
      await tx('readwrite', (s) => s.put(row));
      return row;
    },
    async remove(id) { await tx('readwrite', (s) => s.delete(id)); },
    async reset() {
      await tx('readwrite', (s) => s.clear());
      try { localStorage.removeItem('vn-seeded'); } catch (e) { /* ignore */ }
      await ensureSeed();
    },
    processPhoto: processPhotoDemo
  };

  /* ── store B: Supabase (live, multi-agency) ───────────────
     One project serves every agency: rows carry agency_id, the
     public reads published rows only, members of the agency write.
     Schema and policies: supabase/schema.sql                    */
  const SB_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  const SB_SRI = 'sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o'; // pinned file, checked by the browser
  const OFFLINE = 'Connexion impossible, réessayez dans un instant.';
  let sbp, agp;
  // a failed load is never cached: the next call retries (mobile connections drop)
  function sb() {
    if (!sbp) sbp = new Promise((res, rej) => {
      if (window.supabase && window.supabase.createClient) return res(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey));
      const s = document.createElement('script');
      s.src = SB_JS; s.integrity = SB_SRI; s.crossOrigin = 'anonymous';
      s.onload = () => res(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey));
      s.onerror = () => { s.remove(); rej(new Error(OFFLINE)); };
      document.head.append(s);
    }).catch((e) => { sbp = undefined; throw e; });
    return sbp;
  }
  function agencyId() {
    if (!agp) agp = sb().then((c) => c.from('agencies').select('id').eq('slug', CFG.agency).single())
      .then(({ data, error }) => { if (error || !data) throw new Error(error ? OFFLINE : 'Agence introuvable'); return data.id; })
      .catch((e) => { agp = undefined; throw e; });
    return agp;
  }
  const COLS = ['ref', 'published', 'status', 'featured', 'transaction', 'type', 'title', 'tagline', 'price', 'city', 'area',
    'surface', 'land_surface', 'rooms', 'bathrooms', 'floor', 'year_built', 'features', 'description', 'photos',
    'title_deed', 'available_from', 'deposit_months', 'charges', 'video_url'];
  const PRIV = ['owner_name', 'owner_phone', 'address', 'notes'];
  const pick = (p) => { const r = {}; COLS.forEach((k) => { if (p[k] !== undefined) r[k] = p[k] === '' ? null : p[k]; }); return r; };
  const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  // agency-only data lives in property_private (no public access at all); merged as p.private for the admin
  const withPrivate = (row) => {
    if (!row) return row;
    const pv = Array.isArray(row.property_private) ? row.property_private[0] : row.property_private;
    const out = Object.assign({}, row, { private: Object.assign({ owner_name: '', owner_phone: '', address: '', notes: '' }, pv || {}) });
    delete out.property_private;
    return out;
  };
  async function savePrivate(c, a, id, pv) {
    if (!pv) return {};
    const row = { property_id: id, agency_id: a, updated_at: new Date().toISOString() };
    PRIV.forEach((k) => { row[k] = (pv[k] || '').trim() || null; });
    return ok(await c.from('property_private').upsert(row, { onConflict: 'property_id' }).select('owner_name, owner_phone, address, notes').single());
  }

  const liveStore = {
    demo: false,
    async list() { // admin only: needs a logged-in member, embeds the private row
      const c = await sb(), a = await agencyId();
      return ok(await c.from('properties').select('*, property_private(owner_name, owner_phone, address, notes)').eq('agency_id', a).order('created_at', { ascending: false })).map(withPrivate);
    },
    async listPublic() {
      const c = await sb(), a = await agencyId();
      return ok(await c.from('properties').select('*').eq('agency_id', a).eq('published', true).order('created_at', { ascending: false }));
    },
    async get(ref) {
      const c = await sb(), a = await agencyId();
      return ok(await c.from('properties').select('*').eq('agency_id', a).eq('ref', ref).maybeSingle());
    },
    async nextRef() { return nextRefFrom(await this.list()); },
    async save(p) {
      const c = await sb(), a = await agencyId();
      const row = Object.assign(pick(p), { updated_at: new Date().toISOString() });
      let saved;
      if (p.id) saved = ok(await c.from('properties').update(row).eq('id', p.id).select().single());
      else {
        row.agency_id = a;
        row.ref = row.ref || await this.nextRef();
        saved = ok(await c.from('properties').insert(row).select().single());
        // remember the new id at once: if the private part fails, a retry updates instead of creating a duplicate
        p.id = saved.id; p.ref = saved.ref; p.created_at = saved.created_at;
      }
      const pv = await savePrivate(c, a, saved.id, p.private);
      return Object.assign(saved, { private: pv });
    },
    async remove(id) {
      const c = await sb();
      const row = ok(await c.from('properties').select('photos').eq('id', id).maybeSingle());
      ok(await c.from('properties').delete().eq('id', id));
      const paths = ((row && row.photos) || []).flatMap((ph) => ph.paths || []);
      if (paths.length) await c.storage.from('listings').remove(paths); // best effort
    },
    async reset() { /* demo only */ },
    async processPhoto(file) {
      const c = await sb();
      const img = await loadImage(file);
      const base = CFG.agency + '/' + uid();
      const full = await toBlob(resize(img, 1600, 0.82), 0.82);
      const thumb = await toBlob(resize(img, 640, 0.76), 0.76);
      const up = async (path, blob) => {
        ok(await c.storage.from('listings').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' }));
        return c.storage.from('listings').getPublicUrl(path).data.publicUrl;
      };
      const [fu, tu] = await Promise.all([up(base + '.jpg', full), up(base + '-t.jpg', thumb)]);
      return { full: fu, thumb: tu, paths: [base + '.jpg', base + '-t.jpg'] };
    }
  };

  /* ── agency login ─────────────────────────────────────── */
  const AKEY = 'vn-admin-demo';
  const auth = DEMO ? {
    demo: true,
    async session() { try { return sessionStorage.getItem(AKEY) === '1'; } catch (e) { return !!window._vnAuth; } },
    async signIn() { try { sessionStorage.setItem(AKEY, '1'); } catch (e) { window._vnAuth = true; } },
    async signOut() { try { sessionStorage.removeItem(AKEY); } catch (e) { window._vnAuth = false; } }
  } : {
    demo: false,
    async session() { // logged in AND a member of this agency
      const c = await sb();
      const s = (await c.auth.getSession()).data.session;
      if (!s) return false;
      const a = await agencyId();
      const m = ok(await c.from('agency_members').select('agency_id').eq('user_id', s.user.id).eq('agency_id', a));
      return m.length > 0;
    },
    async signIn(email, password) {
      const c = await sb();
      const { data, error } = await c.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.status === 400 || /invalid/i.test(error.message || '') ? 'E-mail ou mot de passe incorrect.' : OFFLINE);
      const a = await agencyId();
      const m = ok(await c.from('agency_members').select('agency_id').eq('user_id', data.user.id).eq('agency_id', a));
      if (!m.length) { await c.auth.signOut(); throw new Error("Ce compte n'a pas accès à l'espace Villa Nova."); }
    },
    async signOut() { const c = await sb(); await c.auth.signOut(); }
  };

  window.VN = {
    PHONE, PHONE_DISPLAY, TYPES, RESIDENTIAL, TYPE_GROUPS, FEATURES, CITIES, AREAS, STATUS, BUDGETS, TITLE_DEEDS,
    safeUrl, esc, num, priceHTML, priceText, perM2, roomsLabel, specLine, where, isNew, statusLabel,
    propertyUrl, wa, waProperty, waVisit, suggestTitle, favs, auth,
    store: DEMO ? demoStore : liveStore
  };
})();
