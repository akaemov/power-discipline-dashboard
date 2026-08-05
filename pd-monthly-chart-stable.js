/* Power Discipline v20 — weekday metrics and goal tracking overlay. */
(() => {
  'use strict';
  const KEY = 'power-discipline-v18';
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const today = () => new Date().toISOString().slice(0,10);
  const month = d => (d || today()).slice(0,7);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const save = d => localStorage.setItem(KEY, JSON.stringify(d));
  const esc = s => String(s ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const isWorkday = date => { const n = new Date(date + 'T12:00:00').getDay(); return n > 0 && n < 6; };
  const daysInMonth = m => new Date(+m.slice(0,4), +m.slice(5,7), 0).getDate();
  const workdays = (m, through) => {
    const last = Math.min(through || daysInMonth(m), daysInMonth(m)); let n=0;
    for(let i=1;i<=last;i++) if(isWorkday(`${m}-${String(i).padStart(2,'0')}`)) n++;
    return n;
  };
  const score = d => { const a=['focus','energy','action','recovery'].map(k=>Number(d?.metrics?.[k])).filter(v=>v>=1&&v<=10); return a.length?a.reduce((x,y)=>x+y,0)/a.length/10:null; };
  const currentDays = d => (d.days||[]).filter(x=>month(x.date)===month() && x.date<=today() && isWorkday(x.date));
  function migrate(d) {
    d.goals = Array.isArray(d.goals) ? d.goals : [];
    d.goals.forEach(g => { if(!g.type) g.type='accumulation'; if(!Number.isFinite(Number(g.plan)) || Number(g.plan)<=0) g.plan=1; if(!Number.isFinite(Number(g.fact))) g.fact=0; });
    return d;
  }
  function goalFact(g,d) {
    if(g.type !== 'regular') return Number(g.fact)||0;
    return currentDays(d).filter(x=>Number(x.g?.[g.id])===1).length;
  }
  function progress(g,d) { return Math.max(0,Math.min(1,goalFact(g,d)/(Number(g.plan)||1))); }
  function goalMeta(g,d) {
    const fact=goalFact(g,d), plan=Number(g.plan)||1, p=progress(g,d), m=month();
    const elapsed=workdays(m,+today().slice(8,10)), total=workdays(m), expected=total?elapsed/total:0;
    const pace=expected ? p/expected : null, left=Math.max(0,plan-fact), remaining=Math.max(0,total-elapsed);
    let detail='';
    if(g.type==='regular') detail=`${fact} из ${plan} рабочих отметок`;
    else if(g.type==='project') detail=`${Math.round(fact)}% из 100%`;
    else detail=`${Number(fact).toLocaleString('ru-RU')} из ${Number(plan).toLocaleString('ru-RU')} ${esc(g.unit||'')}`;
    const need=(g.type==='accumulation'||g.type==='number') && remaining>0 ? `Нужно: ${Math.ceil(left/remaining).toLocaleString('ru-RU')} ${esc(g.unit||'')} / раб. день` : remaining===0 ? 'Период завершён' : `Осталось: ${left.toLocaleString('ru-RU')} ${esc(g.unit||'')}`;
    return {fact,plan,p,pace,detail,need};
  }
  function typeName(t) { return ({accumulation:'Накопительная',number:'Числовая',regular:'Регулярность',project:'Проект'})[t]||'Накопительная'; }
  function editGoal(id) {
    const d=migrate(read()), old=d.goals.find(g=>g.id===id), name=prompt('Название цели',old?.name||''); if(!name?.trim())return;
    const type=prompt('Тип: accumulation — доход/накопление; number — числовая; regular — регулярность; project — проект',old?.type||'accumulation');
    if(!['accumulation','number','regular','project'].includes(type)) { alert('Выберите один из указанных типов.'); return; }
    const defaultPlan=type==='project' ? 100 : (old?.plan||'');
    const plan=Number(prompt(type==='regular'?'Сколько рабочих отметок нужно в этом месяце?':type==='project'?'Целевой процент (обычно 100)':type==='accumulation'?'Цель на текущий месяц':'Целевое значение',defaultPlan));
    if(!Number.isFinite(plan)||plan<=0)return;
    let fact=old?.fact||0;
    if(type!=='regular') { fact=Number(prompt(type==='project'?'Текущий процент выполнения':'Текущий факт',fact)); if(!Number.isFinite(fact)) fact=0; }
    const unit=type==='regular' ? 'рабочих отметок' : (prompt('Единица измерения',old?.unit||'')??'');
    const g={id:old?.id||('g'+Date.now().toString(36)),name:name.trim(),type,plan,fact,unit};
    if(old) Object.assign(old,g); else d.goals.push(g); save(d); setTimeout(patch,0);
  }
  function goalsHtml(d) {
    if(!d.goals.length) return '<div class="empty">Добавьте первую цель</div>';
    return d.goals.map(g=>{const x=goalMeta(g,d), pc=Math.round(x.p*100), tempo=x.pace===null?'—':`${Math.round(x.pace*100)}% от планового темпа`;
      return `<div class="goal-row"><div class="goal-name">${esc(g.name)} <small style="color:#7b87a1;font-weight:700">· ${typeName(g.type)}</small><div class="progress"><span style="width:${pc}%"></span></div><small style="color:#7b87a1">${x.need}</small></div><div class="goal-num"><b>${pc}%</b>${tempo}</div><div class="goal-num"><b>${x.detail}</b></div><button class="button ghost pd-edit-goal" data-id="${g.id}">Изменить</button></div>`;
    }).join('');
  }
  function patch() {
    const d=migrate(read()); save(d);
    const ds=currentDays(d), scored=ds.map(score).filter(v=>v!==null), disc=scored.length?scored.reduce((a,b)=>a+b,0)/scored.length:null;
    const cards=$$('#dashboard .grid .card');
    if(cards[0]) { cards[0].querySelector('.metric').textContent=disc===null?'—':Math.round(disc*100)+'%'; cards[0].querySelector('.note').textContent=`Среднее по четырём факторам за ${scored.length} рабочих дней`; }
    const paces=d.goals.map(g=>goalMeta(g,d).pace).filter(Number.isFinite), pace=paces.length?paces.reduce((a,b)=>a+b,0)/paces.length:null;
    if(cards[2]) { cards[2].querySelector('.metric').textContent=pace===null?'—':Math.round(pace*100)+'%'; cards[2].querySelector('.note').textContent='Факт относительно плана на прошедшие рабочие дни'; }
    const list=$('#dashboard .goal-list'); if(list) list.innerHTML=goalsHtml(d);
    $$('.pd-edit-goal').forEach(b=>b.onclick=()=>editGoal(b.dataset.id));
    const add=$('#dashboard #addGoal'); if(add) add.onclick=()=>editGoal();
    const weekly=$('#dashboard .analysis-grid')?.previousElementSibling?.querySelector('p'); if(weekly) weekly.textContent='Средние оценки за последние семь заполненных рабочих дней. Выходные не влияют на результат.';
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#saveDay')) setTimeout(patch,120);
    if(e.target.closest('[data-tab], .editGoal, #addGoal')) setTimeout(patch,120);
  },true);
  const style=document.createElement('style');
  style.textContent='.goal-name small{display:block;margin-top:5px}.goal-row{align-items:center}.goal-row small{font-size:11px}.pd-goal-help{color:#7b87a1;font-size:12px}'; document.head.append(style);
  patch(); setTimeout(patch,250);
})();