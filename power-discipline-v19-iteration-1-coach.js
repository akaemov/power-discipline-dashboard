/* Power Discipline v19 — Итерация 1: «Следующий ход» и «Вернуться в систему».
   Подключить после основного скрипта v18 перед </body>:
   <script src="power-discipline-v19-iteration-1-coach.js"></script> */
(() => {
  'use strict';
  const KEY = 'power-discipline-v18';
  const $ = (s, root = document) => root.querySelector(s);
  const today = () => new Date().toISOString().slice(0, 10);
  const dateDaysAgo = n => {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const score = d => {
    const values = ['focus', 'energy', 'action', 'recovery']
      .map(k => Number(d?.metrics?.[k]))
      .filter(v => Number.isFinite(v) && v >= 1 && v <= 10);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length / 10 : null;
  };
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  };
  const write = data => localStorage.setItem(KEY, JSON.stringify(data));
  const latestDay = data => [...(data.days || [])].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  const daysWithoutEntry = data => {
    const dates = new Set((data.days || []).filter(d => score(d) !== null).map(d => d.date));
    let n = 0;
    while (!dates.has(dateDaysAgo(n))) n += 1;
    return n;
  };
  const lowStreak = data => {
    const a = [...(data.days || [])].sort((x, y) => y.date.localeCompare(x.date));
    return a.slice(0, 2).length === 2 && a.slice(0, 2).every(d => (score(d) || 0) < .5);
  };
  const nextMove = day => {
    if (!day || score(day) === null) return ['Начните с короткой отметки', 'Заполните четыре шкалы — приложение увидит, где системе нужна поддержка.'];
    const m = day.metrics || {};
    const factors = [
      ['focus', 'Фокус', 'Сегодня вечером подготовьте первый час: одно главное действие, закрытые уведомления и готовое рабочее место.'],
      ['energy', 'Энергия', 'Завтра не увеличивайте нагрузку: выберите одно ключевое действие и сократите второстепенные задачи.'],
      ['action', 'Ключевые действия', 'До начала дня сформулируйте один измеримый результат, который должен быть завершён до отвлечений.'],
      ['recovery', 'Восстановление', 'Сделайте восстановление главной задачей: время отбоя, спокойное завершение дня и снижение стимуляторов вечером.']
    ].map(x => ({ key: x[0], name: x[1], text: x[2], value: Number(m[x[0]]) }));
    const lowest = factors.filter(x => Number.isFinite(x.value)).sort((a, b) => a.value - b.value)[0];
    if (!lowest) return ['Начните с короткой отметки', 'Заполните четыре шкалы, чтобы увидеть следующий ход.'];
    if (lowest.value >= 7) return ['Сохраните работающий сценарий', 'Все четыре фактора удержаны на хорошем уровне. Не повышайте планку: повторите условия, которые сработали сегодня.'];
    return [`Следующий ход: ${lowest.name.toLowerCase()}`, `${lowest.name} — ${lowest.value}/10. ${lowest.text}`];
  };
  const state = () => {
    const data = read();
    const coach = data.coach || {};
    const missed = daysWithoutEntry(data);
    const recovery = coach.manualReturn || missed >= 3 || lowStreak(data);
    return { data, coach, missed, recovery, last: latestDay(data) };
  };
  const styles = `
  .pd-coach{margin:18px 0 0;padding:19px 20px;border-radius:16px;border:1px solid #d8e2ff;background:linear-gradient(125deg,#edf3ff,#fbfaff);box-shadow:0 10px 24px rgba(60,82,150,.08)}
  .pd-coach.return{border-color:#f2d6a6;background:linear-gradient(125deg,#fff8e9,#fffdf8)}
  .pd-coach-kicker{font-size:10px;letter-spacing:.11em;text-transform:uppercase;font-weight:900;color:#7180a8}.pd-coach h3{font-size:19px;letter-spacing:-.025em;margin:5px 0}.pd-coach p{margin:0;color:#60708f;max-width:760px}.pd-coach-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}.pd-coach button{font:inherit;font-weight:800;cursor:pointer;padding:8px 11px;border-radius:9px;border:1px solid #d5dffb;background:#fff;color:#536899}.pd-coach .primary{border:0;color:#fff;background:linear-gradient(120deg,#597af0,#8064e9)}
  `;
  const css = document.createElement('style'); css.textContent = styles; document.head.append(css);
  function card() {
    const s = state();
    if (s.recovery) {
      return `<article class="pd-coach return" data-coach="return"><div class="pd-coach-kicker">Режим возврата в систему</div><h3>Не нужно догонять.</h3><p>${s.missed >= 3 ? `Нет отметок ${s.missed} дня. ` : 'Последние два заполненных дня были в красной зоне. '}Сегодня верните базовый контур: одно главное действие, короткая отметка дня и подготовка восстановления. Остальное — необязательно.</p><div class="pd-coach-actions"><button class="primary" data-coach-action="input">Сделать короткую отметку</button><button data-coach-action="exit">Я заполнил два дня — завершить режим</button></div></article>`;
    }
    const [title, text] = nextMove(s.last);
    return `<article class="pd-coach" data-coach="next"><div class="pd-coach-kicker">Следующий ход</div><h3>${title}</h3><p>${text}</p><div class="pd-coach-actions"><button class="primary" data-coach-action="input">Открыть отметку дня</button><button data-coach-action="manual">Вернуться в систему</button></div></article>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-coach-action]').forEach(b => b.onclick = () => {
      const action = b.dataset.coachAction;
      const data = read(); data.coach = data.coach || {};
      if (action === 'manual') data.coach.manualReturn = true;
      if (action === 'exit') data.coach.manualReturn = false;
      write(data);
      if (action === 'input') document.querySelector('[data-tab="input"]')?.click();
      else enhance();
    });
  }
  function enhance() {
    document.querySelectorAll('.pd-coach').forEach(e => e.remove());
    const tab = document.querySelector('#dashboard.tab.active');
    if (!tab) return;
    const hero = $('.hero', tab);
    if (!hero) return;
    hero.insertAdjacentHTML('afterend', card());
    bind(tab);
  }
  const observer = new MutationObserver(() => requestAnimationFrame(enhance));
  observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  enhance();
})();
