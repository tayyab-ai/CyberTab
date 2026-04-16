// ═══════════════════════════════════════════════════
//  CyberTab v3 · settings.js
// ═══════════════════════════════════════════════════

/* ── Tab navigation ── */
document.querySelectorAll('.sni').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sni').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sp' ).forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ── Helpers ── */
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showMsg(id, txt, ms=4000){ const el=document.getElementById(id); el.textContent=txt; setTimeout(()=>{el.textContent='';},ms); }

const ALLOWED_TYPES = ['video/mp4','image/gif','image/jpeg','image/png','image/webp'];
const ALLOWED_EXT   = ['.mp4','.gif','.jpg','.jpeg','.png','.webp'];
function isAllowed(file){ return ALLOWED_TYPES.includes(file.type)||ALLOWED_EXT.some(x=>file.name.toLowerCase().endsWith(x)); }

/* ════════════════════════════════════════
   WALLPAPER PANEL
════════════════════════════════════════ */
const multiToggle     = document.getElementById('multi-wp-toggle');
const multiCountWrap  = document.getElementById('multi-count-wrap');
const singleWpWrap    = document.getElementById('single-wp-wrap');
const multiWpWrap     = document.getElementById('multi-wp-wrap');
const multiSlots      = document.getElementById('multi-slots');
const multiMsg        = document.getElementById('multi-msg');
const countBtns       = document.querySelectorAll('.count-btn');

let selectedCount = 2;

// Load saved state
chrome.storage.local.get(['multiWallpaper','multiWallpaperCount'], ({ multiWallpaper, multiWallpaperCount }) => {
  if (multiWallpaper) {
    multiToggle.checked = true;
    selectedCount = multiWallpaperCount || 2;
    showMultiUI();
  }
  countBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.count) === selectedCount));
});

multiToggle.addEventListener('change', () => {
  if (multiToggle.checked) {
    showMultiUI();
    chrome.storage.local.set({ multiWallpaper: true, multiWallpaperCount: selectedCount });
  } else {
    hideMultiUI();
    chrome.storage.local.set({ multiWallpaper: false });
  }
});

countBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedCount = parseInt(btn.dataset.count);
    countBtns.forEach(b => b.classList.toggle('active', b===btn));
    chrome.storage.local.set({ multiWallpaperCount: selectedCount, wpIndex: 0 });
    buildMultiSlots(selectedCount);
  });
});

function showMultiUI() {
  multiCountWrap.style.display = '';
  singleWpWrap.style.display   = 'none';
  multiWpWrap.style.display    = '';
  buildMultiSlots(selectedCount);
}
function hideMultiUI() {
  multiCountWrap.style.display = 'none';
  singleWpWrap.style.display   = '';
  multiWpWrap.style.display    = 'none';
}

async function buildMultiSlots(count) {
  multiSlots.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const slot = document.createElement('div');
    slot.className = 'multi-slot-item';
    slot.id = `msi-${i}`;

    const wp = await loadWallpaperSlot(i);
    const hasWP = !!wp;
    const name  = hasWP ? (await dbGet(`wp_name_${i}`) || 'Uploaded') : 'No wallpaper';

    slot.innerHTML = `
      <div class="msi-header">
        <span class="msi-label">Wallpaper ${i}</span>
        ${hasWP ? `<button class="msi-clear-btn" data-slot="${i}">✕ Remove</button>` : ''}
      </div>
      <div class="msi-preview" id="msi-prev-${i}">
        ${hasWP ? '' : '<span class="wp-no-label" style="font-size:10px;">Empty slot</span>'}
      </div>
      <div class="msi-name" id="msi-name-${i}">${esc(name)}</div>
      <button class="msi-upload-btn" data-slot="${i}">📂 Upload Wallpaper ${i}</button>
      <input type="file" class="hidden" data-slot="${i}" accept="video/mp4,.mp4,image/gif,.gif,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp" />`;

    multiSlots.appendChild(slot);

    if (hasWP) {
      const blob = await dbGet(`wp_blob_${i}`);
      if (blob) renderSlotPreview(i, blob);
    }

    // Upload button → trigger hidden file input
    slot.querySelector('.msi-upload-btn').addEventListener('click', () => {
      slot.querySelector('input[type=file]').click();
    });

    // File input change
    slot.querySelector('input[type=file]').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file || !isAllowed(file)) { showMsg('multi-msg','⚠️ Unsupported file type.'); return; }
      showMsg('multi-msg',`⏳ Saving wallpaper ${i}...`);
      try {
        await saveWallpaperSlot(i, file);
        renderSlotPreview(i, file);
        document.getElementById(`msi-name-${i}`).textContent = file.name;
        showMsg('multi-msg',`✅ Wallpaper ${i} saved!`);
        // Re-render to show clear button
        setTimeout(() => buildMultiSlots(selectedCount), 1500);
      } catch(err) { showMsg('multi-msg','❌ '+err.message); }
    });

    // Clear button
    const clearBtn = slot.querySelector('.msi-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        await clearWallpaperSlot(parseInt(clearBtn.dataset.slot));
        buildMultiSlots(selectedCount);
        showMsg('multi-msg',`✅ Wallpaper ${i} removed.`);
      });
    }
  }
}

function renderSlotPreview(slot, fileOrBlob) {
  const prev = document.getElementById(`msi-prev-${slot}`);
  if (!prev) return;
  const url = URL.createObjectURL(fileOrBlob);
  prev.innerHTML = '';
  const t = fileOrBlob.type || '';
  if (t.startsWith('video/')) {
    const v = document.createElement('video'); v.src=url; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; prev.appendChild(v);
  } else {
    const img = document.createElement('img'); img.src=url; prev.appendChild(img);
  }
}

/* ── Single wallpaper ── */
const uploadZone = document.getElementById('upload-zone');
const fileInput  = document.getElementById('file-input');
const browseBtn  = document.getElementById('browse-btn');
const clearBtn   = document.getElementById('clear-wp-btn');
const defaultBtn = document.getElementById('default-wp-btn');
const wpStatus   = document.getElementById('wp-status');
const wpInfo     = document.getElementById('wp-info');
const wpFname    = document.getElementById('wp-fname');
const wpFtype    = document.getElementById('wp-ftype');
const wpPreview  = document.getElementById('wp-preview');

if (browseBtn) browseBtn.addEventListener('click', e=>{e.stopPropagation();fileInput.click();});
if (uploadZone) {
  uploadZone.addEventListener('click', ()=>fileInput.click());
  uploadZone.addEventListener('dragover', e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave', ()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])handleWP(e.dataTransfer.files[0]);});
}
if (fileInput) fileInput.addEventListener('change', ()=>{if(fileInput.files[0])handleWP(fileInput.files[0]);});

async function handleWP(file) {
  if (!isAllowed(file)) { wpStatus.style.color='#ff006e'; wpStatus.textContent='⚠️ Unsupported file. Use: MP4, GIF, JPG, PNG, WEBP'; return; }
  wpStatus.style.color=''; wpStatus.textContent='⏳ Saving...';
  try {
    await saveWallpaper(file);
    wpStatus.textContent='✅ Wallpaper saved! Refresh new tab to see it.';
    wpInfo.style.display='block'; wpFname.textContent=file.name; wpFtype.textContent=file.type;
    clearBtn.style.display=''; renderSinglePreview(file);
  } catch(e){ wpStatus.style.color='#ff006e'; wpStatus.textContent='❌ Error: '+e.message; }
}
function renderSinglePreview(fb) {
  const url=URL.createObjectURL(fb); wpPreview.innerHTML='';
  if (fb.type.startsWith('video/')) { const v=document.createElement('video'); v.src=url; v.autoplay=true; v.loop=true; v.muted=true; v.playsInline=true; wpPreview.appendChild(v); }
  else { const img=document.createElement('img'); img.src=url; wpPreview.appendChild(img); }
}
if (clearBtn) clearBtn.addEventListener('click', async()=>{
  await clearWallpaper();
  wpPreview.innerHTML='<span class="wp-no-label">Default canvas animation active</span>';
  wpInfo.style.display='none'; clearBtn.style.display='none'; wpStatus.textContent='✅ Wallpaper removed.'; fileInput.value='';
});
if (defaultBtn) defaultBtn.addEventListener('click', ()=>clearBtn&&clearBtn.click());

// Load existing single WP
(async()=>{
  if (!multiToggle.checked) {
    const wp = await loadWallpaper();
    if (wp) {
      wpInfo.style.display='block'; wpFname.textContent=await dbGet('wp_name')||'Unknown'; wpFtype.textContent=wp.type;
      clearBtn.style.display=''; const blob=await dbGet('wp_blob'); if(blob)renderSinglePreview(blob);
    }
  }
})();

/* ════════════════════════════════════════
   IDENTITY
════════════════════════════════════════ */
const nameIn  = document.getElementById('user-name-in');
const titleIn = document.getElementById('tab-title-in');

chrome.storage.local.get(['userName','tabTitle'], ({userName,tabTitle}) => {
  if (userName) nameIn.value  = userName;
  if (tabTitle) titleIn.value = tabTitle;
});

document.getElementById('save-id-btn').addEventListener('click', () => {
  const name  = nameIn.value.trim()  || 'Coder';
  const title = titleIn.value.trim() || 'CyberTab';
  chrome.storage.local.set({ userName: name, tabTitle: title }, () => {
    showMsg('id-msg', '✅ Saved! Open a new tab to see changes.');
  });
});

/* ════════════════════════════════════════
   QUOTES
════════════════════════════════════════ */
let customQuotes = [];
const customOnlyToggle = document.getElementById('custom-only-toggle');
const quotesEditorEl   = document.getElementById('quotes-editor');
const newQuoteText     = document.getElementById('new-quote-text');
const newQuoteAuthor   = document.getElementById('new-quote-author');

function renderQuotesEditor() {
  quotesEditorEl.innerHTML = '';
  if (!customQuotes.length) { quotesEditorEl.innerHTML='<p style="font-family:var(--fm);font-size:11px;color:var(--txt3);">No custom quotes yet.</p>'; return; }
  customQuotes.forEach((q,i)=>{
    const div=document.createElement('div'); div.className='quote-row';
    div.innerHTML=`<div class="qr-body"><div class="qr-text">"${esc(q.text)}"</div><div class="qr-author">— ${esc(q.author)}</div></div><button class="btn-rm" data-i="${i}">✕</button>`;
    div.querySelector('.btn-rm').addEventListener('click',()=>{customQuotes.splice(i,1);renderQuotesEditor();});
    quotesEditorEl.appendChild(div);
  });
}

chrome.storage.local.get(['customQuotes','useCustomQuotes'],({customQuotes:cq,useCustomQuotes:uc})=>{
  if (cq) customQuotes=cq; if (uc) customOnlyToggle.checked=true; renderQuotesEditor();
});

document.getElementById('add-quote-btn').addEventListener('click',()=>{
  const t=newQuoteText.value.trim(); if(!t){showMsg('quotes-msg','⚠️ Enter quote text.');return;}
  customQuotes.push({text:t,author:newQuoteAuthor.value.trim()||'Anonymous'});
  newQuoteText.value=''; newQuoteAuthor.value=''; renderQuotesEditor();
});

document.getElementById('save-quotes-btn').addEventListener('click',()=>{
  chrome.storage.local.set({customQuotes,useCustomQuotes:customOnlyToggle.checked},()=>showMsg('quotes-msg',`✅ ${customQuotes.length} quotes saved!`));
});

/* ════════════════════════════════════════
   QUICK LINKS
════════════════════════════════════════ */
const DEFAULT_LINKS = [
  {name:'GitHub',url:'https://github.com',emoji:'🐱'},{name:'ChatGPT',url:'https://chat.openai.com',emoji:'🤖'},
  {name:'YouTube',url:'https://youtube.com',emoji:'▶️'},{name:'Spotify',url:'https://spotify.com',emoji:'🎵'},
  {name:'Stack Overflow',url:'https://stackoverflow.com',emoji:'🔶'},{name:'CodePen',url:'https://codepen.io',emoji:'✒️'},
  {name:'Netflix',url:'https://netflix.com',emoji:'🎬'},{name:'MDN Docs',url:'https://developer.mozilla.org',emoji:'📖'},
];
const DEFAULT_BENTO = [
  {name:'GitHub',url:'https://github.com',emoji:'🐱'},{name:'YouTube',url:'https://youtube.com',emoji:'▶️'},
  {name:'Instagram',url:'https://instagram.com',emoji:'📸'},{name:'ChatGPT',url:'https://chat.openai.com',emoji:'🤖'},
  {name:'Discord',url:'https://discord.com',emoji:'💬'},{name:'Spotify',url:'https://spotify.com',emoji:'🎵'},
  {name:'Netflix',url:'https://netflix.com',emoji:'🎬'},
];
const BENTO_LABELS=['Tile 1 — Tall Left','Tile 2 — Wide Center (featured)','Tile 3 — Tall Right','Tile 4 — Small Center-Left','Tile 5 — Tall Center-Right','Tile 6 — Wide Bottom-Left','Tile 7 — Square Bottom-Right'];

const mode1Radio      = document.getElementById('mode-1-radio');
const mode2Radio      = document.getElementById('mode-2-radio');
const mode1EditorWrap = document.getElementById('mode1-editor-wrap');
const mode2EditorWrap = document.getElementById('mode2-editor-wrap');
const newTabToggle    = document.getElementById('new-tab-toggle');
const mode1Ed         = document.getElementById('mode1-links-editor');
const mode2Ed         = document.getElementById('mode2-links-editor');

function applyModeUI(mode){
  if(mode==='2'){mode1EditorWrap.style.display='none';mode2EditorWrap.style.display='';mode2Radio.checked=true;}
  else{mode1EditorWrap.style.display='';mode2EditorWrap.style.display='none';mode1Radio.checked=true;}
}

chrome.storage.local.get(['linksMode','openNewTab'],({linksMode,openNewTab})=>{
  applyModeUI(linksMode||'1');newTabToggle.checked=(openNewTab!==false);
});
mode1Radio.addEventListener('change',()=>applyModeUI('1'));
mode2Radio.addEventListener('change',()=>applyModeUI('2'));
newTabToggle.addEventListener('change',()=>chrome.storage.local.set({openNewTab:newTabToggle.checked}));

// Mode 1 editor
function addLink1Row(l={name:'',url:'',emoji:'🔗'}){
  const r=document.createElement('div'); r.className='lrow';
  r.innerHTML=`<input type="text" placeholder="Name" value="${esc(l.name||'')}" class="l1-name" style="flex:1.2;"/><div class="lrow-sep"></div><input type="text" placeholder="https://..." value="${esc(l.url||'')}" class="l1-url" style="flex:2.2;"/><div class="lrow-sep"></div><input type="text" placeholder="🔗" value="${esc(l.emoji||'🔗')}" class="l1-emoji" style="flex:0 0 42px;text-align:center;" maxlength="4"/><button class="btn-rm">✕</button>`;
  r.querySelector('.btn-rm').addEventListener('click',()=>r.remove());
  mode1Ed.appendChild(r);
}
function collectLinks1(){return Array.from(mode1Ed.querySelectorAll('.lrow')).map(r=>({name:r.querySelector('.l1-name').value.trim(),url:r.querySelector('.l1-url').value.trim(),emoji:r.querySelector('.l1-emoji').value.trim()||'🔗'})).filter(l=>l.name&&l.url);}

chrome.storage.local.get('links',({links})=>{(links&&links.length?links:DEFAULT_LINKS).forEach(l=>addLink1Row(l));});
document.getElementById('add-link1-btn').addEventListener('click',()=>addLink1Row());
document.getElementById('save-links1-btn').addEventListener('click',()=>{
  const links=collectLinks1();
  chrome.storage.local.set({links,linksMode:mode1Radio.checked?'1':'2'},()=>showMsg('links1-msg',`✅ ${links.length} links saved!`));
});

// Mode 2 bento editor
let bento2Rows=[];
function renderBento2(bl){
  mode2Ed.innerHTML=''; bento2Rows=[];
  for(let i=0;i<7;i++){
    const l=bl[i]||{name:'',url:'',emoji:'🔗'};
    const r=document.createElement('div'); r.className='lrow';
    r.innerHTML=`<span class="lrow-num">${i+1}</span><input type="text" placeholder="${esc(BENTO_LABELS[i])}" value="${esc(l.name||'')}" class="b2-name" style="flex:1;"/><div class="lrow-sep"></div><input type="text" placeholder="https://..." value="${esc(l.url||'')}" class="b2-url" style="flex:1.8;"/><div class="lrow-sep"></div><input type="text" placeholder="🔗" value="${esc(l.emoji||'🔗')}" class="b2-emoji" style="flex:0 0 42px;text-align:center;" maxlength="4"/>`;
    mode2Ed.appendChild(r); bento2Rows.push(r);
  }
}
function collectBento2(){return bento2Rows.map(r=>({name:r.querySelector('.b2-name').value.trim(),url:r.querySelector('.b2-url').value.trim(),emoji:r.querySelector('.b2-emoji').value.trim()||'🔗'}));}

chrome.storage.local.get('bentoLinks',({bentoLinks})=>renderBento2(bentoLinks&&bentoLinks.length?bentoLinks:DEFAULT_BENTO));
document.getElementById('save-links2-btn').addEventListener('click',()=>{
  const bl=collectBento2();
  chrome.storage.local.set({bentoLinks:bl,linksMode:mode2Radio.checked?'2':'1'},()=>showMsg('links2-msg','✅ Bento links saved!'));
});

/* ════════════════════════════════════════
   NAV LINKS
════════════════════════════════════════ */
const DEFAULT_NAV=[{label:'Gmail',url:'https://mail.google.com'},{label:'Unsplash',url:'https://unsplash.com'},{label:'Dev.to',url:'https://dev.to'},{label:'About',url:'https://github.com'}];
const navEd=document.getElementById('nav-editor');

function addNavRow(l={label:'',url:''}){
  const r=document.createElement('div'); r.className='lrow';
  r.innerHTML=`<input type="text" placeholder="Label" value="${esc(l.label||'')}" class="nv-label" style="flex:1;"/><div class="lrow-sep"></div><input type="text" placeholder="https://..." value="${esc(l.url||'')}" class="nv-url" style="flex:2.2;"/><button class="btn-rm">✕</button>`;
  r.querySelector('.btn-rm').addEventListener('click',()=>r.remove());
  navEd.appendChild(r);
}
function collectNav(){return Array.from(navEd.querySelectorAll('.lrow')).map(r=>({label:r.querySelector('.nv-label').value.trim(),url:r.querySelector('.nv-url').value.trim()})).filter(l=>l.label&&l.url);}

chrome.storage.local.get('navLinks',({navLinks})=>(navLinks&&navLinks.length?navLinks:DEFAULT_NAV).forEach(l=>addNavRow(l)));
document.getElementById('add-nav-btn').addEventListener('click',()=>addNavRow());
document.getElementById('save-nav-btn').addEventListener('click',()=>{
  const nl=collectNav();chrome.storage.local.set({navLinks:nl},()=>showMsg('nav-msg',`✅ ${nl.length} nav links saved!`));
});

/* ════════════════════════════════════════
   DISPLAY — Ticker toggle
════════════════════════════════════════ */
const tickerToggle = document.getElementById('ticker-toggle');
chrome.storage.local.get('showTicker',({showTicker})=>{ tickerToggle.checked=(showTicker!==false); });
document.getElementById('save-display-btn').addEventListener('click',()=>{
  chrome.storage.local.set({showTicker:tickerToggle.checked},()=>showMsg('display-msg','✅ Display settings saved!'));
});
