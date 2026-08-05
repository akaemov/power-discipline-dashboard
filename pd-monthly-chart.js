(() => {
  'use strict';
  const KEY = 'power-discipline-v18';
  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  };
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const score = (d) => {
    const vals = ['focus', 'energy', 'action', 'recovery']
      .map((k) => Number(d && d.metrics ? d.metrics[k] : NaN))
      .filter((v) => v >= 1 && v <= 10);
    return vals.length ? avg(vals) / 10 : null;
  };
  const monthLabel = (k) => {
    const dt = new Date(k + '-01T12:00:00');
    return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(dt).replace('.', '');
  };

  const liveMonth = (data, key) => {
    const days = (data.days || []).filter((x) => x.date && x.date.slice(0, 7) === key && score(x) !== null);
    const habitAvgs = (data.habits || [])
      .map((h) => avg(days.map((x) => Number(x.h ? x.h[h.id] : NaN)).filter((v) => Number.isFinite(v))))
      .filter((v) => Number.isFinite(v));
    const goalRatios = (data.goals || [])
      .map((g) => Math.max(0, Math.min(1, (Number(g.fact) || 0) / (Number(g.plan) || 1))));
    return {
      month: key,
      discipline: avg(days.map(score).filter((v) => v !== null)),
      habits: avg(habitAvgs),
      goals: avg(goalRatios)
    };
  };

  const buildSeries = () => {
    const data = read();
    const now = new Date().toISOString().slice(0, 7);
    const past = (data.monthSnapshots || []).filter((x) => x.month !== now);
    const all = past.concat([liveMonth(data, now)]).sort((a, b) => a.month.localeCompare(b.month));
    return all.slice(-8);
  };

  const META = {
    discipline: { label: 'Индекс дисциплины', color: '#627fee', hint: 'Показывает качество состояния по четырём факторам' },
    habits: { label: 'Привычки', color: '#35ae91', hint: 'Показывает устойчивость активных привычек' },
    goals: { label: 'Цели', color: '#cf6f8a', hint: 'Показывает средний прогресс активных целей' }
  };

  const style = document.createElement('style');
  style.textContent = [
    '.uxtrend{padding:19px 22px 20px}',
    '.uxtrend-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}',
    '.uxtrend-title{font-size:16px;font-weight:900;letter-spacing:-0.02em}',
    '.uxtrend-sub{color:#7b87a1;font-size:12px;margin-top:3px}',
    '.uxtrend-value{text-align:right}',
    '.uxtrend-value b{font-size:25px;letter-spacing:-0.05em}',
    '.uxtrend-value span{display:block;color:#6d7b99;font-size:11px;font-weight:800}',
    '.uxtrend-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:15px}',
    '.uxtrend-tabs button{font:inherit;font-size:11px;font-weight:850;color:#71809f;border:1px solid #e1e7f5;background:#fff;padding:7px 10px;border-radius:999px;cursor:pointer}',
    '.uxtrend-tabs button.on{color:#34446b;background:#f3f6ff;border-color:#cfdafa}',
    '.uxtrend-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}',
    '.uxtrend-canvas{width:100%;height:205px}',
    '.uxtrend-canvas svg{display:block}',
    '.uxgrid{stroke:#e9eef9;stroke-dasharray:3 6}',
    '.uxlabel{fill:#95a1ba;font-size:10px;font-weight:800}',
    '.uxdot{fill:#fff;stroke-width:3}',
    '.uxhint{margin-top:10px;padding:10px 12px;border-radius:10px;background:#f7f9ff;color:#687694;font-size:12px}',
    '.uxempty{padding:30px 0;color:#7b87a1;text-align:center;font-size:13px}',
    '@media (max-width:550px){.uxtrend{padding:16px}.uxtrend-head{display:block}.uxtrend-value{text-align:left;margin-top:10px}}'
  ].join('\n');
  document.head.appendChild(style);

  function buildSvg(key, width) {
    const series = buildSeries();
    const hasData = series.some((d) => Number.isFinite(d[key]));
    if (!hasData) return '<div class="uxempty">Появится после первой заполненной отметки.</div>';

    const meta = META[key];
    const h = 205, l = 34, r = 14, t = 10, b = 30;
    const n = series.length;
    const xAt = (i) => l + (width - l - r) * (n === 1 ? 0.5 : i / (n - 1));
    const yAt = (v) => t + (h - t - b) * (1 - (v === null || v === undefined ? 0 : v));

    const points = series.map((d, i) => xAt(i) + ',' + yAt(d[key])).join(' ');
    const area = l + ',' + (h - b) + ' ' + points + ' ' + (width - r) + ',' + (h - b);

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((v) => (
      '<line class="uxgrid" x1="' + l + '" x2="' + (width - r) + '" y1="' + yAt(v) + '" y2="' + yAt(v) + '"/>' +
      '<text class="uxlabel" x="0" y="' + (yAt(v) + 4) + '">' + Math.round(v * 100) + '%</text>'
    )).join('');

    const dotsAndLabels = series.map((d, i) => (
      '<circle class="uxdot" cx="' + xAt(i) + '" cy="' + yAt(d[key]) + '" r="4" stroke="' + meta.color + '">' +
      '<title>' + monthLabel(d.month) + ': ' + Math.round((d[key] || 0) * 100) + '%</title></circle>' +
      '<text class="uxlabel" x="' + xAt(i) + '" y="' + (h - 7) + '" text-anchor="middle">' + monthLabel(d.month) + '</text>'
    )).join('');

    return (
      '<svg viewBox="0 0 ' + width + ' ' + h + '" width="' + width + '" height="' + h + '" role="img" aria-label="' + meta.label + ' по месяцам">' +
      '<defs><linearGradient id="uxfill-' + key + '" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0" stop-color="' + meta.color + '" stop-opacity="0.22"/>' +
      '<stop offset="1" stop-color="' + meta.color + '" stop-opacity="0"/></linearGradient></defs>' +
      gridLines +
      '<polygon points="' + area + '" fill="url(#uxfill-' + key + ')"/>' +
      '<polyline points="' + points + '" fill="none" stroke="' + meta.color + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      dotsAndLabels +
      '</svg>'
    );
  }

  function buildFrame(key) {
    const series = buildSeries();
    const meta = META[key];
    const vals = series.map((d) => d[key]).filter((v) => Number.isFinite(v));
    const cur = vals.length ? series[series.length - 1][key] || 0 : 0;
    const prevVal = series.length > 1 && Number.isFinite(series[series.length - 2][key]) ? series[series.length - 2][key] : null;
    const deltaPct = Math.round((cur - (prevVal || 0)) * 100);
    const delta = prevVal === null ? '—' : (deltaPct >= 0 ? '+' : '') + deltaPct + ' п.п.';

    const tabs = Object.keys(META).map((k) => (
      '<button class="' + (k === key ? 'on' : '') + '" data-ux-metric="' + k + '">' +
      '<i class="uxtrend-dot" style="background:' + META[k].color + '"></i>' + META[k].label + '</button>'
    )).join('');

    return (
      '<div class="uxtrend-head"><div><div class="uxtrend-title">' + meta.label + '</div>' +
      '<div class="uxtrend-sub">' + meta.hint + '</div></div>' +
      '<div class="uxtrend-value"><b>' + Math.round(cur * 100) + '%</b>' +
      '<span>к прошлому периоду: ' + delta + '</span></div></div>' +
      '<div class="uxtrend-tabs">' + tabs + '</div>' +
      '<div class="uxtrend-canvas" data-ux-canvas></div>' +
      '<div class="uxhint">Нажмите на показатель, чтобы увидеть его траекторию отдельно — без наложения несвязанных линий.</div>'
    );
  }

  function drawInto(host) {
    const key = host.dataset.uxKey || 'discipline';
    const canvas = qs('[data-ux-canvas]', host);
    if (!canvas) return;
    const width = Math.round(canvas.getBoundingClientRect().width);
    if (width < 40) {
      requestAnimationFrame(() => drawInto(host));
      return;
    }
    canvas.innerHTML = buildSvg(key, width);
  }

  function mount(host, key) {
    host.dataset.uxKey = key;
    host.innerHTML = buildFrame(key);
    host.onclick = (e) => {
      const btn = e.target.closest('[data-ux-metric]');
      if (btn) mount(host, btn.dataset.uxMetric);
    };
    requestAnimationFrame(() => drawInto(host));
  }

  function convertLegacyCharts() {
    qsa('.chart-wrap').forEach((old) => {
      if (old.dataset.uxDone === '1') return;
      const div = document.createElement('div');
      div.className = 'uxtrend';
      div.dataset.uxDone = '1';
      old.replaceWith(div);
      const foot = div.nextElementSibling;
      if (foot && foot.classList && foot.classList.contains('chart-footer')) foot.remove();
      mount(div, 'discipline');
    });
  }

  function redrawVisible() {
    qsa('.uxtrend').forEach((host) => {
      if (host.offsetParent !== null) drawInto(host);
    });
  }

  convertLegacyCharts();

  const observer = new MutationObserver(() => {
    convertLegacyCharts();
    redrawVisible();
  });
  observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav button') || e.target.closest('[data-tab]')) {
      requestAnimationFrame(() => requestAnimationFrame(redrawVisible));
    }
  }, true);

  window.addEventListener('resize', redrawVisible);
})();
