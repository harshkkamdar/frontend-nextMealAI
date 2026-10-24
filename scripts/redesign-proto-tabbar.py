"""Usage: python3 scripts/redesign-proto-tabbar.py docs/redesign/proto
Phase 4 prototype: Direction C home content under the glass tab bar (Home, Food, Train, Geo + orb),
with a built-in frame-timing benchmark (scroll, tab switches, + sheet open/close).
Open tab-bar.html?bench=1 to run it; ?glass=0 renders the opaque fallback for comparison."""
import importlib.util, os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
spec = importlib.util.spec_from_file_location('gen', os.path.join(os.path.dirname(__file__), 'redesign-gen-directions.py'))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

GEO_ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3c5 0 9 3.4 9 7.8 0 4.3-4 7.8-9 7.8-.9 0-1.8-.1-2.6-.3L5.1 20.6c-.6.3-1.2-.2-1-.8l.9-3.1C3.8 15.3 3 13.6 3 10.8 3 6.4 7 3 12 3z"/></svg>'

home = gen.home_c()
bento = home[home.index('<div class="bento">'):home.index('<div class="fade-bot">')]
content = bento * 3

PROTO_CSS = """
body{display:block;padding:0;background:var(--cream)}
.app{min-height:100vh;padding-top:env(safe-area-inset-top);padding-bottom:calc(120px + env(safe-area-inset-bottom))}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 20px 0}
.tabbar{position:fixed;left:16px;right:16px;bottom:calc(14px + env(safe-area-inset-bottom));transition:transform .32s cubic-bezier(.2,.9,.25,1)}
.capsule{position:relative;transition:transform .32s cubic-bezier(.2,.9,.25,1);transform-origin:left center}
.pill{position:absolute;top:5px;left:6px;width:calc((100% - 12px)/4);height:52px;border-radius:26px;background:var(--i08);transition:transform .34s cubic-bezier(.2,.9,.25,1);will-change:transform}
.tab{position:relative;z-index:1;flex:1;width:auto}
.tab.on{background:none}
.tabbar.min .capsule{transform:scale(.86) translateX(-6%)}
.scrim{position:fixed;opacity:0;pointer-events:none;transition:opacity .25s}
.sheet{position:fixed;transform:translateY(110%);transition:transform .42s cubic-bezier(.2,.9,.25,1);will-change:transform}
.open .scrim{opacity:1;pointer-events:auto}
.open .sheet{transform:none}
html[data-glass="lite"] .glass{-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);background:rgba(255,255,255,.8)}
html[data-glass="lite"] .sheet.glass{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(253,246,236,.97)}
html[data-glass="off"] .glass{background:rgba(255,255,255,.96);-webkit-backdrop-filter:none;backdrop-filter:none}
html[data-glass="off"] .sheet.glass{background:rgba(253,246,236,.98)}
"""

PROTO_JS = r"""
const q = new URLSearchParams(location.search)
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
document.documentElement.dataset.glass = q.get('glass') === '0' ? 'off' : q.get('glass') === '1' ? 'on' : q.get('glass') === 'lite' ? 'lite' : (lowEnd ? 'off' : 'on')
const bar = document.querySelector('.tabbar'), pill = document.querySelector('.pill'), tabs = [...document.querySelectorAll('.tab')]
function select(i){ pill.style.transform = `translateX(${i*100}%)`; tabs.forEach((t,k)=>t.classList.toggle('on',k===i)) }
tabs.forEach((t,i)=>t.addEventListener('click',()=>select(i)))
let lastY = 0
addEventListener('scroll',()=>{ const y = scrollY; bar.classList.toggle('min', y > lastY && y > 80); lastY = y },{passive:true})
const app = document.body
document.querySelector('.orb').addEventListener('click',()=>app.classList.toggle('open'))
document.querySelector('.scrim').addEventListener('click',()=>app.classList.remove('open'))

// Benchmark: frame intervals per phase via requestAnimationFrame.
async function frames(ms, step){ return new Promise(res=>{ const out=[]; let prev=performance.now(), t0=prev
  function f(t){ out.push(t-prev); prev=t; if(step) step(t-t0); if(t-t0<ms) requestAnimationFrame(f); else res(out.slice(1)) } requestAnimationFrame(f) }) }
function stats(a){ const s=[...a].sort((x,y)=>x-y), p=k=>s[Math.min(s.length-1,Math.floor(k*s.length))]
  return { frames:a.length, p50:+p(.5).toFixed(1), p95:+p(.95).toFixed(1), max:+s[s.length-1].toFixed(1), over16_7:a.filter(x=>x>16.7*1.5).length } }
async function bench(){
  const res = { ua:navigator.userAgent, glass:document.documentElement.dataset.glass, cores:navigator.hardwareConcurrency, mem:navigator.deviceMemory||null, dpr:devicePixelRatio, vw:innerWidth }
  await frames(800)
  const max = document.documentElement.scrollHeight - innerHeight
  res.scroll = stats(await frames(4000,(t)=>scrollTo(0, max*(0.5-0.5*Math.cos(Math.PI*t/2000))))); scrollTo(0,0)
  const tabF=[]; for(let i=0;i<6;i++){ select((i+1)%4); tabF.push(...await frames(450)) } res.tabs = stats(tabF)
  const shF=[]; for(let i=0;i<4;i++){ app.classList.add('open'); shF.push(...await frames(550)); app.classList.remove('open'); shF.push(...await frames(550)) } res.sheet = stats(shF)
  document.title = 'BENCH ' + JSON.stringify(res)
  try { await fetch('/report', { method:'POST', body: JSON.stringify(res) }) } catch {}
  console.log('BENCH', JSON.stringify(res))
}
if (q.get('bench') === '1') setTimeout(bench, 1500)
"""

tabs_html = ''.join(
    f'<div class="tab{" on" if i == 0 else ""}">{icon}<span>{label}</span></div>'
    for i, (icon, label) in enumerate([(gen.ICON['home'], 'Home'), (gen.ICON['food'], 'Food'), (gen.ICON['train'], 'Train'), (GEO_ICON, 'Geo')]))
acts = [('camera','Photo'),('menu','Menu'),('search','Search'),('scale','Weight'),('drop','Water'),('moon','Sleep'),('smile','Mood'),('bolt','Energy'),('train','Workout')]
grid = ''.join(f'<div class="act"><b>{gen.ICON[i]}</b>{l}</div>' for i, l in acts)

html = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Tab bar prototype</title>{gen.FONT}
<style>{gen.BASE_CSS}{gen.C_CSS}{PROTO_CSS}</style></head><body class="c">
<div class="app"><div class="hdr"><div><div class="title">Today</div><div class="sub num">Fri 24 Oct</div></div>
<div style="display:flex;gap:10px"><div class="gbtn glass">{gen.ICON['cal']}</div><div class="gbtn glass">{gen.ICON['more']}</div></div></div>{content}</div>
<div class="scrim"></div>
<div class="sheet glass" style="background:rgba(253,246,236,.86)"><div class="grab"></div>
<div style="font-size:15px;font-weight:600;color:var(--i65);margin:0 4px 10px">Tell Geo, or pick one</div>
<div class="field"><div class="t">2 eggs and toast</div><div class="cam">{gen.ICON['camera']}</div><div class="send">{gen.ICON['up']}</div></div>
<div class="acts">{grid}</div></div>
<div class="tabbar"><div class="capsule glass"><div class="pill"></div>{tabs_html}</div><div class="orb glass">{gen.ICON['plus']}</div></div>
<script>{PROTO_JS}</script></body></html>'''
open(os.path.join(OUT, 'tab-bar.html'), 'w').write(html)
print('written', os.path.join(OUT, 'tab-bar.html'))
