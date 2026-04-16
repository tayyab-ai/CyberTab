// ═══════════════════════════════════════════════════
//  CyberTab v3 · newtab.js
// ═══════════════════════════════════════════════════

const DEFAULT_LINKS = [
  { name:'GitHub',         url:'https://github.com',             emoji:'🐱' },
  { name:'ChatGPT',        url:'https://chat.openai.com',        emoji:'🤖' },
  { name:'YouTube',        url:'https://youtube.com',            emoji:'▶️'  },
  { name:'Spotify',        url:'https://spotify.com',            emoji:'🎵' },
  { name:'Stack Overflow', url:'https://stackoverflow.com',      emoji:'🔶' },
  { name:'CodePen',        url:'https://codepen.io',             emoji:'✒️'  },
  { name:'Netflix',        url:'https://netflix.com',            emoji:'🎬' },
  { name:'MDN Docs',       url:'https://developer.mozilla.org',  emoji:'📖' },
];

const DEFAULT_BENTO = [
  { name:'GitHub',    url:'https://github.com',          emoji:'🐱' },
  { name:'YouTube',   url:'https://youtube.com',         emoji:'▶️'  },
  { name:'Instagram', url:'https://instagram.com',       emoji:'📸' },
  { name:'ChatGPT',   url:'https://chat.openai.com',     emoji:'🤖' },
  { name:'Discord',   url:'https://discord.com',         emoji:'💬' },
  { name:'Spotify',   url:'https://spotify.com',         emoji:'🎵' },
  { name:'Netflix',   url:'https://netflix.com',         emoji:'🎬' },
];

const DEFAULT_QUOTES = [
  { text:'Talk is cheap. Show me the code.',                                                      author:'Linus Torvalds'   },
  { text:'Any fool can write code a computer understands. Good programmers write code humans understand.', author:'Martin Fowler' },
  { text:'First, solve the problem. Then, write the code.',                                        author:'John Johnson'     },
  { text:"It's not a bug — it's an undocumented feature.",                                         author:'Anonymous'        },
  { text:'Simplicity is the soul of efficiency.',                                                  author:'Austin Freeman'   },
  { text:'Make it work, make it right, make it fast.',                                             author:'Kent Beck'        },
  { text:'The best code is no code at all.',                                                       author:'Jeff Atwood'      },
  { text:'Code never lies; comments sometimes do.',                                                author:'Ron Jeffries'     },
  { text:'Programs must be written for people to read, and only incidentally for machines to execute.', author:'Harold Abelson' },
  { text:'The only way to go fast is to go well.',                                                 author:'Robert C. Martin' },
  { text:'Coding is not just a skill — it is a superpower.',                                       author:'Anonymous'        },
  { text:'In the middle of every difficulty lies opportunity.',                                    author:'Albert Einstein'  },
];

/* ─── DOM refs ─── */
const $  = id => document.getElementById(id);
const clockEl     = $('clock');
const dateEl      = $('date-display');
const nameEl      = $('user-name');
const qwText      = $('qw-text');
const qwAuthor    = $('qw-author');
const qwRefresh   = $('qw-refresh');
const linksGrid   = $('links-grid');
const bentoGrid   = $('bento-grid');
const mode1Sec    = $('mode1-section');
const mode2Sec    = $('mode2-section');
const topNav      = $('top-nav');
const searchInput = $('search-input');
const searchBtn   = $('search-btn');
const searchEng   = $('search-engine');
const settingsBtn = $('settings-btn');
const tickerBar   = $('ticker-bar');
const appsBtn     = $('apps-btn');
const profileBtn  = $('profile-btn');
const profileInit = $('profile-initial');
const bgCanvas    = $('bg-canvas');
const bgVideo     = $('bg-video');
const bgGif       = $('bg-gif');
const bgImg       = $('bg-img');
const pageTitle   = $('page-title');

/* ════════════════════════════════════════
   CLOCK — 12hr, no seconds
════════════════════════════════════════ */
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2,'0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  clockEl.textContent = `${h}:${m} ${ap}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  dateEl.textContent = `${days[now.getDay()]}  ·  ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 5000);
updateClock();

/* ════════════════════════════════════════
   IDENTITY + TAB TITLE (bug fix: always re-apply)
════════════════════════════════════════ */
function loadIdentity() {
  try {
    chrome.storage.local.get(['userName','tabTitle'], ({ userName, tabTitle }) => {
      const name = (userName && userName.trim()) ? userName.trim() : 'Coder';
      nameEl.textContent = name;
      // Profile button initial
      profileInit.textContent = name.charAt(0).toUpperCase();

      // Always set document title from storage
      const title = (tabTitle && tabTitle.trim()) ? tabTitle.trim() : 'CyberTab';
      document.title = title;
      pageTitle.textContent = title;
    });
  } catch { /* not in extension context */ }
}
loadIdentity();
// Also set title immediately from storage on every load
document.addEventListener('DOMContentLoaded', loadIdentity);

/* ════════════════════════════════════════
   NAV LINKS
════════════════════════════════════════ */
const DEFAULT_NAV = [
  { label:'Gmail',    url:'https://mail.google.com' },
  { label:'Unsplash', url:'https://unsplash.com'    },
  { label:'Dev.to',   url:'https://dev.to'          },
  { label:'About',    url:'https://github.com'      },
];
function loadNav() {
  try {
    chrome.storage.local.get('navLinks', ({ navLinks }) => {
      const list = (navLinks && navLinks.length) ? navLinks : DEFAULT_NAV;
      topNav.innerHTML = list.map(n =>
        `<a class="nav-link" href="${n.url}" target="_blank" rel="noopener">${n.label}</a>`
      ).join('');
    });
  } catch {
    topNav.innerHTML = DEFAULT_NAV.map(n =>
      `<a class="nav-link" href="${n.url}" target="_blank" rel="noopener">${n.label}</a>`
    ).join('');
  }
}
loadNav();

/* ════════════════════════════════════════
   TICKER VISIBILITY
════════════════════════════════════════ */
function applyTicker() {
  try {
    chrome.storage.local.get('showTicker', ({ showTicker }) => {
      if (showTicker === false) {
        tickerBar.classList.add('hidden');
      } else {
        tickerBar.classList.remove('hidden');
      }
    });
  } catch {}
}
applyTicker();

/* ════════════════════════════════════════
   GOOGLE APPS + PROFILE BUTTONS
════════════════════════════════════════ */
appsBtn.addEventListener('click', () => {
  window.open('https://www.google.com/intl/en/about/products', '_blank');
});
profileBtn.addEventListener('click', () => {
  window.open('https://myaccount.google.com/', '_blank');
});

/* ════════════════════════════════════════
   QUOTES
════════════════════════════════════════ */
let quotes   = [...DEFAULT_QUOTES];
let qIdx     = Math.floor(Math.random() * quotes.length);

function renderQuote(i) {
  const q = quotes[i];
  qwText.style.opacity = qwAuthor.style.opacity = '0';
  setTimeout(() => {
    qwText.textContent   = `"${q.text}"`;
    qwAuthor.textContent = `— ${q.author}`;
    qwText.style.opacity = qwAuthor.style.opacity = '1';
  }, 380);
}

function loadQuotes() {
  try {
    chrome.storage.local.get(['customQuotes','useCustomQuotes'], ({ customQuotes, useCustomQuotes }) => {
      if (useCustomQuotes && customQuotes && customQuotes.length) quotes = customQuotes;
      else if (customQuotes && customQuotes.length) quotes = [...DEFAULT_QUOTES, ...customQuotes];
      qIdx = Math.floor(Math.random() * quotes.length);
      renderQuote(qIdx);
    });
  } catch { renderQuote(qIdx); }
}
qwRefresh.addEventListener('click', () => { qIdx = (qIdx+1) % quotes.length; renderQuote(qIdx); });
setInterval(() => { qIdx = (qIdx+1) % quotes.length; renderQuote(qIdx); }, 14000);
loadQuotes();

/* ════════════════════════════════════════
   LINK TARGET + LOAD LINKS
════════════════════════════════════════ */
let openNewTab = true;

function loadLinksAndMode() {
  try {
    chrome.storage.local.get(['links','bentoLinks','linksMode','openNewTab'], d => {
      openNewTab = (d.openNewTab !== false);
      if ((d.linksMode || '1') === '2') {
        mode1Sec.style.display = 'none';
        mode2Sec.style.display = '';
        renderBento((d.bentoLinks && d.bentoLinks.length) ? d.bentoLinks : DEFAULT_BENTO);
      } else {
        mode1Sec.style.display = '';
        mode2Sec.style.display = 'none';
        renderLinks((d.links && d.links.length) ? d.links : DEFAULT_LINKS);
      }
    });
  } catch { renderLinks(DEFAULT_LINKS); }
}

function renderLinks(links) {
  linksGrid.innerHTML = '';
  links.forEach(link => {
    const tgt = openNewTab ? '_blank' : '_self';
    const dom = getDomain(link.url);
    const a   = document.createElement('a');
    a.className = 'link-card';
    a.href = link.url; a.target = tgt; a.rel = 'noopener noreferrer';
    a.innerHTML = `
      <div class="link-favicon">
        <img src="https://www.google.com/s2/favicons?domain=${dom}&sz=32" alt=""
             onerror="this.style.display='none';this.parentElement.textContent='${esc(link.emoji||'🔗')}'" />
      </div>
      <div class="link-info">
        <div class="link-name">${esc(link.name)}</div>
        <div class="link-url">${dom}</div>
      </div>`;
    linksGrid.appendChild(a);
  });
}

function renderBento(links) {
  bentoGrid.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    if (links[i]) {
      const link = links[i];
      const tgt  = openNewTab ? '_blank' : '_self';
      const dom  = getDomain(link.url);
      const big  = (i === 1);
      const a    = document.createElement('a');
      a.className = `bento-tile${big ? ' tile-big' : ''}`;
      a.href = link.url; a.target = tgt; a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <div class="bt-favicon">
          <img src="https://www.google.com/s2/favicons?domain=${dom}&sz=64" alt=""
               onerror="this.style.display='none';this.parentElement.textContent='${esc(link.emoji||'🔗')}'" />
        </div>
        <span class="bt-name">${esc(link.name)}</span>`;
      bentoGrid.appendChild(a);
    } else {
      const div = document.createElement('div');
      div.className = 'bento-empty';
      div.innerHTML = '<span class="bento-empty-label">+ Add Link<br>in Settings</span>';
      bentoGrid.appendChild(div);
    }
  }
}

loadLinksAndMode();

/* ════════════════════════════════════════
   SEARCH
════════════════════════════════════════ */
function doSearch() {
  const q = searchInput.value.trim(); if (!q) return;
  const base = searchEng.value;
  const dest = /^(https?:\/\/|www\.)\S+/i.test(q)
    ? (q.startsWith('http') ? q : 'https://'+q)
    : base + encodeURIComponent(q);
  window.location.href = dest;
}
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key==='Enter') doSearch(); });
try {
  chrome.storage.local.get('searchEngine', ({ searchEngine: se }) => { if (se) searchEng.value = se; });
} catch {}
searchEng.addEventListener('change', () => {
  try { chrome.storage.local.set({ searchEngine: searchEng.value }); } catch {}
});

/* ════════════════════════════════════════
   SETTINGS BUTTON
════════════════════════════════════════ */
settingsBtn.addEventListener('click', () => {
  window.open(chrome.runtime.getURL('settings.html'), '_blank');
});

/* ════════════════════════════════════════
   WALLPAPER — single or multi rotating
════════════════════════════════════════ */
async function applyWallpaper() {
  try {
    const { multiWallpaper, multiWallpaperCount, wpIndex } =
      await new Promise(res => chrome.storage.local.get(['multiWallpaper','multiWallpaperCount','wpIndex'], res));

    if (multiWallpaper) {
      const count = multiWallpaperCount || 2;
      // Cycle: increment index on each new tab open
      const current = ((wpIndex || 0) % count) + 1;
      // Advance index for next visit
      chrome.storage.local.set({ wpIndex: current });
      const wp = await loadWallpaperSlot(current);
      if (wp) { applyWPMedia(wp); return; }
    }

    // Single wallpaper fallback
    const wp = await loadWallpaper();
    if (wp) applyWPMedia(wp);
  } catch (e) { console.warn('WP error:', e); }
}

function applyWPMedia({ url, type }) {
  bgCanvas.style.display = 'none';
  if (type === 'video/mp4' || type.startsWith('video/')) {
    bgVideo.src = url; bgVideo.style.display = 'block';
  } else if (type === 'image/gif') {
    bgGif.src = url; bgGif.style.display = 'block';
  } else {
    bgImg.src = url; bgImg.style.display = 'block';
  }
}

applyWallpaper();

/* ════════════════════════════════════════
   DEFAULT CANVAS ANIMATION
════════════════════════════════════════ */
(function initCanvas() {
  const cvs = bgCanvas, ctx = cvs.getContext('2d');
  function resize() { cvs.width = innerWidth; cvs.height = innerHeight; }
  resize(); addEventListener('resize', resize);

  const STARS = Array.from({length:220}, () => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    r: Math.random()*1.1+.3, a: Math.random(), da: (Math.random()-.5)*.007,
  }));
  const PARTS = Array.from({length:55}, () => ({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    r: Math.random()*2+.5, vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35,
    al: Math.random()*.45+.08,
  }));

  const ATX = innerWidth*.20, ATY = innerHeight*.46;
  const orbits = [
    {a:72,b:28,tilt:0,            spd:.013,t:0           },
    {a:72,b:28,tilt:Math.PI/3,    spd:.010,t:Math.PI*.66 },
    {a:72,b:28,tilt:-Math.PI/3,   spd:.008,t:Math.PI*1.33},
  ];

  function grid() {
    ctx.strokeStyle='rgba(0,245,255,.03)';ctx.lineWidth=1;
    for(let x=0;x<cvs.width;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cvs.height);ctx.stroke();}
    for(let y=0;y<cvs.height;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cvs.width,y);ctx.stroke();}
  }

  let f=0;
  function draw() {
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.fillStyle='#050a0f';ctx.fillRect(0,0,cvs.width,cvs.height);
    grid();
    STARS.forEach(s=>{s.a+=s.da;if(s.a>1||s.a<0)s.da*=-1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(180,240,255,${s.a})`;ctx.fill();});
    PARTS.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=cvs.width;if(p.x>cvs.width)p.x=0;if(p.y<0)p.y=cvs.height;if(p.y>cvs.height)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(0,229,204,${p.al})`;ctx.fill();});

    orbits.forEach(o=>o.t+=o.spd);
    const gN=ctx.createRadialGradient(ATX,ATY,0,ATX,ATY,80);gN.addColorStop(0,'rgba(0,245,255,.32)');gN.addColorStop(1,'transparent');ctx.beginPath();ctx.arc(ATX,ATY,80,0,Math.PI*2);ctx.fillStyle=gN;ctx.fill();
    const gC=ctx.createRadialGradient(ATX-4,ATY-4,0,ATX,ATY,18);gC.addColorStop(0,'#fff');gC.addColorStop(.3,'#00f5ff');gC.addColorStop(1,'#009eb5');
    ctx.beginPath();ctx.arc(ATX,ATY,18,0,Math.PI*2);ctx.shadowBlur=22;ctx.shadowColor='#00f5ff';ctx.fillStyle=gC;ctx.fill();ctx.shadowBlur=0;

    orbits.forEach((o,i)=>{
      ctx.save();ctx.translate(ATX,ATY);ctx.rotate(o.tilt);
      ctx.beginPath();ctx.ellipse(0,0,o.a,o.b,0,0,Math.PI*2);ctx.strokeStyle='rgba(0,245,255,.22)';ctx.lineWidth=1;ctx.stroke();
      const ex=Math.cos(o.t)*o.a,ey=Math.sin(o.t)*o.b;
      for(let k=8;k>=0;k--){const tt=o.t-k*.08;ctx.beginPath();ctx.arc(Math.cos(tt)*o.a,Math.sin(tt)*o.b,2.5-k*.24,0,Math.PI*2);ctx.fillStyle=`rgba(0,245,255,${(1-k/8)*.28})`;ctx.fill();}
      const ep=1+Math.sin(f*.1+i*2)*.15;ctx.beginPath();ctx.arc(ex,ey,5*ep,0,Math.PI*2);ctx.shadowBlur=12;ctx.shadowColor='#00f5ff';ctx.fillStyle='#00f5ff';ctx.fill();ctx.shadowBlur=0;
      ctx.restore();
    });

    const vg=ctx.createRadialGradient(cvs.width/2,cvs.height/2,cvs.height*.28,cvs.width/2,cvs.height/2,cvs.height*.85);vg.addColorStop(0,'transparent');vg.addColorStop(1,'rgba(0,0,8,.6)');ctx.fillStyle=vg;ctx.fillRect(0,0,cvs.width,cvs.height);
    f++;requestAnimationFrame(draw);
  }
  draw();
})();

/* ── helpers ── */
function getDomain(url){try{return new URL(url).hostname.replace('www.','')}catch{return url;}}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,"&#39;");}

/* ── Refresh on focus ── */
window.addEventListener('focus', () => {
  loadIdentity(); loadNav(); loadQuotes(); loadLinksAndMode(); applyTicker(); applyWallpaper();
});
