/* Power Discipline mobile interface overlay. */
(()=>{'use strict';
const css=`
@media(max-width:700px){
 body{padding-bottom:calc(76px + env(safe-area-inset-bottom));font-size:15px}
 .top{position:static;padding:13px 15px 10px;background:#ffffffdf}
 .brand{font-size:12px}
 .nav{position:fixed!important;z-index:100;left:0;right:0;bottom:0;margin:0!important;padding:8px 10px calc(8px + env(safe-area-inset-bottom));display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:5px!important;background:#fffffff2;border-top:1px solid #dfe6f7;box-shadow:0 -8px 24px #30487512;backdrop-filter:blur(14px);overflow:visible!important}
 .nav button{min-width:0!important;min-height:48px!important;padding:7px 4px!important;white-space:normal!important;font-size:10px!important;line-height:1.15!important}
 .wrap{padding:22px 14px 28px!important}
 .hero{margin-bottom:18px!important}.hero h1{font-size:31px!important}.hero p{font-size:13px!important}
 .hero>.button{width:100%;min-height:48px;margin-top:14px}
 .grid{grid-template-columns:1fr!important;gap:10px!important}.card{padding:16px!important}.metric{font-size:32px!important}
 .section{margin-top:25px!important}.section-head{display:block!important}.section-head>.button{width:100%;margin-top:12px;min-height:48px}
 .panel-top{padding:16px!important;display:block!important}.panel-top .button{width:100%;margin-top:12px;min-height:46px}
 .goal-list{padding:4px 14px 12px!important}.goal-row,.pd-simple-goal{display:block!important;padding:16px 0!important}.goal-num{margin-top:9px;text-align:left!important}.goal-row .button{width:100%;min-height:46px;margin-top:12px}
 .analysis-grid{grid-template-columns:1fr!important}.week-row{grid-template-columns:83px 1fr 36px!important}.chart-wrap,.pdchart{padding:15px!important}.chart{height:190px!important}
 .form-grid,.scale{grid-template-columns:1fr!important;gap:10px!important}.scale-card{padding:15px!important}.scale-card input{height:52px!important;font-size:19px!important}
 input,select{min-height:48px!important;font-size:16px!important}.roster{gap:8px!important}.habit-row{display:block!important;padding:15px!important}.habit-row select{margin-top:10px}.habit-row .button{width:100%;min-height:46px;margin-top:10px}
 #saveDay{position:sticky!important;bottom:calc(72px + env(safe-area-inset-bottom));z-index:20;width:100%;min-height:54px;margin-top:20px!important;box-shadow:0 10px 24px #415cc455}
 #pd-plan .hero{display:block!important}.pd-plan-row{padding:14px!important}.pd-plan-row .form-grid{grid-template-columns:1fr!important}.pd-plan-row .danger{width:100%;min-height:45px}
 .pd-plan-note{font-size:13px!important}.pdchart-head{display:block!important}.pdchart-value{text-align:left!important;margin-top:10px}.pdchart-tabs{display:grid!important;grid-template-columns:1fr 1fr!important}.pdchart-tabs button{min-height:40px}
 .table-wrap{margin:0 -14px!important;border-left:0!important;border-right:0!important;border-radius:0!important}table{min-width:560px!important}
 .footer{padding-bottom:12px!important}.button{min-height:44px!important}
}
@media(max-width:380px){.hero h1{font-size:28px!important}.metric{font-size:29px!important}.nav button{font-size:9px!important}.wrap{padding-left:12px!important;padding-right:12px!important}}
`;
const style=document.createElement('style');style.id='pd-mobile-interface';style.textContent=css;document.head.append(style);
function labelNav(){const nav=document.querySelector('#nav');if(!nav)return;const plan=nav.querySelector('[data-pd-plan]');if(plan)plan.textContent='План';const mapping={dashboard:'Главная',input:'Отметка',habits:'Привычки',review:'История',settings:'Ещё'};nav.querySelectorAll('[data-tab]').forEach(b=>{if(mapping[b.dataset.tab])b.textContent=mapping[b.dataset.tab]});const buttons=[...nav.querySelectorAll('button')];if(buttons.length>4){buttons.filter(b=>b.dataset.tab==='habits'||b.dataset.tab==='review'||b.dataset.tab==='settings').forEach(b=>b.style.display='none')};}
function watch(){labelNav();setTimeout(labelNav,200)}
document.addEventListener('click',()=>setTimeout(watch,80),true);watch();setTimeout(watch,400);
})();

/* Existing monthly-planning behaviour is retained in the preceding v21 script. */