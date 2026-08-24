function updateWordStackViewportHeight(){
  const vv = window.visualViewport;
  const h = Math.round(vv ? vv.height : window.innerHeight);
  document.documentElement.style.setProperty('--ws-visual-height', `${h}px`);
}
updateWordStackViewportHeight();
window.addEventListener('resize', updateWordStackViewportHeight, {passive:true});
window.addEventListener('orientationchange', updateWordStackViewportHeight, {passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', updateWordStackViewportHeight, {passive:true});
}

const KEY='smartFlashcardsDataV1';
const SETTINGS='smartFlashcardsSettingsV1';
const todayISO=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const addDays=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+Math.max(0,Math.round(n)));return d.toISOString().slice(0,10)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const $=id=>document.getElementById(id);
const KOREAN_WEEKDAYS=['일','월','화','수','목','금','토'];
function formatLocalStudyDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day} (${KOREAN_WEEKDAYS[d.getDay()]})`}
function updateStudyActualDate(){const el=$('studyActualDate');if(el)el.textContent=formatLocalStudyDate()}

const FIELD_DEFS={
  englishWord:{label:'영어단어',lang:'en'}, partOfSpeech:{label:'품사',lang:'en'}, ipa:{label:'발음기호',lang:'en'}, englishExample:{label:'영어예문',lang:'en'},
  koreanMeaning:{label:'한글의미',lang:'ko'}, koreanExample:{label:'한글예문',lang:'ko'},
  category:{label:'Category',lang:'meta'}, chapter:{label:'Chapter',lang:'meta'}, tags:{label:'Tags',lang:'meta'}
};
const DEFAULT_FRONT=['koreanMeaning','koreanExample','category','chapter','tags'];
const DEFAULT_BACK=['englishWord','partOfSpeech','ipa','englishExample','category','chapter','tags'];

function seed(){return [
 {englishWord:'appreciate',partOfSpeech:'verb',ipa:'/əˈpriːʃieɪt/',englishExample:'I really appreciate your help.',koreanMeaning:'감사하다, 진가를 알아보다',koreanExample:'당신의 도움에 정말 감사드립니다.',category:'대학영어',chapter:'1강',tags:'중요'},
 {englishWord:'collaboration',partOfSpeech:'noun',ipa:'/kəˌlæbəˈreɪʃn/',englishExample:'Good collaboration leads to better results.',koreanMeaning:'협력, 공동 작업',koreanExample:'좋은 협력은 더 나은 결과로 이어진다.',category:'대학영어',chapter:'1강',tags:''},
 {englishWord:'contemporary',partOfSpeech:'adjective',ipa:'/kənˈtempəreri/',englishExample:'I enjoy contemporary art.',koreanMeaning:'동시대의, 현대의',koreanExample:'나는 현대 미술을 즐긴다.',category:'대학영어',chapter:'2강',tags:''},
 {englishWord:'delve',partOfSpeech:'verb',ipa:'/delv/',englishExample:"Let's delve into this topic.",koreanMeaning:'깊이 파고들다',koreanExample:'이 주제를 깊이 파고들어 보자.',category:'대학영어',chapter:'2강',tags:'중요'},
 {englishWord:'tranquillity',partOfSpeech:'noun',ipa:'/træŋˈkwɪləti/',englishExample:'He came to appreciate the tranquillity of the river.',koreanMeaning:'고요함, 평온함',koreanExample:'그는 강의 평온함을 이해하게 되었다.',category:'생활영어',chapter:'1강',tags:''}
].map(x=>({...x,id:uid(),front:x.englishWord,back:x.koreanMeaning,example:x.englishExample,ease:2.5,interval:0,reps:0,lapses:0,reviews:0,due:todayISO(),createdAt:new Date().toISOString()}))}

function load(){
  let d=null;try{d=JSON.parse(localStorage.getItem(KEY))}catch{}
  if(!d?.cards)d={cards:seed(),quizHistory:[],totalReviews:0,deckMeta:{},studySecondsByDate:{},reviewHistory:[]};
  d.cards=d.cards.map(migrateCard);
  d.quizHistory=Array.isArray(d.quizHistory)?d.quizHistory:[];
  d.reviewHistory=Array.isArray(d.reviewHistory)?d.reviewHistory:[];
  d.studySecondsByDate=d.studySecondsByDate||{};
  d.deckMeta=d.deckMeta||{};
  return d;
}
function migrateCard(c){
  c={...c};
  c.englishWord=c.englishWord||c.front||'';
  c.koreanMeaning=c.koreanMeaning||c.back||'';
  c.englishExample=c.englishExample||c.example||'';
  c.koreanExample=c.koreanExample||'';
  c.partOfSpeech=c.partOfSpeech||c.pos||c.partofspeech||'';
  c.ipa=c.ipa||c.pronunciation||'';
  c.category=c.category||'기본 단어장';c.chapter=c.chapter||'';c.tags=c.tags||'';
  c.front=c.englishWord;c.back=c.koreanMeaning;c.example=c.englishExample;
  c.id=c.id||uid();c.ease=Number(c.ease)||2.5;c.interval=Number(c.interval)||0;c.reps=Number(c.reps)||0;c.reviews=Number(c.reviews)||0;
  if(typeof c.memoryUnknown!=='boolean')c.memoryUnknown=true;
  c.due=c.due||todayISO();return c;
}
let state=load();
let settings=Object.assign({newCardInterval:1,writtenStrictness:'normal',ttsEnabled:true,ttsLocale:'en-US',ttsRate:1,weakMinWrong:2,weakRate:0.4,cardDirectionPreset:'koFront',frontFields:DEFAULT_FRONT,backFields:DEFAULT_BACK,googleClientId:'',googleSheetUrl:'https://docs.google.com/spreadsheets/d/1Xlc6nummFrvCLkDiOMUtj_u4SpHwwwDlFcf95-N4g5I/edit',googleAutoSync:true},JSON.parse(localStorage.getItem(SETTINGS)||'{}'));
if(!Array.isArray(settings.frontFields))settings.frontFields=[...DEFAULT_FRONT];if(!Array.isArray(settings.backFields))settings.backFields=[...DEFAULT_BACK];
let studyQueue=[],studyIndex=0,studyFlipped=false;
let quiz=[],quizIndex=0,quizAnswers=[],quizChecked=false,selectedMCQ=null;
let activeStudyStart=null,activeStudyTimer=null;

function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function save(){persist();renderAll()}
function saveSettings(){localStorage.setItem(SETTINGS,JSON.stringify(settings))}
function toast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}

function decks(){return [...new Set([...(state.cards||[]).map(c=>c.category||'기본 단어장'),...Object.keys(state.deckMeta||{})])].sort((a,b)=>a.localeCompare(b,'ko'))}
function ensureDeckMeta(){decks().forEach((d,i)=>{if(!state.deckMeta[d])state.deckMeta[d]={icon:['📘','📕','📗','📙','🎓','🧠'][i%6],color:['#6258e8','#e45d72','#38a675','#e59b3f','#3c82e6','#8b5cf6'][i%6],chapters:[]}})}
function deckMeta(name){ensureDeckMeta();return state.deckMeta[name]||{icon:'📘',color:'#6258e8',chapters:[]}}
function naturalChapterSort(a,b){const ax=String(a).match(/^(\d+)/),bx=String(b).match(/^(\d+)/);if(ax&&bx)return Number(ax[1])-Number(bx[1])||String(a).localeCompare(String(b),'ko');return String(a).localeCompare(String(b),'ko')}
function deckChapters(name){const fromCards=state.cards.filter(c=>c.category===name&&c.chapter).map(c=>c.chapter);const meta=deckMeta(name);const ordered=Array.isArray(meta.chapters)?meta.chapters:[];const missing=[...new Set(fromCards)].filter(x=>!ordered.includes(x)).sort(naturalChapterSort);return [...ordered,...missing]}
function scopeValue(deck,chapter){return chapter?`__scope:${encodeURIComponent(deck)}:${encodeURIComponent(chapter)}`:deck}
function parseScope(v){if(String(v).startsWith('__scope:')){const rest=String(v).slice(8);const idx=rest.indexOf(':');return{deck:decodeURIComponent(rest.slice(0,idx)),chapter:decodeURIComponent(rest.slice(idx+1))}}return{deck:v,chapter:null}}
function recentQuiz(c){return Array.isArray(c.quizRecentResults)?c.quizRecentResults.slice(-5):[]}
function isGraduated(c){const r=recentQuiz(c);return r.length>=5&&r.filter(Boolean).length>=4}
function isWeak(c){if(isGraduated(c))return false;const wrong=Number(c.quizWrong)||0,total=Number(c.quizAttempts)||0;return wrong>=Number(settings.weakMinWrong||2)||(total>=3&&wrong/total>=Number(settings.weakRate||0.4))}
function weakCards(){return state.cards.filter(isWeak)}
function graduatedCards(){return state.cards.filter(isGraduated)}
function inDeck(c,deck){if(deck==='__all')return true;if(deck==='__weak')return isWeak(c);const sc=parseScope(deck);return c.category===sc.deck&&(!sc.chapter||c.chapter===sc.chapter)}
function dueCards(deck='__all'){return state.cards.filter(c=>inDeck(c,deck)&&(deck==='__weak'||!c.due||c.due<=todayISO()))}
function fillDeckSelect(id,allLabel='전체 단어장'){const el=$(id);if(!el)return;const prev=el.value;const allCount=state.cards.length;let html=`<option value="__all">${allLabel} (${allCount})</option><option value="__weak">취약단어장 (${weakCards().length})</option>`;decks().forEach(d=>{const deckCount=state.cards.filter(c=>c.category===d).length;html+=`<option value="${esc(d)}">${esc(deckMeta(d).icon)} ${esc(d)} 전체 (${deckCount})</option>`;deckChapters(d).forEach(ch=>{const chapterCount=state.cards.filter(c=>c.category===d&&c.chapter===ch).length;html+=`<option value="${esc(scopeValue(d,ch))}">　↳ ${esc(ch)} (${chapterCount})</option>`})});el.innerHTML=html;if([...el.options].some(o=>o.value===prev))el.value=prev}

function fieldValue(c,key){return String(c?.[key]??'').trim()}
function sideFields(side){return side==='front'?settings.frontFields:settings.backFields}
function renderCardSide(c,side){const fields=sideFields(side);const parts=[];fields.forEach(k=>{const v=fieldValue(c,k);if(!v)return;const d=FIELD_DEFS[k];if(k==='englishWord'||k==='koreanMeaning')parts.push(`<div class="face-primary ${d.lang}">${esc(v)}</div>`);else if(k==='ipa')parts.push(`<div class="face-ipa">${esc(v)}</div>`);else if(k==='englishExample'||k==='koreanExample')parts.push(`<div class="face-example ${d.lang}">${esc(v)}</div>`);else parts.push(`<span class="face-meta">${esc(d.label)} · ${esc(v)}</span>`)});return parts.join('')||'<div class="muted">표시할 정보가 없습니다. 설정에서 필드를 선택하세요.</div>'}
function sidePlain(c,side){return sideFields(side).map(k=>fieldValue(c,k)).filter(Boolean).join(' · ')}
function sidePrimary(c,side){const fs=sideFields(side);const preferred=['englishWord','koreanMeaning'];for(const k of preferred)if(fs.includes(k)&&fieldValue(c,k))return fieldValue(c,k);for(const k of fs)if(fieldValue(c,k))return fieldValue(c,k);return ''}

function renderAll(){updateStudyActualDate();ensureDeckMeta();fillDeckSelect('deckFilter');fillDeckSelect('studyDeckFilter');fillDeckSelect('quizDeck');renderChapterFilter();renderCards();renderDeckLibrary();renderWeakList();renderStats();renderFieldOptions();refreshStudy(false)}

function cardMatchesSearch(c,q){return [c.englishWord,c.partOfSpeech,c.ipa,c.englishExample,c.koreanMeaning,c.koreanExample,c.category,c.chapter,c.tags].join(' ').toLowerCase().includes(q)}
function currentFilteredCards(){const q=$('searchCards').value.trim().toLowerCase();const d=$('deckFilter').value||'__all';const ch=$('chapterFilter')?.value||'__all';return state.cards.filter(c=>inDeck(c,d)&&(ch==='__all'||c.chapter===ch)&&(!q||cardMatchesSearch(c,q)))}
function renderCards(){const rows=currentFilteredCards();$('cardsTable').innerHTML=rows.map(c=>{const rr=recentQuiz(c),recent=rr.length?`최근 ${rr.length}회 ${rr.filter(Boolean).length}정답`:'최근 기록 없음';const badge=isWeak(c)?'<br><span class="weak-badge">취약</span>':isGraduated(c)?'<br><span class="graduate-badge">졸업</span>':'';return `<tr><td><strong class="speakable" onclick="speakText('${c.id}','englishWord',event)">${esc(c.englishWord)} 🔊</strong>${c.partOfSpeech?` <span class="pos-badge">${esc(c.partOfSpeech)}</span>`:''}<br><small>${esc(c.ipa||'')} ${esc(c.englishExample||'')}</small></td><td>${esc(c.koreanMeaning)}<br><small>${esc(c.koreanExample||'')}</small></td><td>${esc(c.category)}${c.chapter?`<span class="chapter-tag">${esc(c.chapter)}</span>`:''}${badge}</td><td>${esc(c.due)}<br><small>${c.reps||0}회 학습 · 퀴즈 오답 ${c.quizWrong||0}/${c.quizAttempts||0} · ${recent}</small></td><td><button onclick="editCard('${c.id}')">수정</button> <button class="danger" onclick="deleteCard('${c.id}')">삭제</button></td></tr>`}).join('')||'<tr><td colspan="5" class="muted">카드가 없습니다.</td></tr>';
 $('cardsMobileList').innerHTML=rows.map(c=>`<div class="mobile-card-row"><div class="front speakable" onclick="speakText('${c.id}','englishWord',event)">${esc(c.englishWord)} 🔊 ${c.partOfSpeech?`<span class="pos-badge">${esc(c.partOfSpeech)}</span>`:''} <small>${esc(c.ipa||'')}</small></div><div class="back">${esc(c.koreanMeaning)}</div><div class="meta">${esc(c.category)}${c.chapter?` › ${esc(c.chapter)}`:''} · 복습 ${esc(c.due)} · 오답 ${c.quizWrong||0}/${c.quizAttempts||0}${isWeak(c)?' · 취약':isGraduated(c)?' · 졸업':''}</div><div class="actions"><button class="secondary" onclick="editCard('${c.id}')">수정</button><button class="danger" onclick="deleteCard('${c.id}')">삭제</button>${c.englishExample?`<button class="secondary" onclick="speakText('${c.id}','englishExample',event)">예문 ▶</button>`:''}</div></div>`).join('')||'<div class="empty-state"><p>카드가 없습니다.</p></div>'}
window.editCard=id=>{const c=state.cards.find(x=>x.id===id);if(!c)return;$('editId').value=c.id;$('englishWordInput').value=c.englishWord;$('partOfSpeechInput').value=c.partOfSpeech||'';$('ipaInput').value=c.ipa;$('englishExampleInput').value=c.englishExample;$('koreanMeaningInput').value=c.koreanMeaning;$('koreanExampleInput').value=c.koreanExample;$('deckInput').value=c.category;$('chapterInput').value=c.chapter;$('tagsInput').value=c.tags;$('cancelEdit').classList.remove('hidden');navigate('cards');window.scrollTo({top:0,behavior:'smooth'})};
window.deleteCard=id=>{if(confirm('이 카드를 삭제할까요?')){const c=state.cards.find(x=>x.id===id);if(c){state.googleDeletedKeys=Array.isArray(state.googleDeletedKeys)?state.googleDeletedKeys:[];const k=c._googleKey||(window.wordStackGoogleCardKey?window.wordStackGoogleCardKey(c):'');if(k&&!state.googleDeletedKeys.includes(k))state.googleDeletedKeys.push(k)}state.cards=state.cards.filter(c=>c.id!==id);save();window.renderGoogleSyncStatus?.();window.queueAutoGoogleSync?.()}};
function resetForm(){$('cardForm').reset();$('editId').value='';$('deckInput').value='기본 단어장';$('cancelEdit').classList.add('hidden')}
$('cardForm').addEventListener('submit',e=>{e.preventDefault();const id=$('editId').value;const item={englishWord:$('englishWordInput').value.trim(),partOfSpeech:$('partOfSpeechInput').value.trim(),ipa:$('ipaInput').value.trim(),englishExample:$('englishExampleInput').value.trim(),koreanMeaning:$('koreanMeaningInput').value.trim(),koreanExample:$('koreanExampleInput').value.trim(),category:$('deckInput').value.trim()||'기본 단어장',chapter:$('chapterInput').value.trim(),tags:$('tagsInput').value.trim()};if(!item.englishWord||!item.koreanMeaning)return toast('영어단어와 한글의미는 필수입니다.');item.front=item.englishWord;item.back=item.koreanMeaning;item.example=item.englishExample;if(id){const c=state.cards.find(c=>c.id===id);const oldKey=c?._googleKey||(window.wordStackGoogleCardKey?window.wordStackGoogleCardKey(c):'');Object.assign(c,item);window.markGoogleDirty?.(c,oldKey)}else{const c={...item,id:uid(),ease:2.5,interval:0,reps:0,lapses:0,reviews:0,due:addDays(Number(settings.newCardInterval)||0),createdAt:new Date().toISOString()};state.cards.push(c);window.markGoogleDirty?.(c)}resetForm();save();window.renderGoogleSyncStatus?.();toast('카드를 저장했습니다.')});
$('cancelEdit').onclick=resetForm;
function renderChapterFilter(){const el=$('chapterFilter');if(!el)return;const d=$('deckFilter')?.value||'__all';const sc=parseScope(d),deck=sc.deck;let chs=deck&&deck!=='__all'&&deck!=='__weak'?deckChapters(deck):[...new Set(state.cards.map(c=>c.chapter).filter(Boolean))].sort(naturalChapterSort);el.innerHTML='<option value="__all">전체 챕터</option>'+chs.map(ch=>`<option value="${esc(ch)}">${esc(ch)}</option>`).join('')}
$('searchCards').oninput=renderCards;$('deckFilter').onchange=()=>{renderChapterFilter();renderCards()};$('chapterFilter').onchange=renderCards;

function normalizeHeader(h){const s=String(h||'').trim().toLowerCase();const map={englishword:'englishWord','english word':'englishWord','영어단어':'englishWord',front:'englishWord','앞면':'englishWord',partofspeech:'partOfSpeech','part of speech':'partOfSpeech',pos:'partOfSpeech','품사':'partOfSpeech',ipa:'ipa','발음기호':'ipa','pronunciation':'ipa',englishexample:'englishExample','english example':'englishExample','영어예문':'englishExample',example:'englishExample','예문':'englishExample',koreanmeaning:'koreanMeaning','korean meaning':'koreanMeaning','한글의미':'koreanMeaning',back:'koreanMeaning','뒷면':'koreanMeaning',koreanexample:'koreanExample','korean example':'koreanExample','한글예문':'koreanExample',category:'category','분류':'category',deck:'category','단어장':'category',chapter:'chapter','챕터':'chapter','강':'chapter',tags:'tags','태그':'tags'};return map[s]||s}
$('importExcel').onclick=()=>{const f=$('excelInput').files[0];if(!f)return toast('엑셀 파일을 선택해주세요.');if(typeof XLSX==='undefined')return toast('엑셀 모듈을 불러오지 못했습니다. 인터넷 연결 후 다시 시도해주세요.');const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],raw=XLSX.utils.sheet_to_json(ws,{defval:''});let added=0;raw.forEach(row=>{const n={};Object.keys(row).forEach(k=>n[normalizeHeader(k)]=row[k]);if(String(n.englishWord||'').trim()&&String(n.koreanMeaning||'').trim()){const c=migrateCard({id:uid(),englishWord:String(n.englishWord).trim(),partOfSpeech:String(n.partOfSpeech||'').trim(),ipa:String(n.ipa||'').trim(),englishExample:String(n.englishExample||'').trim(),koreanMeaning:String(n.koreanMeaning).trim(),koreanExample:String(n.koreanExample||'').trim(),category:String(n.category||'기본 단어장').trim()||'기본 단어장',chapter:String(n.chapter||'').trim(),tags:String(n.tags||'').trim(),ease:2.5,interval:0,reps:0,lapses:0,reviews:0,due:addDays(Number(settings.newCardInterval)||0),createdAt:new Date().toISOString()});c._googleDirty=true;c._googleDirtyAt=new Date().toISOString();state.cards.push(c);added++}});save();window.renderGoogleSyncStatus?.();window.queueAutoGoogleSync?.();toast(`${added}개의 카드를 가져왔습니다.`)}catch(err){console.error(err);toast('파일을 읽지 못했습니다. 양식을 확인해주세요.')}};r.readAsArrayBuffer(f)};
function exportCardsExcel(cards,filename){if(typeof XLSX==='undefined')return toast('엑셀 모듈을 불러오지 못했습니다.');const rows=cards.map(c=>({EnglishWord:c.englishWord,PartOfSpeech:c.partOfSpeech||'',IPA:c.ipa||'',EnglishExample:c.englishExample||'',KoreanMeaning:c.koreanMeaning,KoreanExample:c.koreanExample||'',Category:c.category||'',Chapter:c.chapter||'',Tags:c.tags||'',Due:c.due||'',IntervalDays:c.interval||0,Ease:c.ease||2.5,Reviews:c.reviews||0,QuizAttempts:c.quizAttempts||0,QuizCorrect:c.quizCorrect||0,QuizWrong:c.quizWrong||0}));const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Flashcards');const deckRows=decks().map(d=>({Category:d,Icon:deckMeta(d).icon,Color:deckMeta(d).color,Chapters:deckChapters(d).join(', ')}));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(deckRows),'Decks');XLSX.writeFile(wb,filename)}
$('exportExcel').onclick=()=>exportCardsExcel(currentFilteredCards(),'flashcards_filtered_export.xlsx');
$('exportDbExcel').onclick=()=>exportCardsExcel(state.cards,'wordstack_word_db.xlsx');
$('exportDbExcelSettings').onclick=()=>exportCardsExcel(state.cards,'wordstack_word_db.xlsx');

function refreshStudy(force=true){const deck=$('studyDeckFilter')?.value||'__all',due=dueCards(deck);$('dueSummary').textContent=`오늘 복습 ${due.length}장 · 전체 ${state.cards.filter(c=>inDeck(c,deck)).length}장`;$('heroDue').textContent=due.length;$('studyEmpty').classList.toggle('hidden',due.length>0);$('studyArea').classList.toggle('hidden',due.length===0);if(force||!studyQueue.length)studyQueue=shuffle(due);studyIndex=Math.min(studyIndex,Math.max(0,studyQueue.length-1));studyFlipped=false;showStudyCard()}
function showStudyCard(){const c=studyQueue[studyIndex];if(!c)return;$('cardSideLabel').textContent=studyFlipped?'뒷면':'앞면';
  const posEl=$('studyPosition'); if(posEl) posEl.textContent=studyQueue.length?`${studyIndex+1} / ${studyQueue.length}`:'0 / 0';
  const memToggle=$('memoryStatusToggle'),memText=$('memoryStatusText');
  if(memToggle){memToggle.checked=c.memoryUnknown!==false;}
  if(memText){memText.textContent=(c.memoryUnknown!==false)?'모름':'암기완료';}$('cardMain').innerHTML=renderCardSide(c,studyFlipped?'back':'front');$('cardSub').textContent='';$('ratingBtns').classList.toggle('hidden',!studyFlipped);$('speakWordBtn').disabled=!c.englishWord;$('speakExampleBtn').disabled=!c.englishExample}
function speakEnglish(text){if(!settings.ttsEnabled||!text||!/[A-Za-z]/.test(text)||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=settings.ttsLocale||'en-US';const voices=window.speechSynthesis.getVoices(),exact=voices.find(v=>v.lang===u.lang)||voices.find(v=>v.lang&&v.lang.startsWith('en'));if(exact)u.voice=exact;u.rate=Number(settings.ttsRate)||1;window.speechSynthesis.speak(u)}
window.speakText=(id,side,e)=>{if(e)e.stopPropagation();const c=state.cards.find(x=>x.id===id);if(c)speakEnglish(c[side])};
$('speakWordBtn').onclick=e=>{e.stopPropagation();const c=studyQueue[studyIndex];if(c)speakEnglish(c.englishWord)};
$('speakExampleBtn').onclick=e=>{e.stopPropagation();const c=studyQueue[studyIndex];if(c)speakEnglish(c.englishExample)};

let studySwipe={active:false,startX:0,startY:0,lastX:0,lastY:0,moved:false,suppressClick:false};
const swipeCard=$('flashcard');
const SWIPE_TRIGGER=72;
const SWIPE_VERTICAL_LIMIT=90;

function animateStudyCard(direction){
  if(!swipeCard)return;
  swipeCard.classList.remove('swipe-in-left','swipe-in-right','fly-left','fly-right');
  void swipeCard.offsetWidth;
  swipeCard.classList.add(direction==='next'?'swipe-in-right':'swipe-in-left');
  window.setTimeout(()=>swipeCard.classList.remove('swipe-in-left','swipe-in-right'),320);
}
function navigateStudyCard(direction){
  if(!studyQueue.length)return;
  const nextIndex=direction==='next'?studyIndex+1:studyIndex-1;
  if(nextIndex<0){toast('첫 번째 카드입니다.');return}
  if(nextIndex>=studyQueue.length){toast('마지막 카드입니다.');return}
  studyIndex=nextIndex;
  studyFlipped=false;
  showStudyCard();
  animateStudyCard(direction);
}
function resetSwipeVisual(){
  if(!swipeCard)return;
  swipeCard.style.transform='';
  swipeCard.style.opacity='';
  swipeCard.classList.remove('swiping');
}
function beginStudySwipe(clientX,clientY){
  studySwipe.active=true;studySwipe.startX=clientX;studySwipe.startY=clientY;
  studySwipe.lastX=clientX;studySwipe.lastY=clientY;studySwipe.moved=false;
  swipeCard?.classList.add('swiping');
}
function moveStudySwipe(clientX,clientY){
  if(!studySwipe.active||!swipeCard)return;
  studySwipe.lastX=clientX;studySwipe.lastY=clientY;
  const dx=clientX-studySwipe.startX,dy=clientY-studySwipe.startY;
  if(Math.abs(dx)>8||Math.abs(dy)>8)studySwipe.moved=true;
  if(Math.abs(dx)>Math.abs(dy)){
    const limited=Math.max(-125,Math.min(125,dx));
    swipeCard.style.transform=`translateX(${limited}px) rotate(${limited/38}deg)`;
    swipeCard.style.opacity=String(Math.max(.72,1-Math.abs(limited)/500));
  }
}
function endStudySwipe(clientX,clientY){
  if(!studySwipe.active)return;
  const dx=clientX-studySwipe.startX,dy=clientY-studySwipe.startY;
  studySwipe.active=false;
  resetSwipeVisual();
  if(Math.abs(dx)>=SWIPE_TRIGGER&&Math.abs(dx)>Math.abs(dy)*1.2&&Math.abs(dy)<SWIPE_VERTICAL_LIMIT){
    studySwipe.suppressClick=true;
    window.setTimeout(()=>studySwipe.suppressClick=false,380);
    const dir=dx<0?'next':'prev';
    swipeCard.classList.add(dx<0?'fly-left':'fly-right');
    window.setTimeout(()=>{swipeCard.classList.remove('fly-left','fly-right');navigateStudyCard(dir)},180);
  }
}
if(swipeCard){
  swipeCard.addEventListener('touchstart',e=>{
    if(e.touches.length!==1)return;
    beginStudySwipe(e.touches[0].clientX,e.touches[0].clientY);
  },{passive:true});
  swipeCard.addEventListener('touchmove',e=>{
    if(e.touches.length!==1)return;
    moveStudySwipe(e.touches[0].clientX,e.touches[0].clientY);
  },{passive:true});
  swipeCard.addEventListener('touchend',e=>{
    const t=e.changedTouches?.[0];
    if(t)endStudySwipe(t.clientX,t.clientY);
  },{passive:true});
  swipeCard.addEventListener('touchcancel',()=>{studySwipe.active=false;resetSwipeVisual()},{passive:true});

  swipeCard.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch')return;
    beginStudySwipe(e.clientX,e.clientY);
    try{swipeCard.setPointerCapture(e.pointerId)}catch(_){}
  });
  swipeCard.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    moveStudySwipe(e.clientX,e.clientY);
  });
  swipeCard.addEventListener('pointerup',e=>{
    if(e.pointerType==='touch')return;
    endStudySwipe(e.clientX,e.clientY);
  });
  swipeCard.addEventListener('pointercancel',()=>{studySwipe.active=false;resetSwipeVisual()});

  swipeCard.onclick=()=>{
    if(studySwipe.suppressClick)return;
    studyFlipped=!studyFlipped;showStudyCard()
  };
  swipeCard.onkeydown=e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();swipeCard.click()}
    if(e.key==='ArrowLeft'){e.preventDefault();navigateStudyCard('prev')}
    if(e.key==='ArrowRight'){e.preventDefault();navigateStudyCard('next')}
  };
}
function schedule(c,rate){let interval=Math.max(0,Number(c.interval)||0),ease=Math.max(1.3,Number(c.ease)||2.5),reps=Number(c.reps)||0;if(rate==='again'){interval=0;c.lapses=(c.lapses||0)+1;ease=Math.max(1.3,ease-.20)}else if(rate==='hard'){interval=reps===0?1:Math.max(1,interval*1.2);ease=Math.max(1.3,ease-.15);reps++}else if(rate==='good'){interval=reps===0?1:reps===1?3:Math.max(2,interval*ease);reps++}else{interval=reps===0?3:reps===1?6:Math.max(4,interval*ease*1.3);ease+=.15;reps++}c.ease=Number(ease.toFixed(2));c.interval=Math.round(interval);c.reps=reps;c.reviews=(c.reviews||0)+1;c.lastReviewed=todayISO();c.due=rate==='again'?todayISO():addDays(c.interval);state.totalReviews=(state.totalReviews||0)+1;state.reviewHistory.push({date:new Date().toISOString(),cardId:c.id,rate})}

const memoryStatusToggle=$('memoryStatusToggle');
if(memoryStatusToggle){
  memoryStatusToggle.addEventListener('change',e=>{
    e.stopPropagation();
    const c=studyQueue[studyIndex];
    if(!c)return;
    c.memoryUnknown=memoryStatusToggle.checked;
    const txt=$('memoryStatusText');
    if(txt)txt.textContent=c.memoryUnknown?'모름':'암기완료';
    persist();
    toast(c.memoryUnknown?'이 카드를 ‘모름’으로 표시했습니다.':'이 카드를 ‘암기완료’로 표시했습니다.');
  });
  memoryStatusToggle.addEventListener('click',e=>e.stopPropagation());
}

$('ratingBtns').onclick=e=>{const b=e.target.closest('button[data-rate]');if(!b)return;const c=studyQueue[studyIndex];schedule(c,b.dataset.rate);if(b.dataset.rate==='again')studyQueue.push(c);studyIndex++;if(studyIndex>=studyQueue.length){persist();toast('오늘의 학습을 마쳤습니다.');studyQueue=[];studyIndex=0;refreshStudy(true)}else{persist();studyFlipped=false;showStudyCard();renderStats()}};
$('shuffleStudy').onclick=()=>{studyQueue=shuffle(studyQueue.slice(studyIndex));studyIndex=0;showStudyCard()};$('reverseStudy').onclick=()=>{const f=settings.frontFields;settings.frontFields=[...settings.backFields];settings.backFields=[...f];settings.cardDirectionPreset='custom';saveSettings();renderFieldOptions();studyFlipped=false;showStudyCard();toast('앞면과 뒷면 구성을 서로 바꿨습니다.')};$('studyDeckFilter').onchange=()=>{studyQueue=[];studyIndex=0;refreshStudy(true)};

function quizCards(){return state.cards.filter(c=>inDeck(c,$('quizDeck').value))}
function buildQuiz(){const cards=quizCards();if(cards.length<2){$('quizWarning').textContent='퀴즈를 만들려면 최소 2개의 카드가 필요합니다.';return false}const mix=$('quizMix').value;let types=mix==='mcq'?Array(20).fill('mcq'):mix==='written'?Array(20).fill('written'):shuffle([...Array(10).fill('mcq'),...Array(10).fill('written')]);const src=shuffle(cards);quiz=types.map((type,i)=>{const c=src[i%src.length],rev=$('includeReverse').checked&&Math.random()<.5;const qSide=rev?'back':'front',aSide=rev?'front':'back',question=sidePrimary(c,qSide),answer=sidePrimary(c,aSide);let options=[];if(type==='mcq'){const pool=shuffle(cards.filter(x=>x.id!==c.id).map(x=>sidePrimary(x,aSide)).filter(x=>x&&x!==answer));options=shuffle([answer,...[...new Set(pool)].slice(0,3)]);while(options.length<4)options.push(`(선택지 ${options.length+1})`)}return{id:uid(),cardId:c.id,type,question,answer,explanation:c.englishExample||c.koreanExample||`정답: ${answer}`,options,reverse:rev}});return true}
$('startQuiz').onclick=()=>{if(!buildQuiz())return;quizIndex=0;quizAnswers=[];$('quizSetup').classList.add('hidden');$('quizResult').classList.add('hidden');$('quizRun').classList.remove('hidden');showQuiz()};
function showQuiz(){quizChecked=false;selectedMCQ=null;const q=quiz[quizIndex];$('quizProgressText').textContent=`${quizIndex+1} / 20`;$('quizProgress').value=quizIndex+1;$('quizType').textContent=q.type==='mcq'?'4지선다형':'주관식';$('quizQuestion').textContent=`${q.question}의 정답은?`;$('answerFeedback').classList.add('hidden');$('submitAnswer').classList.remove('hidden');$('nextQuestion').classList.add('hidden');$('writtenAnswer').value='';if(q.type==='mcq'){$('mcqOptions').classList.remove('hidden');$('writtenArea').classList.add('hidden');$('mcqOptions').innerHTML=q.options.map((o,i)=>`<button class="option" data-value="${esc(o)}"><strong>${String.fromCharCode(65+i)}.</strong><span>${esc(o)}</span></button>`).join('')}else{$('mcqOptions').classList.add('hidden');$('writtenArea').classList.remove('hidden');setTimeout(()=>$('writtenAnswer').focus(),50)}}
$('mcqOptions').onclick=e=>{if(quizChecked)return;const b=e.target.closest('.option');if(!b)return;[...$('mcqOptions').children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selectedMCQ=b.dataset.value};
function norm(s){return String(s||'').toLowerCase().normalize('NFKC').replace(/[\s.,;:!?\'"()\[\]{}\-_/]/g,'')}
function writtenCorrect(given,answer){const g=norm(given),a=norm(answer);if(!g)return false;if(settings.writtenStrictness==='strict')return g===a;if(settings.writtenStrictness==='loose')return g===a||(a.includes(g)&&g.length>=Math.min(3,a.length))||g.includes(a);return g===a}
$('submitAnswer').onclick=()=>{const q=quiz[quizIndex];let user=q.type==='mcq'?selectedMCQ:$('writtenAnswer').value.trim();if(!user)return toast('답을 선택하거나 입력해주세요.');const ok=q.type==='mcq'?user===q.answer:writtenCorrect(user,q.answer);quizChecked=true;quizAnswers.push({q,user,ok});const card=state.cards.find(c=>c.id===q.cardId);if(card){const wasWeak=isWeak(card);card.quizAttempts=(card.quizAttempts||0)+1;if(!ok)card.quizWrong=(card.quizWrong||0)+1;card.quizCorrect=(card.quizCorrect||0)+(ok?1:0);card.quizRecentResults=[...(Array.isArray(card.quizRecentResults)?card.quizRecentResults:[]),!!ok].slice(-5);card.lastQuizAt=new Date().toISOString();if(wasWeak&&isGraduated(card)){card.weakGraduations=(card.weakGraduations||0)+1;card.lastGraduatedAt=new Date().toISOString();toast(`🎓 ${card.englishWord} 취약단어 졸업!`)}}if(q.type==='mcq')[...$('mcqOptions').children].forEach(b=>{if(b.dataset.value===q.answer)b.classList.add('correct');else if(b.dataset.value===user)b.classList.add('wrong')});$('answerFeedback').innerHTML=`<strong>${ok?'정답입니다.':'오답입니다.'}</strong><br>정답: ${esc(q.answer)}<br>${esc(q.explanation)}`;$('answerFeedback').classList.remove('hidden');$('submitAnswer').classList.add('hidden');$('nextQuestion').classList.remove('hidden')};
$('nextQuestion').onclick=()=>{quizIndex++;if(quizIndex>=20)finishQuiz();else showQuiz()};
function finishQuiz(){const correct=quizAnswers.filter(a=>a.ok).length,pct=Math.round(correct/20*100);state.quizHistory.push({date:new Date().toISOString(),score:correct,total:20,percent:pct,results:quizAnswers.map(a=>({cardId:a.q.cardId,ok:a.ok})),wrongCardIds:[...new Set(quizAnswers.filter(a=>!a.ok).map(a=>a.q.cardId))]});persist();$('quizRun').classList.add('hidden');$('quizResult').classList.remove('hidden');$('scoreText').textContent=`${correct} / 20`;$('scorePercent').textContent=`${pct}점`;$('wrongReview').innerHTML='<h3>정답 및 오답해설</h3>'+quizAnswers.map((a,i)=>`<div class="wrong-item ${a.ok?'correct-item':''}"><strong>${i+1}. ${esc(a.q.question)}</strong><br>내 답: ${esc(a.user)}<br>정답: ${esc(a.q.answer)}<br><span class="muted">해설: ${esc(a.q.explanation)}</span></div>`).join('');renderStats()}
$('restartQuiz').onclick=()=>{$('quizResult').classList.add('hidden');$('quizSetup').classList.remove('hidden')};

function chapterMetrics(deck,ch){const cs=state.cards.filter(c=>c.category===deck&&c.chapter===ch),learned=cs.filter(c=>(c.reps||0)>0).length,learnRate=cs.length?Math.round(learned/cs.length*100):0;const attempts=cs.reduce((s,c)=>s+(Number(c.quizAttempts)||0),0),correct=cs.reduce((s,c)=>s+(Number(c.quizCorrect)||0),0),quizAvg=attempts?Math.round(correct/attempts*100):0,weak=cs.filter(isWeak).length;return{cards:cs.length,learnRate,quizAvg,weak}}
function renderDeckLibrary(){const el=$('deckLibrary');if(!el)return;el.innerHTML=decks().map(d=>{const cs=state.cards.filter(c=>c.category===d),due=cs.filter(c=>!c.due||c.due<=todayISO()).length,learned=cs.filter(c=>(c.reps||0)>0).length,pct=cs.length?Math.round(learned/cs.length*100):0,m=deckMeta(d),chs=deckChapters(d);return `<div class="deck-item-wrap" style="--deck-color:${esc(m.color)}"><button class="deck-item" onclick="openDeck('${encodeURIComponent(d)}')"><span class="deck-icon">${esc(m.icon)}</span><span class="deck-meta"><strong>${esc(d)}</strong><span>${cs.length}장 · 오늘 복습 ${due}장 · ${chs.length}개 챕터</span><div class="deck-hero-line"></div></span><span class="deck-progress"><strong>${pct}%</strong><span>학습률</span></span></button>${chs.length?`<div class="chapter-strip">${chs.map(ch=>{const x=chapterMetrics(d,ch);return `<button class="chapter-chip" data-deck="${esc(d)}" data-chapter="${esc(ch)}" onclick="openChapter('${encodeURIComponent(d)}','${encodeURIComponent(ch)}')"><span>${esc(ch)} <strong>${x.cards}</strong></span><small>학습 ${x.learnRate}% · 퀴즈 ${x.quizAvg}% · 취약 ${x.weak}</small></button>`}).join('')}</div>`:''}<div class="deck-actions"><button class="secondary" onclick="editDeck('${encodeURIComponent(d)}')">✎ 편집</button><button class="secondary" onclick="quickAddChapter('${encodeURIComponent(d)}')">＋ 챕터</button><button class="secondary" onclick="openChapterOrder('${encodeURIComponent(d)}')">↕ 순서</button></div></div>`}).join('')||'<div class="empty-state"><div class="empty-icon">＋</div><h3>아직 단어장이 없습니다</h3><p>새 단어장을 만들고 챕터별로 카드를 정리해보세요.</p><button class="primary" onclick="openDeckEditor()">새 단어장 만들기</button></div>';attachLongPressChapters()}
window.openDeck=encoded=>{const d=decodeURIComponent(encoded);navigate('cards');setTimeout(()=>{$('deckFilter').value=d;renderChapterFilter();renderCards()},0)};
window.openChapter=(ed,ec)=>{const d=decodeURIComponent(ed),ch=decodeURIComponent(ec);navigate('cards');setTimeout(()=>{$('deckFilter').value=d;renderChapterFilter();$('chapterFilter').value=ch;renderCards()},0)};
function attachLongPressChapters(){document.querySelectorAll('.chapter-chip').forEach(btn=>{let timer=null,moved=false;const cancel=()=>{clearTimeout(timer);timer=null};btn.addEventListener('pointerdown',e=>{moved=false;timer=setTimeout(()=>{btn.dataset.longpress='1';openChapterOrder(encodeURIComponent(btn.dataset.deck))},550)});btn.addEventListener('pointermove',()=>{moved=true;cancel()});btn.addEventListener('pointerup',e=>{cancel();if(btn.dataset.longpress==='1'){e.preventDefault();e.stopPropagation();delete btn.dataset.longpress}});btn.addEventListener('pointercancel',cancel)})}
function renderWeakList(){const ws=weakCards();$('weakCount').textContent=ws.length;$('weakList').innerHTML=ws.map(c=>{const r=recentQuiz(c),correct=r.filter(Boolean).length;return `<div class="deck-item weak-item"><span class="deck-icon">!</span><span class="deck-meta"><strong>${esc(c.englishWord)}</strong><span>${esc(c.koreanMeaning)} · 최근 ${r.length}회 ${correct}정답</span></span><span class="deck-progress"><strong>${c.quizWrong||0}</strong><span>누적 오답</span></span></div>`}).join('')||'<div class="empty-state"><div class="empty-icon">✓</div><h3>취약단어가 없습니다</h3><p>퀴즈를 풀면 자주 틀리는 카드가 자동으로 여기에 모입니다.</p><button class="primary" onclick="navigate(\'quiz\')">퀴즈 시작</button></div>'}

function yearsAvailable(){const ys=new Set([new Date().getFullYear()]);Object.keys(state.studySecondsByDate||{}).forEach(d=>ys.add(Number(d.slice(0,4))));(state.reviewHistory||[]).forEach(x=>ys.add(new Date(x.date).getFullYear()));(state.quizHistory||[]).forEach(x=>ys.add(new Date(x.date).getFullYear()));return [...ys].sort((a,b)=>b-a)}
function ensureYearSelect(){const el=$('statsYear');if(!el)return;const prev=Number(el.value)||new Date().getFullYear();const ys=yearsAvailable();el.innerHTML=ys.map(y=>`<option value="${y}">${y}년</option>`).join('');el.value=ys.includes(prev)?String(prev):String(ys[0])}
function monthArray(){return Array.from({length:12},()=>0)}
function yearStats(year){const minutes=monthArray(),days=monthArray(),reviews=monthArray(),quizSums=monthArray(),quizCounts=monthArray();const dateSets=Array.from({length:12},()=>new Set());Object.entries(state.studySecondsByDate||{}).forEach(([date,secs])=>{if(Number(date.slice(0,4))!==year)return;const m=Number(date.slice(5,7))-1;minutes[m]+=Number(secs)||0;if(Number(secs)>=60)dateSets[m].add(date)});dateSets.forEach((s,i)=>days[i]=s.size);(state.reviewHistory||[]).forEach(x=>{const d=new Date(x.date);if(d.getFullYear()===year)reviews[d.getMonth()]++});(state.quizHistory||[]).forEach(x=>{const d=new Date(x.date);if(d.getFullYear()===year){quizSums[d.getMonth()]+=Number(x.percent)||0;quizCounts[d.getMonth()]++}});const quizAvg=quizSums.map((s,i)=>quizCounts[i]?Math.round(s/quizCounts[i]):0);return{minutes:minutes.map(s=>Math.round(s/6)/10),days,reviews,quizAvg,quizCounts}}
function renderMiniBarChart(el,values,suffix='',maxOverride=null){if(!el)return;const max=Math.max(maxOverride||0,...values,1);el.innerHTML=values.map((v,i)=>`<div class="month-bar-col"><div class="bar-value">${v}${suffix}</div><div class="bar-track"><div class="bar-fill" style="height:${Math.max(2,Math.round(v/max*100))}%"></div></div><span>${i+1}월</span></div>`).join('')}
function renderStats(){ensureYearSelect();const year=Number($('statsYear')?.value)||new Date().getFullYear(),s=yearStats(year),totalMin=Math.round(s.minutes.reduce((a,b)=>a+b,0)*10)/10,totalDays=s.days.reduce((a,b)=>a+b,0),yearReviews=s.reviews.reduce((a,b)=>a+b,0),qh=(state.quizHistory||[]).filter(x=>new Date(x.date).getFullYear()===year),avg=qh.length?Math.round(qh.reduce((a,b)=>a+(Number(b.percent)||0),0)/qh.length):0;$('statMinutes').textContent=`${totalMin} min`;$('statStudyDays').textContent=`${totalDays} / 365`;$('statStudyDayRate').textContent=`${(totalDays/365*100).toFixed(1)}%`;$('statReviews').textContent=yearReviews;$('statQuizzes').textContent=qh.length;$('statAvg').textContent=`${avg}%`;$('statWeak').textContent=weakCards().length;$('yearMinutesLabel').textContent=`${totalMin} min`;$('yearDaysLabel').textContent=`${totalDays}일`;renderMiniBarChart($('minutesChart'),s.minutes,'');renderMiniBarChart($('daysChart'),s.days,'');renderMiniBarChart($('reviewsChart'),s.reviews,'');renderMiniBarChart($('quizChart'),s.quizAvg,'%',100);$('deckStats').innerHTML=decks().map(d=>{const m=deckMeta(d),chs=deckChapters(d);return `<div class="deck-stat-block" style="--deck-color:${esc(m.color)}"><div class="deck-stat"><strong><span class="deck-color-dot"></span>${esc(m.icon)} ${esc(d)}</strong><span>${state.cards.filter(c=>c.category===d).length}장 · ${chs.length}개 챕터</span></div>${chs.map(ch=>{const x=chapterMetrics(d,ch);return `<div class="chapter-stat-row"><strong>${esc(ch)}</strong><span>학습률 ${x.learnRate}%</span><span>퀴즈 평균 ${x.quizAvg}%</span><span>취약 ${x.weak}개</span></div>`}).join('')}</div>`}).join('')||'<p class="muted">단어장이 없습니다.</p>'}
$('statsYear').onchange=renderStats;

function startStudyTimer(){if(activeStudyStart||document.hidden)return;activeStudyStart=Date.now();activeStudyTimer=setInterval(commitStudyTime,30000)}
function commitStudyTime(){if(!activeStudyStart)return;const now=Date.now(),secs=(now-activeStudyStart)/1000;activeStudyStart=now;if(secs>0&&secs<300){const d=todayISO();state.studySecondsByDate[d]=(Number(state.studySecondsByDate[d])||0)+secs;persist()}}
function stopStudyTimer(){commitStudyTime();activeStudyStart=null;clearInterval(activeStudyTimer);activeStudyTimer=null}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopStudyTimer();else if($('study').classList.contains('active'))startStudyTimer()});window.addEventListener('beforeunload',stopStudyTimer);

function renderFieldOptions(){const mk=(side,selected)=>Object.entries(FIELD_DEFS).map(([k,d])=>`<label class="field-check"><input type="checkbox" data-side="${side}" value="${k}" ${selected.includes(k)?'checked':''}><span>${esc(d.label)}</span></label>`).join('');$('frontFieldOptions').innerHTML=mk('front',settings.frontFields);$('backFieldOptions').innerHTML=mk('back',settings.backFields);$('cardDirectionPreset').value=settings.cardDirectionPreset||'custom';document.querySelectorAll('[data-side]').forEach(cb=>cb.onchange=()=>{const side=cb.dataset.side;const fields=[...document.querySelectorAll(`input[data-side="${side}"]:checked`)].map(x=>x.value);if(!fields.length){cb.checked=true;return toast('앞면과 뒷면에는 최소 1개 정보가 필요합니다.')}settings[side==='front'?'frontFields':'backFields']=fields;settings.cardDirectionPreset='custom';$('cardDirectionPreset').value='custom';saveSettings();refreshStudy(false)})}
$('cardDirectionPreset').onchange=()=>{const v=$('cardDirectionPreset').value;settings.cardDirectionPreset=v;if(v==='koFront'){settings.frontFields=[...DEFAULT_FRONT];settings.backFields=[...DEFAULT_BACK]}else if(v==='enFront'){settings.frontFields=[...DEFAULT_BACK];settings.backFields=[...DEFAULT_FRONT]}saveSettings();renderFieldOptions();refreshStudy(false)};

function backup(){downloadBlob(new Blob([JSON.stringify({state,settings},null,2)],{type:'application/json'}),'wordstack_backup.json')}
$('backupJson').onclick=backup;$('restoreJson').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.state?.cards)throw Error();state=d.state;state.cards=state.cards.map(migrateCard);state.studySecondsByDate=state.studySecondsByDate||{};state.reviewHistory=state.reviewHistory||[];settings=Object.assign(settings,d.settings||{});saveSettings();save();toast('백업을 복원했습니다.')}catch{toast('올바른 백업 파일이 아닙니다.')}};r.readAsText(f)};
$('resetData').onclick=()=>{if(confirm('모든 카드와 학습 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')){state={cards:[],quizHistory:[],totalReviews:0,deckMeta:{},studySecondsByDate:{},reviewHistory:[],googleDeletedKeys:[],googleSync:{}};save();window.renderGoogleSyncStatus?.();toast('초기화했습니다.')}};
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

$('newCardInterval').value=String(settings.newCardInterval);$('writtenStrictness').value=settings.writtenStrictness;$('ttsEnabled').checked=!!settings.ttsEnabled;$('ttsLocale').value=settings.ttsLocale||'en-US';$('ttsRate').value=String(settings.ttsRate||1);$('weakMinWrong').value=String(settings.weakMinWrong||2);
$('newCardInterval').onchange=()=>{settings.newCardInterval=Number($('newCardInterval').value);saveSettings()};$('writtenStrictness').onchange=()=>{settings.writtenStrictness=$('writtenStrictness').value;saveSettings()};$('ttsEnabled').onchange=()=>{settings.ttsEnabled=$('ttsEnabled').checked;saveSettings()};$('ttsLocale').onchange=()=>{settings.ttsLocale=$('ttsLocale').value;saveSettings();speakEnglish('pronunciation')};$('ttsRate').onchange=()=>{settings.ttsRate=Number($('ttsRate').value);saveSettings();speakEnglish('This is a pronunciation speed sample.')};$('weakMinWrong').onchange=()=>{settings.weakMinWrong=Number($('weakMinWrong').value);saveSettings();renderAll()};

function openDeckEditor(name=''){ensureDeckMeta();$('deckOriginalName').value=name;$('deckNameInput').value=name||'';const m=name?deckMeta(name):{icon:'📘',color:'#6258e8',chapters:[]};$('deckIconInput').value=m.icon||'📘';$('deckColorInput').value=m.color||'#6258e8';$('deckChaptersInput').value=(name?deckChapters(name):[]).join(', ');$('deckModalTitle').textContent=name?'단어장 편집':'새 단어장';$('deleteDeckBtn').classList.toggle('hidden',!name);$('deckModal').classList.remove('hidden');setTimeout(()=>$('deckNameInput').focus(),50)}
window.openDeckEditor=openDeckEditor;window.editDeck=encoded=>openDeckEditor(decodeURIComponent(encoded));window.quickAddChapter=encoded=>{const d=decodeURIComponent(encoded);openDeckEditor(d);setTimeout(()=>$('deckChaptersInput').focus(),80)};
function closeDeckEditor(){$('deckModal').classList.add('hidden')}$('closeDeckModal').onclick=closeDeckEditor;$('deckModal').onclick=e=>{if(e.target===$('deckModal'))closeDeckEditor()};$('newDeckBtn').onclick=()=>openDeckEditor('');
$('saveDeckBtn').onclick=()=>{const old=$('deckOriginalName').value.trim(),name=$('deckNameInput').value.trim();if(!name)return toast('단어장 이름을 입력해주세요.');ensureDeckMeta();if(old&&old!==name){state.cards.forEach(c=>{if(c.category===old){const oldKey=c._googleKey||(window.wordStackGoogleCardKey?window.wordStackGoogleCardKey(c):'');c.category=name;c._googleKey=c._googleKey||oldKey;c._googleDirty=true;c._googleDirtyAt=new Date().toISOString()}});state.deckMeta[name]=state.deckMeta[old]||{};delete state.deckMeta[old]}if(!state.deckMeta[name])state.deckMeta[name]={};state.deckMeta[name].icon=$('deckIconInput').value||'📘';state.deckMeta[name].color=$('deckColorInput').value||'#6258e8';state.deckMeta[name].chapters=[...new Set($('deckChaptersInput').value.split(',').map(x=>x.trim()).filter(Boolean))];save();window.renderGoogleSyncStatus?.();window.queueAutoGoogleSync?.();closeDeckEditor();toast(old?'단어장을 수정했습니다.':'단어장을 만들었습니다.')};
$('deleteDeckBtn').onclick=()=>{const name=$('deckOriginalName').value.trim();if(!name)return;if(!confirm(`'${name}' 단어장과 포함된 모든 카드를 삭제할까요?`))return;state.googleDeletedKeys=Array.isArray(state.googleDeletedKeys)?state.googleDeletedKeys:[];state.cards.filter(c=>c.category===name).forEach(c=>{const k=c._googleKey||(window.wordStackGoogleCardKey?window.wordStackGoogleCardKey(c):'');if(k&&!state.googleDeletedKeys.includes(k))state.googleDeletedKeys.push(k)});state.cards=state.cards.filter(c=>c.category!==name);delete state.deckMeta[name];save();window.renderGoogleSyncStatus?.();window.queueAutoGoogleSync?.();closeDeckEditor();toast('단어장을 삭제했습니다.')};

let chapterOrderDeck='',chapterOrderDraft=[];
window.openChapterOrder=encoded=>{chapterOrderDeck=decodeURIComponent(encoded);chapterOrderDraft=[...deckChapters(chapterOrderDeck)];$('chapterOrderTitle').textContent=`${chapterOrderDeck} · 챕터 순서`;$('chapterOrderModal').classList.remove('hidden');renderChapterOrderList()};
function renderChapterOrderList(){$('chapterOrderList').innerHTML=chapterOrderDraft.map((ch,i)=>`<div class="chapter-order-item" data-index="${i}"><span class="drag-handle">☰</span><strong>${esc(ch)}</strong><span class="order-actions"><button class="secondary" onclick="moveChapter(${i},-1)">↑</button><button class="secondary" onclick="moveChapter(${i},1)">↓</button></span></div>`).join('');attachChapterDrag()}
window.moveChapter=(i,dir)=>{const j=i+dir;if(j<0||j>=chapterOrderDraft.length)return;[chapterOrderDraft[i],chapterOrderDraft[j]]=[chapterOrderDraft[j],chapterOrderDraft[i]];renderChapterOrderList()};
function attachChapterDrag(){document.querySelectorAll('.chapter-order-item').forEach(item=>{let hold=null,drag=false;item.addEventListener('pointerdown',e=>{hold=setTimeout(()=>{drag=true;item.classList.add('dragging');item.setPointerCapture?.(e.pointerId)},350)});item.addEventListener('pointermove',e=>{if(!drag)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.chapter-order-item');if(!target||target===item)return;const from=chapterOrderDraft.indexOf(item.querySelector('strong').textContent),to=Number(target.dataset.index);if(from<0||to<0)return;const [m]=chapterOrderDraft.splice(from,1);chapterOrderDraft.splice(to,0,m);renderChapterOrderList()});const end=()=>{clearTimeout(hold);drag=false;item.classList.remove('dragging')};item.addEventListener('pointerup',end);item.addEventListener('pointercancel',end)})}
$('sortChaptersNaturalBtn').onclick=()=>{chapterOrderDraft.sort(naturalChapterSort);renderChapterOrderList()};$('saveChapterOrderBtn').onclick=()=>{deckMeta(chapterOrderDeck).chapters=[...chapterOrderDraft];persist();$('chapterOrderModal').classList.add('hidden');renderDeckLibrary();renderStats();toast('챕터 순서를 저장했습니다.')};$('closeChapterOrderModal').onclick=()=>{$('chapterOrderModal').classList.add('hidden')};$('chapterOrderModal').onclick=e=>{if(e.target===$('chapterOrderModal'))$('chapterOrderModal').classList.add('hidden')};

const PAGE_TITLES={study:'오늘의 학습',weak:'취약단어',quiz:'퀴즈',stats:'연간 학습 통계',settings:'설정',decks:'내 단어장',cards:'카드 관리'};
function navigate(id){if($('study').classList.contains('active')&&id!=='study')stopStudyTimer();document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));$(id)?.classList.add('active');document.body.classList.toggle('study-mode',id==='study');document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));$('pageTitle').textContent=PAGE_TITLES[id]||'WordStack';if(id==='study'){refreshStudy(true);startStudyTimer()}if(id==='stats')renderStats();if(id==='decks')renderDeckLibrary();if(id==='weak')renderWeakList();window.scrollTo({top:0,behavior:'smooth'})}
window.navigate=navigate;document.querySelectorAll('[data-tab]').forEach(t=>t.onclick=()=>navigate(t.dataset.tab));document.querySelectorAll('[data-go]').forEach(t=>t.onclick=()=>navigate(t.dataset.go));$('deckMenuBtn').onclick=()=>navigate('decks');$('studyWeakBtn').onclick=()=>{$('studyDeckFilter').value='__weak';navigate('study')};
let deferredPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').classList.add('hidden')};if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
renderAll();startStudyTimer();setInterval(updateStudyActualDate,60000);


