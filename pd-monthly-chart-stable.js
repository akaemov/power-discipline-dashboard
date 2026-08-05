/* Stable monthly chart: replaces pd-monthly-chart.js. No MutationObserver. */
(() => {
  'use strict';
  const KEY = 'power-discipline-v18';
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const $ = (s, r = document) => r.querySelector(s);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const data = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const score = d => { const a = ['focus','energy','action','recovery'].map(k => Number(d?.metrics?.[k])).filter(v => v >= 1 && v <= 10); return a.length ? avg(a) / 10 : null; };
  const label = m => new Intl.DateTimeFormat('ru-RU',{month:'short'}).format(new Date(m + '-01T12:00:00')).replace('.','');
  const meta = {discipline:['Индекс дисциплины','#627fee','Показывает качество состояния по четырём факторам'],habits:['Привычки','#35ae91','Показывает устойчивость активных привычек'],goals:['Цели','#cf6f8a','Показывает средний прогресс активных целей']};
  function series() {
    const d = data(), now = new Date().toISOString().slice(0,7);
    const days = (d.days || []).filter(x => x.date?.slice(0,7) === now && score(x) !== null);
    const habits = (d.habits || []).map(h => avg(days.map(x => Number(x.h?.[h.id])).filter(Number.isFinite))).filter(Number.isFinite);
    const goals = (d.goals || []).map(g => Math.max(0,Math.min(1,(Number(g.fact)||0)/(Number(g.plan)||1))));
    const current = {month:now, discipline:avg(days.map(score).filter(v => v !== null)), habits:avg(habits), goals:avg(goals)};
    return [...(d.monthSnapshots || []).filter(x => x.month !== now), current].sort((a,b) => a.month.localeCompare(b.month)).slice(-8);
  }
  const css = document.createElement('style');
  css.textContent = '.pdchart{padding:19px 22px 20px}.pdchart-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:18px}.pdchart-title{font-size:16px;font-weight:900}.pdchart-sub{font-size:12px;color:#7b87a1;margin-top:3px}.pdchart-value{text-align:right}.pdchart-value b{font-size:25px}.pdchart-value span{display:block;font-size:11px;font-weight:800;color:#6d7b99}.pdchart-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:15px}.pdchart-tabs button{font:inherit;font-size:11px;font-weight:850;color:#71809f;border:1px solid #e1e7f5;background:#fff;padding:7px 10px;border-radius:999px;cursor:pointer}.pdchart-tabs .on{background:#f3f6ff;color:#34446b;border-color:#cfdafa}.pdchart-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}.pdchart-canvas{height:205px;width:100%}.pdchart-canvas svg{display:block}.pdchart-grid{stroke:#e9eef9;stroke-dasharray:3 6}.pdchart-label{fill:#95a1ba;font-size:10px;font-weight:800}.pdchart-point{fill:#fff;stroke-width:3}.pdchart-hint{margin-top:10px;padding:10px 12px;border-radius:10px;background:#f7f9ff;color:#687694;font-size:12px}@media(max-width:550px){.pdchart{padding:16px}.pdchart-head{display:block}.pdchart-value{text-align:left;margin-top:10px}}';
  document.head.append(css);
  function svg(key, w) {
    const s = series(), [name,color] = meta[key], h=205,l=34,r=14,t=10,b=30,n=s.length;
    if (!s.some(x => Number.isFinite(x[key]))) return '<div class="pdchart-hint">Появится после первой заполненной отметки.</div>';
    const x=i=>l+(w-l-r)*(n===1?.5:i/(n-1)), y=v=>t+(h-t-b)*(1-(Number.isFinite(v)?v:0));
    const pts=s.map((d,i)=>`${x(i)},${y(d[key])}`).join(' '), area=`${l},${h-b} ${pts} ${w-r},${h-b}`;
    const grids=[0,.25,.5,.75,1].map(v=>`<line class="pdchart-grid" x1="${l}" x2="${w-r}" y1="${y(v)}" y2="${y(v)}"/><text class="pdchart-label" x="0" y="${y(v)+4}">${Math.round(v*100)}%</text>`).join('');
    const points=s.map((d,i)=>`<circle class="pdchart-point" cx="${x(i)}" cy="${y(d[key])}" r="4" stroke="${color}"><title>${label(d.month)}: ${Math.round((d[key]||0)*100)}%</title></circle><text class="pdchart-label" x="${x(i)}" y="${h-7}" text-anchor="middle">${label(d.month)}</text>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="${name} по месяцам"><defs><linearGradient id="pd-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${grids}<polygon points="${area}" fill="url(#pd-fill)"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${points}</svg>`;
  }
  function render(host, key = host.dataset.metric || 'discipline') {
    host.dataset.metric = key;
    const s=series(), [name,color,hint]=meta[key], cur=s.at(-1)?.[key] || 0, prev=s.length>1?s.at(-2)?.[key]:null, delta=Number.isFinite(prev)?`${Math.round((cur-prev)*100)>=0?'+':''}${Math.round((cur-prev)*100)} п.п.`:'—';
    host.innerHTML=`<div class="pdchart-head"><div><div class="pdchart-title">${name}</div><div class="pdchart-sub">${hint}</div></div><div class="pdchart-value"><b>${Math.round(cur*100)}%</b><span>к прошлому периоду: ${delta}</span></div></div><div class="pdchart-tabs">${Object.entries(meta).map(([k,v])=>`<button class="${k===key?'on':''}" data-pdmetric="${k}"><i class="pdchart-dot" style="background:${v[1]}"></i>${v[0]}</button>`).join('')}</div><div class="pdchart-canvas"></div><div class="pdchart-hint">Нажмите на показатель, чтобы увидеть его траекторию отдельно — без наложения несвязанных линий.</div>`;
    host.onclick=e=>{const b=e.target.closest('[data-pdmetric]');if(b)render(host,b.dataset.pdmetric)};
    requestAnimationFrame(()=>draw(host));
  }
  function draw(host) { const c=$('.pdchart-canvas',host); if(!c || host.offsetParent===null)return; const w=Math.round(c.getBoundingClientRect().width); if(w>80)c.innerHTML=svg(host.dataset.metric,w); }
  function upgrade() { $$('.chart-wrap').filter(x=>x.offsetParent!==null).forEach(old=>{const host=document.createElement('div');host.className='pdchart';old.replaceWith(host);const foot=host.nextElementSibling;if(foot?.classList.contains('chart-footer'))foot.remove();render(host);}); $$('.pdchart').filter(x=>x.offsetParent!==null).forEach(draw); }
  upgrade();
  document.addEventListener('click',()=>setTimeout(upgrade,80),true);
  window.addEventListener('resize',()=>$$('.pdchart').forEach(draw));
})();
