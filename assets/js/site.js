// Well Grounded: page behaviour (menu, scroll reveals, live class schedule, copy-email button).
// The live schedule settings are in SCHED below.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const nav = $('.nav');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('tx-' + e.target.dataset.tx); io.unobserve(e.target); } }), { rootMargin: '120% 0px' });
  $$('[data-tx]').forEach((el) => io.observe(el));
  const btn = $('.menu-btn'), menuLinks = $$('#menu a');
  const setMenu = (open, refocus) => { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); if (!open && refocus) btn.focus(); };
  btn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('open')) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') { const f = [btn, ...menuLinks], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
  const go = (t) => { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); setMenu(false);
    if (window.lenis) window.lenis.scrollTo(t, { duration: 1.0 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    go(t);
  }));
  // the menu turns to frosted plaster as soon as the page moves, tucks away while you read down, returns when you scroll up
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY, moved = y > 8;
    nav.classList.toggle('solid', moved); nav.classList.toggle('top', !moved);
    const down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > innerHeight * 0.6 && !nav.classList.contains('open') && !nav.contains(document.activeElement)) nav.classList.add('away');
    else if (up || y < innerHeight * 0.6) nav.classList.remove('away');
    if (down || up) lastY = y;
  };
  nav.addEventListener('focusin', () => nav.classList.remove('away'));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('.copy').forEach((b) => b.addEventListener('click', async () => {
    const out = b.nextElementSibling;
    try { await navigator.clipboard.writeText(b.dataset.copy); out.textContent = 'Copied'; }
    catch (e) { out.textContent = 'Select the address to copy it'; }
    setTimeout(() => { out.textContent = ''; }, 2400);
  }));
  // the signature writes itself in, left to right, the first time it comes into view
  const sig = $('.sigtext');
  if (sig) { const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { sig.classList.add('signed'); so.disconnect(); } }), { threshold: 0, rootMargin: '0px 0px -20% 0px' }); so.observe(sig); }
  // live schedule: Mariah's classes, read straight from the studio's public booking schedule (Momence)
  const SCHED = { host: 37333, teacher: 94797, tz: 'America/New_York', show: 6 };
  const list = $('.slist'), live = $('.live'), ltext = $('.live .ltext');
  const fmtDay = new Intl.DateTimeFormat('en-US', { timeZone: SCHED.tz, weekday: 'short', month: 'short', day: 'numeric' });
  const fmtTime = new Intl.DateTimeFormat('en-US', { timeZone: SCHED.tz, hour: 'numeric', minute: '2-digit' });
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const row = (x) => {
    const start = new Date(x.startsAt), end = new Date(x.endsAt), mins = Math.round((end - start) / 60000);
    const rs = x.remainingSpots, left = (rs && typeof rs === 'object') ? rs.remaining : (typeof rs === 'number' ? rs : (x.capacity != null ? Math.max(0, x.capacity - (x.ticketsSold || 0)) : null));
    const spots = left == null ? '' : left === 0 ? (x.allowWaitlist ? 'Full. Waitlist open.' : 'Full') : left <= 3 ? `${left} spot${left === 1 ? '' : 's'} left` : `${left} spots open`;
    const where = x.locationId === 0 ? 'Online' : (x.location || '').trim();
    return `<li><span class="when">${fmtDay.format(start)}<span class="t2"> · ${fmtTime.format(start).toLowerCase()}</span></span><span class="time">${fmtTime.format(start).toLowerCase()}</span>`
      + `<span class="what">${esc(x.sessionName)}<small>${esc(where)}${mins ? ' · ' + mins + ' min' : ''}</small></span>`
      + `<span class="spots">${spots}</span><a class="book" href="${esc(x.link)}" target="_blank" rel="noopener">Book<span class="vh"> ${esc(x.sessionName)}, ${fmtDay.format(start)}</span></a></li>`;
  };
  async function loadSchedule() {
    const from = new Date(), to = new Date(Date.now() + 42 * 864e5);
    const q = new URLSearchParams({ 'teacherIds[]': SCHED.teacher, pageSize: 20, page: 0, timeZone: SCHED.tz, fromDate: from.toISOString(), toDate: to.toISOString() });
    try {
      const r = await fetch(`https://readonly-api.momence.com/host-plugins/host/${SCHED.host}/host-schedule/sessions?${q}`, { credentials: 'omit' });
      if (!r.ok) throw new Error(r.status);
      const items = ((await r.json()).payload || []).filter((x) => !x.isCancelled && new Date(x.endsAt) > from).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).slice(0, SCHED.show);
      const html = items.length ? items.map(row).join('') : '<li><span class="empty">No classes on the schedule in the next six weeks. Write to Mariah for private sessions.</span></li>';
      const swap = () => { list.innerHTML = html; list.setAttribute('aria-busy', 'false'); };
      (document.startViewTransition && !reduced) ? document.startViewTransition(swap) : swap();
      live.classList.remove('off');
      ltext.textContent = 'Live schedule, updated ' + fmtTime.format(new Date()).toLowerCase();
    } catch (e) {
      list.innerHTML = '<li><span class="empty">The live schedule did not load. <a class="u" href="#book">Write to Mariah</a> for class times.</span></li>';
      list.setAttribute('aria-busy', 'false'); live.classList.add('off'); ltext.textContent = 'Schedule unavailable';
    }
  }
  loadSchedule();
  setInterval(() => { if (!document.hidden) loadSchedule(); }, 5 * 60 * 1000);
  const show = () => { $$('.rv').forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; }); $$('.reveal-img').forEach((e) => e.style.clipPath = 'none'); };
  if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') { show(); window.ready = true; return; }
  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (typeof Lenis !== 'undefined') { lenis = new Lenis({ lerp: 0.12 }); window.lenis = lenis; lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  $$('[data-tone=light]').forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 50px', end: 'bottom 50px', onToggle: (self) => nav.dataset.tone = self.isActive ? 'light' : '' }));
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.hero .shot', { clipPath: 'inset(0% 0 0 0)', duration: 1.1 }, 0.05)
    .from('.hero h1 .w', { y: 14, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.25)
    .to('.hero .rv', { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.55);
  $$('.rv').forEach((el) => { if (el.closest('.hero')) return; gsap.to(el, { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%' } }); });
  $$('.reveal-img').forEach((el) => { if (el.closest('.hero')) return; gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }); });
  $$('.band .ph, .contact > .ph').forEach((el) => gsap.fromTo(el, { yPercent: -3 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  window.ready = true;
})();
