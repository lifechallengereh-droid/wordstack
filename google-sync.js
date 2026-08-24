/* WordStack Google Sheets sync v7.2.3
   Target spreadsheet: 플래시카드_단어장_양식_v6 / Flashcards
   OAuth access tokens are kept in memory only. */
const WORDSTACK_DEFAULT_GOOGLE_SHEET_URL='https://docs.google.com/spreadsheets/d/1Xlc6nummFrvCLkDiOMUtj_u4SpHwwwDlFcf95-N4g5I/edit';
const WORDSTACK_GOOGLE_SHEET_NAME='Flashcards';
const WORDSTACK_GOOGLE_SCOPE='https://www.googleapis.com/auth/spreadsheets';
const GOOGLE_HEADERS=['EnglishWord','PartOfSpeech','IPA','EnglishExample','KoreanMeaning','KoreanExample','Category','Chapter','Tags'];
function extractGoogleSheetId(url){
  const value=String(url||'').trim();
  const m=value.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  return m?m[1]:'';
}
function currentGoogleSheetUrl(){
  return String(settings.googleSheetUrl||WORDSTACK_DEFAULT_GOOGLE_SHEET_URL).trim();
}
function currentGoogleSheetId(){
  const id=extractGoogleSheetId(currentGoogleSheetUrl());
  if(!id) throw new Error('설정의 Google Sheet URL이 올바르지 않습니다. Google 스프레드시트 전체 URL을 입력해주세요.');
  return id;
}
window.extractGoogleSheetId=extractGoogleSheetId;

let googleAccessToken='';
let googleTokenExpiresAt=0;
let googleSyncInFlight=false;
let pendingAutoSyncTimer=null;

function googleCardKey(c){
  return [c.englishWord,c.category,c.chapter].map(v=>String(v||'').trim().toLocaleLowerCase()).join('\u241f');
}
function googleRowToCard(row){
  const vals=[...row]; while(vals.length<9) vals.push('');
  return {
    englishWord:String(vals[0]||'').trim(), partOfSpeech:String(vals[1]||'').trim(), ipa:String(vals[2]||'').trim(), englishExample:String(vals[3]||'').trim(),
    koreanMeaning:String(vals[4]||'').trim(), koreanExample:String(vals[5]||'').trim(), category:String(vals[6]||'기본 단어장').trim()||'기본 단어장',
    chapter:String(vals[7]||'').trim(), tags:String(vals[8]||'').trim()
  };
}
function googleCardToRow(c){return [c.englishWord||'',c.partOfSpeech||'',c.ipa||'',c.englishExample||'',c.koreanMeaning||'',c.koreanExample||'',c.category||'',c.chapter||'',c.tags||'']}
function googleContentChanged(card,rowCard){return ['englishWord','partOfSpeech','ipa','englishExample','koreanMeaning','koreanExample','category','chapter','tags'].some(k=>String(card[k]||'')!==String(rowCard[k]||''))}
function applyGoogleRow(card,rowCard){
  Object.assign(card,rowCard,{front:rowCard.englishWord,back:rowCard.koreanMeaning,example:rowCard.englishExample});
  card._googleKey=googleCardKey(card); card._googleDirty=false;
}
function markGoogleDirty(card,oldKey){
  if(!card)return;
  if(oldKey&&!card._googleKey)card._googleKey=oldKey;
  card._googleDirty=true; card._googleDirtyAt=new Date().toISOString();
  persist(); renderGoogleSyncStatus();
  queueAutoGoogleSync();
}
window.markGoogleDirty=markGoogleDirty;
window.wordStackGoogleCardKey=googleCardKey;
function pendingGoogleCount(){return state.cards.filter(c=>c._googleDirty).length+(state.googleDeletedKeys||[]).length}
function renderGoogleSyncStatus(extra=''){
  const pending=pendingGoogleCount();
  const last=state.googleSync?.lastSyncAt?new Date(state.googleSync.lastSyncAt).toLocaleString('ko-KR'):'아직 동기화하지 않음';
  const text=extra||`동기화 대기 ${pending}건 · 마지막 ${last}`;
  ['googleSyncStatus','googleSyncStatusCards'].forEach(id=>{const el=$(id);if(el)el.textContent=text});
  const input=$('googleClientId'); if(input&&document.activeElement!==input)input.value=settings.googleClientId||'';
  const sheetInput=$('googleSheetUrl'); if(sheetInput&&document.activeElement!==sheetInput)sheetInput.value=currentGoogleSheetUrl();
  const origin=$('googleOriginHint'); if(origin)origin.textContent=location.origin;
  const auto=$('googleAutoSync'); if(auto)auto.checked=settings.googleAutoSync!==false;
}
window.renderGoogleSyncStatus=renderGoogleSyncStatus;

function googleLibReady(){return !!(window.google&&google.accounts&&google.accounts.oauth2)}
function waitForGoogleLib(timeoutMs=7000){
  return new Promise((resolve,reject)=>{if(googleLibReady())return resolve();const started=Date.now();const t=setInterval(()=>{if(googleLibReady()){clearInterval(t);resolve()}else if(Date.now()-started>timeoutMs){clearInterval(t);reject(new Error('Google 인증 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.'))}},100)});
}
async function ensureGoogleToken(interactive=true){
  if(googleAccessToken&&Date.now()<googleTokenExpiresAt-60000)return googleAccessToken;
  await waitForGoogleLib();
  const clientId=String(settings.googleClientId||'').trim();
  if(!clientId){
    navigate('settings');
    throw new Error('설정의 Google OAuth Client ID를 먼저 입력해주세요.');
  }
  if(!interactive)throw new Error('Google 로그인이 필요합니다. 구글동기화 버튼을 눌러주세요.');
  return new Promise((resolve,reject)=>{
    const client=google.accounts.oauth2.initTokenClient({
      client_id:clientId, scope:WORDSTACK_GOOGLE_SCOPE, include_granted_scopes:true,
      callback:(resp)=>{
        if(resp?.error)return reject(new Error(resp.error_description||resp.error));
        googleAccessToken=resp.access_token||'';
        googleTokenExpiresAt=Date.now()+(Number(resp.expires_in||3600)*1000);
        resolve(googleAccessToken);
      },
      error_callback:(err)=>reject(new Error(err?.message||err?.type||'Google 인증 창을 완료하지 못했습니다.'))
    });
    client.requestAccessToken({prompt:''});
  });
}
async function gfetch(url,opts={}){
  const token=await ensureGoogleToken(false);
  const headers=Object.assign({},opts.headers||{}, {'Authorization':'Bearer '+token});
  const r=await fetch(url,Object.assign({},opts,{headers}));
  if(r.status===401){googleAccessToken='';googleTokenExpiresAt=0;throw new Error('Google 로그인 시간이 만료되었습니다. 구글동기화를 다시 눌러주세요.');}
  if(!r.ok){let msg='Google API 오류 '+r.status;try{const j=await r.json();msg=j?.error?.message||msg}catch{}throw new Error(msg)}
  if(r.status===204)return null;const txt=await r.text();return txt?JSON.parse(txt):null;
}
function sheetValuesUrl(range){return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(currentGoogleSheetId())}/values/${encodeURIComponent(range)}`}
async function fetchGoogleRows(){
  const j=await gfetch(sheetValuesUrl(`${WORDSTACK_GOOGLE_SHEET_NAME}!A1:I10000`));
  const values=j?.values||[];
  if(values.length&&GOOGLE_HEADERS.some((h,i)=>String(values[0]?.[i]||'').trim()!==h))throw new Error('Google 시트의 첫 행 머리글이 WordStack 양식과 다릅니다. A1:I1을 확인해주세요.');
  return values.slice(1).filter(r=>String(r?.[0]||'').trim()&&String(r?.[4]||'').trim());
}
async function ensureSheetRows(requiredRows){
  const meta=await gfetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(currentGoogleSheetId())}?fields=sheets(properties(sheetId,title,gridProperties(rowCount)))`);
  const sh=(meta?.sheets||[]).find(x=>x.properties?.title===WORDSTACK_GOOGLE_SHEET_NAME);
  if(!sh)throw new Error(`Google 시트에서 '${WORDSTACK_GOOGLE_SHEET_NAME}' 탭을 찾지 못했습니다.`);
  const current=Number(sh.properties?.gridProperties?.rowCount||1000);
  if(requiredRows>current){
    await gfetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(currentGoogleSheetId())}:batchUpdate`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:[{appendDimension:{sheetId:sh.properties.sheetId,dimension:'ROWS',length:requiredRows-current+100}}]})
    });
  }
  return Math.max(current,requiredRows);
}
async function writeGoogleRows(rows){
  const totalRows=rows.length+1;const rowCount=await ensureSheetRows(totalRows);
  await gfetch(sheetValuesUrl(`${WORDSTACK_GOOGLE_SHEET_NAME}!A2:I${rowCount}`)+':clear',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  await gfetch(sheetValuesUrl(`${WORDSTACK_GOOGLE_SHEET_NAME}!A1:I${totalRows}`)+'?valueInputOption=RAW',{
    method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({range:`${WORDSTACK_GOOGLE_SHEET_NAME}!A1:I${totalRows}`,majorDimension:'ROWS',values:[GOOGLE_HEADERS,...rows]})
  });
}
function mergeGoogleRows(sheetRows){
  state.googleDeletedKeys=Array.isArray(state.googleDeletedKeys)?state.googleDeletedKeys:[];
  const deleted=new Set(state.googleDeletedKeys);
  const used=new Set(); const output=[]; let fromGoogle=0,toGoogle=0,deletedGoogle=0;
  const bySavedKey=new Map(),byCurrentKey=new Map();
  state.cards.forEach(c=>{if(c._googleKey)bySavedKey.set(c._googleKey,c);const k=googleCardKey(c);if(!byCurrentKey.has(k))byCurrentKey.set(k,c)});
  for(const row of sheetRows){
    const rc=googleRowToCard(row),key=googleCardKey(rc);
    if(deleted.has(key)){deletedGoogle++;continue}
    const local=bySavedKey.get(key)||byCurrentKey.get(key);
    if(local){
      used.add(local.id);
      if(local._googleDirty){output.push(googleCardToRow(local));toGoogle++;local._googleKey=googleCardKey(local);local._googleDirty=false;}
      else {if(googleContentChanged(local,rc)){applyGoogleRow(local,rc);fromGoogle++}else{local._googleKey=key;local._googleDirty=false}output.push(googleCardToRow(local));}
    }else{
      const c=migrateCard({...rc,id:uid(),createdAt:new Date().toISOString(),ease:2.5,interval:0,reps:0,lapses:0,reviews:0,due:todayISO()});
      c._googleKey=key;c._googleDirty=false;state.cards.push(c);used.add(c.id);output.push(googleCardToRow(c));fromGoogle++;
    }
  }
  for(const c of state.cards){
    if(used.has(c.id))continue;
    const k=c._googleKey||googleCardKey(c);if(deleted.has(k))continue;
    output.push(googleCardToRow(c));c._googleKey=googleCardKey(c);c._googleDirty=false;toGoogle++;used.add(c.id);
  }
  state.googleDeletedKeys=[];
  return {rows:output,fromGoogle,toGoogle,deletedGoogle};
}
async function googleSync({interactive=true,silent=false}={}){
  if(googleSyncInFlight)return;
  if(!navigator.onLine){if(!silent)toast('오프라인에서는 Google 동기화를 사용할 수 없습니다.');return}
  googleSyncInFlight=true;renderGoogleSyncStatus('Google과 동기화하는 중…');
  try{
    await ensureGoogleToken(interactive);
    const remote=await fetchGoogleRows();
    const result=mergeGoogleRows(remote);
    await writeGoogleRows(result.rows);
    state.googleSync={lastSyncAt:new Date().toISOString(),spreadsheetId:currentGoogleSheetId(),sheetName:WORDSTACK_GOOGLE_SHEET_NAME};
    persist();renderAll();renderGoogleSyncStatus();
    if(!silent)toast(`Google 동기화 완료 · 시트→앱 ${result.fromGoogle} · 앱→시트 ${result.toGoogle}${result.deletedGoogle?` · 삭제 ${result.deletedGoogle}`:''}`);
  }catch(err){console.error(err);renderGoogleSyncStatus('동기화 오류 · '+err.message);if(!silent)toast(err.message||'Google 동기화에 실패했습니다.');}
  finally{googleSyncInFlight=false}
}
window.googleSync=googleSync;
function queueAutoGoogleSync(){
  if(settings.googleAutoSync===false||!googleAccessToken||Date.now()>=googleTokenExpiresAt-60000)return;
  clearTimeout(pendingAutoSyncTimer);pendingAutoSyncTimer=setTimeout(()=>googleSync({interactive:false,silent:true}),900);
}
window.queueAutoGoogleSync=queueAutoGoogleSync;

window.addEventListener('DOMContentLoaded',()=>{
  const cid=$('googleClientId');if(cid){cid.value=settings.googleClientId||'';cid.addEventListener('change',()=>{settings.googleClientId=cid.value.trim();saveSettings();renderGoogleSyncStatus();toast('Google OAuth Client ID를 저장했습니다.')})}
  const sheet=$('googleSheetUrl');if(sheet){
    sheet.value=currentGoogleSheetUrl();
    sheet.addEventListener('change',()=>{
      const next=sheet.value.trim();
      if(!extractGoogleSheetId(next)){
        sheet.value=currentGoogleSheetUrl();
        toast('올바른 Google Sheet URL이 아닙니다.');
        return;
      }
      settings.googleSheetUrl=next;saveSettings();
      state.googleSync={lastSyncAt:null,spreadsheetId:extractGoogleSheetId(next),sheetName:WORDSTACK_GOOGLE_SHEET_NAME};persist();
      renderGoogleSyncStatus('새 Google 시트가 저장되었습니다. 구글동기화를 눌러 연결하세요.');
      toast('Google Sheet URL을 저장했습니다.');
    });
  }
  const auto=$('googleAutoSync');if(auto){auto.checked=settings.googleAutoSync!==false;auto.addEventListener('change',()=>{settings.googleAutoSync=auto.checked;saveSettings();toast(auto.checked?'자동 동기화를 켰습니다.':'자동 동기화를 껐습니다.')})}
  ['googleSyncBtn','googleSyncBtnCards'].forEach(id=>{const b=$(id);if(b)b.onclick=()=>googleSync({interactive:true,silent:false})});
  const open=$('openGoogleSheetBtn');if(open)open.onclick=()=>{const url=currentGoogleSheetUrl();if(!extractGoogleSheetId(url)){toast('Google Sheet URL을 먼저 확인해주세요.');return;}window.open(url,'_blank','noopener')};
  renderGoogleSyncStatus();
});
