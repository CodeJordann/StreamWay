// How the site works: pages, search, favorites and the pop-up window.
{
const state = {view:'home', q:'', free:false, sort:'az'};
let favs = [];
try { favs = JSON.parse(localStorage.getItem('sw-favs') || '[]'); } catch (e) { favs = []; }
const saveFavs = () => { try { localStorage.setItem('sw-favs', JSON.stringify(favs)); } catch (e) {} };

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const count = id => SITES.filter(s => s.cats.includes(id)).length;
const catName = id => (CATS.find(c => c.id === id) || {}).name || id;
const heart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`;

function renderScreens(){
  $('#screens').innerHTML = CATS.map(c => `
    <a class="scr" href="#${c.id}">
      <div class="frame"><div class="tv"><svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ART[c.id]}</svg></div></div>
      <div class="stand"></div>
      <div class="cap"><b><i class="dot" aria-hidden="true"></i>${esc(c.name)}</b>${count(c.id) ? `<span>${count(c.id)} ${count(c.id) === 1 ? 'service' : 'services'}</span>` : ''}</div>
    </a>`).join('');
}

function list(){
  const q = state.q.trim().toLowerCase();
  const out = SITES.filter(s =>
    (state.view === 'favorites' ? favs.includes(s.name) : s.cats.includes(state.view)) &&
    (!state.free || s.free) &&
    (!q || (s.name + ' ' + s.desc + (s.free ? ' free' : ' paid')).toLowerCase().includes(q))
  );
  out.sort((a, b) => state.sort === 'free' && a.free !== b.free ? (a.free ? -1 : 1) : a.name.localeCompare(b.name));
  return out;
}

const slotCard = `<article class="card add"><button class="addbtn" data-slot>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Insert link</button></article>`;

function renderGrid(){
  const items = list();
  $('#heading').textContent = items.length ? `${items.length} ${items.length === 1 ? 'service' : 'services'}` : '';
  if (!items.length && state.view !== 'favorites') { $('#grid').innerHTML = slotCard; return; }
  if (!items.length) {
    $('#grid').innerHTML = `<div class="empty"><b>Nothing here yet</b>${!SITES.length ? 'Services will show up here once they are added' : state.view === 'favorites' && !favs.length ? 'Tap the heart on any service to save it here' : 'Try another search or turn off Free only'}</div>`;
    return;
  }
  $('#grid').innerHTML = items.map(s => {
    const on = favs.includes(s.name);
    const others = s.cats.filter(c => c !== state.view).map(catName);
    return `<article class="card">
      <div class="mono" aria-hidden="true">${esc(s.name[0])}</div>
      <h3><button data-open="${esc(s.name)}">${esc(s.name)}</button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></h3>
      <button class="fav" data-fav="${esc(s.name)}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Save'} ${esc(s.name)} ${on ? 'from' : 'to'} favorites">${heart}</button>
      <div class="meta">${s.free ? '<span class="free">Free</span>' : 'Paid'}${others.length ? ' · Also ' + others.join(', ') : ''}</div>
      <p>${esc(s.desc)}</p>
    </article>`;
  }).join('') + (state.view !== 'favorites' ? slotCard : '');
}

function route(forced){
  const h = typeof forced === 'string' ? forced : location.hash.slice(1);
  const cat = CATS.find(c => c.id === h);
  state.view = cat ? cat.id : h === 'favorites' ? 'favorites' : 'home';
  const home = state.view === 'home';
  document.querySelectorAll('.home').forEach(el => el.hidden = !home);
  $('#view').hidden = home;
  document.querySelectorAll('.nav nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + state.view));
  if (home) { renderScreens(); document.title = 'StreamWay'; }
  else {
    const name = cat ? cat.name : 'Favorites';
    $('#vname').textContent = name;
    $('#vdesc').textContent = cat ? cat.desc : 'Services you saved on this device';
    $('#vart').innerHTML = ART[cat ? cat.id : 'movies-tv'];
    document.title = name + ' · StreamWay';
    state.q = ''; $('#q').value = '';
    renderGrid();
  }
  window.scrollTo(0, 0);
}

$('#grid').addEventListener('click', e => {
  const b = e.target.closest('[data-fav]'); if (!b) return;
  e.preventDefault();
  const n = b.dataset.fav;
  favs = favs.includes(n) ? favs.filter(x => x !== n) : [...favs, n];
  saveFavs(); renderGrid();
});
const modal = $('#modal');
function openModal(name){
  const s = SITES.find(x => x.name === name) || {name:'', link:''};
  $('#mLink').innerHTML = s.link
    ? `<a class="golink" href="${esc(s.link)}" target="_blank" rel="noopener">Open ${esc(s.name)}</a>`
    : `<div class="slot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>Insert link</div>`;
  if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
}
const closeModal = () => { if (modal.close) modal.close(); else modal.removeAttribute('open'); };
$('#mClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
$('#grid').addEventListener('click', e => {
  if (e.target.closest('[data-slot]')) { openModal(null); return; }
  const b = e.target.closest('[data-open]'); if (b) openModal(b.dataset.open);
});
$('#q').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });
$('#freeOnly').addEventListener('click', e => { state.free = !state.free; e.currentTarget.setAttribute('aria-pressed', state.free); renderGrid(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
document.addEventListener('keydown', e => { if (e.key === '/' && !$('#view').hidden && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); } });
// Switch pages directly on click, so it works even where links are blocked
function go(view){
  route(view);
  try { history.pushState(null, '', view ? '#' + view : location.pathname + location.search); } catch (e) {}
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  go(a.getAttribute('href').slice(1));
});
window.addEventListener('hashchange', () => route());
window.addEventListener('popstate', () => route());
try { route(); } catch (e) { route(''); }
}
