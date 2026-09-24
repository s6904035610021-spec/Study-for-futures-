const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

// Navigation
$$('.tab').forEach(t=>t.onclick=()=>{
  $$('.tab').forEach(x=>x.classList.toggle('active',x===t));
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===t.dataset.page));
});

// Flashcards
let cards=load('cards',[
  {id:1,cat:'อังกฤษ',q:'Persistent',a:'ที่ยืนหยัด / ต่อเนื่อง'},
  {id:2,cat:'อังกฤษ',q:'Efficient',a:'มีประสิทธิภาพ'},
  {id:3,cat:'วิทยาศาสตร์',q:'สูตรน้ำ',a:'H₂O'},
  {id:4,cat:'วิทยาศาสตร์',q:'พืชสังเคราะห์แสงที่ส่วนใด',a:'คลอโรพลาสต์ในใบ'}]);
let prog=load('cardProg',{});let idx=0;
const cats=()=>[...new Set(cards.map(c=>c.cat))];
const cur=()=>cards.filter(c=>c.cat===$('#catSelect').value);
function fillCats(keep){
  const sel=$('#catSelect');sel.innerHTML=cats().map(c=>`<option>${c}</option>`).join('');
  if(keep&&cats().includes(keep))sel.value=keep;
}
function showCard(){
  const l=cur();$('#flip').classList.remove('on');
  if(!l.length){$('#qText').textContent='ยังไม่มีการ์ด';$('#aText').textContent='-';$('#counter').textContent='0/0';$('#fStat').textContent='';return}
  idx=(idx+l.length)%l.length;const c=l[idx];
  $('#qText').textContent=c.q;$('#aText').textContent=c.a;
  $('#counter').textContent=`${idx+1}/${l.length}`;
  const k=l.filter(x=>prog[x.id]===1).length,f=l.filter(x=>prog[x.id]===0).length;
  $('#fStat').textContent=`จำได้ ${k} · จำไม่ได้ ${f} · ยังไม่ทำ ${l.length-k-f}`;
}
$('#scene').onclick=()=>$('#flip').classList.toggle('on');
$('#catSelect').onchange=()=>{idx=0;showCard()};
$('#next').onclick=()=>{idx++;showCard()};$('#prev').onclick=()=>{idx--;showCard()};
function mark(v){const c=cur()[idx];if(!c)return;prog[c.id]=v;save('cardProg',prog);idx++;showCard()}
$('#known').onclick=()=>mark(1);$('#forgot').onclick=()=>mark(0);
$('#addCard').onclick=()=>{
  const cat=$('#newCat').value.trim()||$('#catSelect').value||'ทั่วไป',q=$('#newQ').value.trim(),a=$('#newA').value.trim();
  if(!q||!a)return alert('กรอกคำถามและคำตอบก่อนนะ');
  cards.push({id:Date.now(),cat,q,a});save('cards',cards);
  $('#newQ').value=$('#newA').value='';fillCats(cat);idx=cur().length-1;showCard();
};
$('#delCard').onclick=()=>{
  const c=cur()[idx];if(!c||!confirm('ลบการ์ดนี้?'))return;
  cards=cards.filter(x=>x.id!==c.id);save('cards',cards);fillCats($('#catSelect').value);idx=0;showCard();
};
fillCats();showCard();

// Tasks
let tasks=load('tasks',[]);
function renderTasks(){
  const rank={สูง:0,กลาง:1,ต่ำ:2};
  tasks.sort((a,b)=>a.done-b.done||rank[a.pri]-rank[b.pri]||(a.date||'9').localeCompare(b.date||'9'));
  $('#taskList').innerHTML=tasks.map(t=>`<li class="${t.done?'done':''}"><div><span class="t">${t.title.replace(/</g,'&lt;')}</span><small>${{สูง:'🔴',กลาง:'🟡',ต่ำ:'🟢'}[t.pri]} ${t.pri} ${t.date?'· ส่ง '+t.date:''}</small></div><div><button data-d="${t.id}">✔️</button><button data-x="${t.id}">🗑️</button></div></li>`).join('')||'<li>ยังไม่มีงาน 🎉</li>';
}
$('#taskList').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.d){const t=tasks.find(x=>x.id==b.dataset.d);t.done=!t.done}
  if(b.dataset.x)tasks=tasks.filter(x=>x.id!=b.dataset.x);
  save('tasks',tasks);renderTasks();
};
$('#addTask').onclick=()=>{
  const title=$('#tTitle').value.trim();if(!title)return alert('ใส่ชื่องานก่อนนะ');
  tasks.push({id:Date.now(),title,date:$('#tDate').value,pri:$('#tPri').value,done:false});
  save('tasks',tasks);$('#tTitle').value='';renderTasks();
};
renderTasks();

// Pomodoro
let total=1500,left=1500,iv=null;
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const draw=()=>{$('#timer').textContent=fmt(left);document.title=iv?fmt(left)+' · EdTech Hub':'EdTech Hub'};
$$('.chip').forEach(c=>c.onclick=()=>{
  $$('.chip').forEach(x=>x.classList.toggle('on',x===c));
  clearInterval(iv);iv=null;total=left=c.dataset.min*60;draw();
});
$('#start').onclick=()=>{
  if(iv)return;
  iv=setInterval(()=>{left--;draw();if(left<=0){clearInterval(iv);iv=null;beep();alert('หมดเวลาแล้ว! 🎉')}},1000);
};
$('#pause').onclick=()=>{clearInterval(iv);iv=null;draw()};
$('#reset').onclick=()=>{clearInterval(iv);iv=null;left=total;draw()};
function beep(){try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.start();setTimeout(()=>o.stop(),400)}catch{}}

// Stress
const levels=[
 ['😌','ผ่อนคลาย','ยอดเยี่ยม! รักษาจังหวะนี้ไว้ และอย่าลืมดื่มน้ำนะ 💧'],
 ['🙂','สบายๆ','ดีมาก ลองวางแผนวันพรุ่งนี้เล็กน้อยเพื่อให้ยังสบายใจต่อไป 📅'],
 ['😐','ปานกลาง','พักสายตา 5 นาที ยืดเส้นยืดสาย แล้วค่อยกลับมาอ่านต่อ 🌿'],
 ['😟','เครียด','ลองหายใจลึกๆ 4-7-8 ฟังเพลงสบายๆ และแบ่งงานเป็นชิ้นเล็กๆ 🎧'],
 ['😫','เครียดมาก','หยุดพักก่อน นอนหลับให้พอ คุยกับเพื่อนหรือคนที่ไว้ใจ หากรู้สึกหนักมากควรปรึกษานักจิตวิทยาของมหาวิทยาลัย 💜']];
let logs=load('stress',[]);
$('#emojis').innerHTML=levels.map((l,i)=>`<button data-i="${i}" title="${l[1]}">${l[0]}</button>`).join('');
$('#emojis').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;
  $$('#emojis button').forEach(x=>x.classList.toggle('sel',x===b));
  $('#tips').textContent=`${levels[i][1]}: ${levels[i][2]}`;
  const d=new Date().toLocaleDateString('th-TH',{day:'numeric',month:'short'});
  logs=logs.filter(x=>x.d!==d);logs.push({d,i});logs=logs.slice(-7);save('stress',logs);renderLogs();
};
const renderLogs=()=>$('#history').innerHTML=logs.map(l=>`<span>${l.d} ${levels[l.i][0]}</span>`).join('')||'ยังไม่มีข้อมูล';
renderLogs();

// Breathing
let bIv=null;
$('#breathBtn').onclick=()=>{
  const el=$('#breath'),tx=$('#breathTxt'),btn=$('#breathBtn');
  if(bIv){clearInterval(bIv);bIv=null;el.classList.remove('in');tx.textContent='พร้อมไหม?';btn.textContent='เริ่มฝึกหายใจ';return}
  btn.textContent='หยุด';let inh=true;
  const step=()=>{el.classList.toggle('in',inh);tx.textContent=inh?'หายใจเข้า...':'หายใจออก...';inh=!inh};
  step();bIv=setInterval(step,4000);
};

// Ambient sounds (Web Audio noise)
let ctx=null,src=null;
function stopSnd(){if(src){try{src.stop()}catch{}src=null}}
function play(type){
  stopSnd();ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
  const len=ctx.sampleRate*2,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
  const f=ctx.createBiquadFilter(),g=ctx.createGain();
  if(type==='rain'){f.type='highpass';f.frequency.value=1500;g.gain.value=.25}
  else{f.type='lowpass';f.frequency.value=500;g.gain.value=.5;
    const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.12;lg.gain.value=.3;lfo.connect(lg);lg.connect(g.gain);lfo.start()}
  src.connect(f);f.connect(g);g.connect(ctx.destination);src.start();
}
$$('[data-snd]').forEach(b=>b.onclick=()=>play(b.dataset.snd));
$('#stopSnd').onclick=stopSnd;
