const CATS = {
  "Медицина":{c:"#ff6b81",syn:"лекар доктор здраве болница лечение медицински медицинска болест"},
  "Право":{c:"#ffd166",syn:"правен правна юрист адвокат закон договор документ нотариус съд"},
  "Наука":{c:"#4dd0e1",syn:"учен научен изследване физика химия биология математика университет"},
  "Образование":{c:"#a5d86a",syn:"учител обучение урок курс преподавател уроци"},
  "Технологии":{c:"#b388ff",syn:"it програмист компютър сайт софтуер техника интернет"},
  "Финанси и бизнес":{c:"#ffa94d",syn:"счетоводител счетоводство данъци банка бизнес инвестиции финанси"},
  "Строителство и занаяти":{c:"#8d99ae",syn:"майстор ремонт строител електричар водопровод дърводелец"},
  "Друго":{c:"#f1f3ff",syn:""}
};
const KEY="sky-people-v1";
let people=[]; try{people=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){}
let hidden=new Set(), editId=null;
const $=s=>document.querySelector(s);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(people))}catch(e){}};

// ---- background canvas ----
const cv=$("#bg"),cx=cv.getContext("2d");let bgStars=[],shoot=[];
function resize(){cv.width=innerWidth;cv.height=innerHeight;bgStars=Array.from({length:Math.min(260,innerWidth*innerHeight/6000|0)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.3+.2,p:Math.random()*6.28,s:Math.random()*.02+.005}))}
addEventListener("resize",resize);resize();
(function loop(){cx.clearRect(0,0,cv.width,cv.height);
  for(const s of bgStars){s.p+=s.s;cx.globalAlpha=.35+.55*Math.abs(Math.sin(s.p));cx.fillStyle="#cfd8ff";cx.beginPath();cx.arc(s.x,s.y,s.r,0,6.28);cx.fill()}
  if(Math.random()<.004)shoot.push({x:Math.random()*cv.width*.8,y:Math.random()*cv.height*.4,l:0});
  shoot=shoot.filter(s=>s.l<40);for(const s of shoot){s.l++;cx.globalAlpha=1-s.l/40;cx.strokeStyle="#fff";cx.lineWidth=1.5;cx.beginPath();cx.moveTo(s.x+s.l*9,s.y+s.l*5);cx.lineTo(s.x+s.l*9-45,s.y+s.l*5-25);cx.stroke()}
  requestAnimationFrame(loop)})();

// ---- search ----
const norm=t=>(t||"").toLowerCase().replace(/ѝ/g,"и");
const stem=w=>w.length<=4?w:w.slice(0,Math.max(4,w.length-2));
function words(t){return norm(t).split(/[^\p{L}\p{N}]+/u).filter(Boolean)}
function score(p,q){
  const toks=words(q).filter(w=>w.length>1);if(!toks.length)return 0;
  const own=words([p.name,p.cat,p.help,p.tags,p.city,p.notes].join(" "));
  const syn=words(CATS[p.cat]?.syn||"");
  let sc=0;
  for(const t of toks){const s=stem(t);let best=0;
    for(const w of own){if(w===t)best=Math.max(best,3);else if(w.startsWith(s)||t.startsWith(stem(w))&&stem(w).length>=4)best=Math.max(best,2)}
    if(!best)for(const w of syn){if(w.startsWith(s)||stem(w)===s)best=1}
    if(!best)return 0; // всяка дума трябва да има съвпадение
    sc+=best}
  return sc}

// ---- render ----
function place(p){ // изборът на позиция, без припокриване
  if(p.x!=null)return;let best,bd=-1;
  for(let i=0;i<40;i++){const x=.05+Math.random()*.9,y=.2+Math.random()*.68;
    const d=people.reduce((m,o)=>o.x==null?m:Math.min(m,Math.hypot((o.x-x)*innerWidth,(o.y-y)*innerHeight)),1e9);
    if(d>bd){bd=d;best={x,y}}}
  p.x=best.x;p.y=best.y}
function render(newId){
  const sky=$("#sky");sky.innerHTML="";
  const q=$("#q").value.trim();const hits=new Map();
  if(q)for(const p of people){const s=score(p,q);if(s)hits.set(p.id,s)}
  for(const p of people){place(p);
    const b=document.createElement("button");b.className="star";
    b.style.cssText=`left:${p.x*100}%;top:${p.y*100}%;--c:${CATS[p.cat]?.c||"#fff"};--d:${2+Math.random()*3}s`;
    b.innerHTML=`<i></i><span>${esc(p.name)}</span>`;
    if(hidden.has(p.cat))b.classList.add("dim");
    if(q){hits.has(p.id)?b.classList.add("hit"):b.classList.add("dim")}
    if(p.id===newId)b.classList.add("new");
    b.onclick=()=>show(p.id);sky.appendChild(b)}
  save();
  $("#n").textContent=`${people.length} ${people.length==1?"звезда":"звезди"}`;
  $("#hello").style.display=people.length?"none":"flex";
  const R=$("#results");
  if(q){const arr=[...hits].sort((a,b)=>b[1]-a[1]).map(([id])=>people.find(p=>p.id===id));
    R.innerHTML=arr.length?arr.map(p=>`<div class="res" data-id="${p.id}"><span class="dot" style="--c:${CATS[p.cat].c}"></span><div><b>${esc(p.name)}</b><small>${esc(p.cat)}${p.city?" · "+esc(p.city):""} — ${esc(p.help.slice(0,90))}</small></div></div>`).join(""):`<div class="empty">Няма резултати за „${esc(q)}“. Опитайте с друга дума или добавете нова звезда.</div>`;
    R.classList.add("show");R.querySelectorAll(".res").forEach(e=>e.onclick=()=>show(e.dataset.id))}
  else R.classList.remove("show");
  legend()}
function legend(){const L=$("#legend");L.innerHTML="";
  for(const [k,v] of Object.entries(CATS)){const s=document.createElement("span");s.innerHTML=`<i class="dot" style="--c:${v.c};width:8px;height:8px"></i>${k}`;
    if(hidden.has(k))s.classList.add("off");
    s.onclick=()=>{hidden.has(k)?hidden.delete(k):hidden.add(k);render()};L.appendChild(s)}}
const esc=t=>String(t||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// ---- modals ----
const closeAll=()=>document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show"));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m||e.target.hasAttribute("data-close"))closeAll()}));
addEventListener("keydown",e=>{if(e.key==="Escape")closeAll()});
$("#catSel").innerHTML=Object.keys(CATS).map(k=>`<option>${k}</option>`).join("");
function openForm(p){editId=p?.id||null;const f=$("#form");f.reset();
  $("#fTitle").textContent=p?"Редакция":"Нова звезда";
  if(p)for(const k of["name","cat","city","help","tags","phone","email","notes"])f.elements[k].value=p[k]||"";
  closeAll();$("#mForm").classList.add("show");f.elements.name.focus()}
$("#add").onclick=()=>openForm();
$("#form").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  let id;
  if(editId){Object.assign(people.find(p=>p.id===editId),d);id=null}
  else{id=crypto.randomUUID?crypto.randomUUID():String(Date.now());people.push({id,...d,x:null,y:null})}
  closeAll();$("#q").value="";render(id)};
function show(id){const p=people.find(x=>x.id===id);if(!p)return;
  $("#view").style.setProperty("--c",CATS[p.cat]?.c);
  $("#view").innerHTML=`<span class="tag">${esc(p.cat)}</span><h2>${esc(p.name)}</h2>
   <p><span class="k">Може да помогне с</span>${esc(p.help)}</p>
   ${p.tags?`<p><span class="k">Ключови думи</span>${esc(p.tags)}</p>`:""}
   ${p.city?`<p><span class="k">Град</span>${esc(p.city)}</p>`:""}
   ${p.phone?`<p><span class="k">Телефон</span><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></p>`:""}
   ${p.email?`<p><span class="k">Имейл</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>`:""}
   ${p.notes?`<p><span class="k">Бележки</span>${esc(p.notes)}</p>`:""}
   <div class="actions"><button class="btn ghost" id="del">Изтрий</button><button class="btn ghost" id="edt">Редактирай</button><button class="btn" data-close>Затвори</button></div>`;
  $("#del").onclick=()=>{if(confirm("Да изтрия ли тази звезда?")){people=people.filter(x=>x.id!==id);closeAll();render()}};
  $("#edt").onclick=()=>openForm(p);
  closeAll();$("#mView").classList.add("show")}
$("#q").addEventListener("input",()=>render());
$("#q").addEventListener("keydown",e=>{if(e.key==="Enter"){const f=document.querySelector(".res");if(f)f.click()}});

// ---- backup ----
$("#exp").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(people,null,1)],{type:"application/json"}));a.download="zvezdno-nebe-kopie.json";a.click()};
$("#imp").onclick=()=>$("#file").click();
$("#file").onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(Array.isArray(d)){const ids=new Set(people.map(p=>p.id));d.forEach(p=>{if(p.id&&!ids.has(p.id))people.push(p)});render();alert("Възстановено.")}}catch(_){alert("Невалиден файл.")}e.target.value=""};

if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
render();
