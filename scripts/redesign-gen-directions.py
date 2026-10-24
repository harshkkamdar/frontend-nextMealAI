"""Usage: python3 scripts/redesign-gen-directions.py docs/redesign/directions
Generate Phase 3 direction mocks: docs/redesign/directions/{a,b,c}.html.
Each file holds three 390x844 screens: home, + sheet, onboarding weight step."""
import math, sys, os


FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet">'

BASE_CSS = """
:root{--ink:#111C35;--accent:#E8622A;--cream:#FDF6EC;--card:#FFFFFF;--teal:#3E7C77;--ochre:#A07A3C;
--i04:rgba(17,28,53,.04);--i06:rgba(17,28,53,.06);--i08:rgba(17,28,53,.08);--i12:rgba(17,28,53,.12);--i20:rgba(17,28,53,.2);--i65:rgba(17,28,53,.68);
--shadow:0 1px 2px rgba(17,28,53,.04),0 8px 24px rgba(17,28,53,.06)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#d9d3c8;font-family:Archivo,system-ui,sans-serif;color:var(--ink);display:flex;gap:40px;padding:40px;align-items:flex-start;-webkit-font-smoothing:antialiased}
.phone{width:390px;height:844px;background:var(--cream);position:relative;overflow:hidden;flex:none}
.status{position:relative;z-index:10;height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 32px 0 38px;font-weight:600;font-size:16px;font-variant-numeric:tabular-nums}
.status .r{display:flex;gap:6px;align-items:center}
.num{font-variant-numeric:tabular-nums}
.glass{background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(20px) saturate(1.6);backdrop-filter:blur(20px) saturate(1.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 0 .5px rgba(255,255,255,.6),0 8px 24px rgba(17,28,53,.10)}
.gbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center}
.gbtn svg{width:20px;height:20px}
.card{background:var(--card);border-radius:24px;box-shadow:var(--shadow)}
.tabbar{position:absolute;left:16px;right:16px;bottom:30px;display:flex;gap:10px;align-items:center;z-index:5}
.capsule{flex:1;height:62px;border-radius:31px;display:flex;align-items:center;justify-content:space-around;padding:0 6px}
.tab{width:64px;height:52px;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;font-weight:600;color:var(--i65)}
.tab svg{width:22px;height:22px}
.tab.on{background:var(--i08);color:var(--ink)}
.orb{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;flex:none}
.orb svg{width:24px;height:24px}
.fade-top{position:absolute;left:0;right:0;top:0;height:110px;background:linear-gradient(var(--cream) 55%,rgba(253,246,236,0));z-index:4;pointer-events:none}
.fade-bot{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(rgba(253,246,236,0),var(--cream) 60%);z-index:4;pointer-events:none}
.scroll{position:absolute;inset:0;overflow:hidden}
.home-ind{position:absolute;bottom:8px;left:50%;width:134px;height:5px;border-radius:3px;background:var(--ink);transform:translateX(-50%);z-index:9}
.dots{display:grid;gap:3px}
.dots i{display:block;width:6px;height:6px;border-radius:50%}
.meter{width:8px;border-radius:4px;background:var(--i06);position:relative}
.meter .band{position:absolute;left:0;right:0;border-radius:4px;background:var(--i12)}
.meter .mark{position:absolute;left:50%;width:14px;height:14px;border-radius:50%;background:var(--card);border:2.5px solid var(--ink);transform:translate(-50%,-50%)}
.scrim{position:absolute;inset:0;background:rgba(17,28,53,.28);z-index:6}
.sheet{position:absolute;left:8px;right:8px;bottom:8px;border-radius:38px;z-index:7;padding:10px 18px 112px}
.grab{width:36px;height:5px;border-radius:3px;background:var(--i20);margin:0 auto 14px}
.field{height:56px;border-radius:28px;background:var(--card);display:flex;align-items:center;gap:10px;padding:0 6px 0 18px;box-shadow:var(--shadow)}
.field .t{flex:1;font-size:17px}
.send{width:44px;height:44px;border-radius:50%;background:var(--accent);display:grid;place-items:center}
.send svg{width:20px;height:20px}
.cam{width:44px;height:44px;border-radius:50%;background:var(--i06);display:grid;place-items:center}
.cam svg{width:20px;height:20px}
.acts{display:grid;grid-template-columns:repeat(3,1fr);row-gap:18px;margin-top:22px}
.act{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:13px;font-weight:500}
.act b{width:58px;height:58px;border-radius:50%;background:var(--card);display:grid;place-items:center;box-shadow:0 2px 10px rgba(17,28,53,.08)}
.act svg{width:24px;height:24px}
.ob-top{display:flex;align-items:center;gap:14px;padding:6px 20px 0}
.prog{flex:1;height:4px;border-radius:2px;background:var(--i08);overflow:hidden}
.prog i{display:block;height:100%;background:var(--ink)}
.cta{position:absolute;left:20px;right:20px;bottom:42px;height:58px;border-radius:29px;background:var(--accent);color:#fff;font-size:19px;font-weight:700;display:grid;place-items:center}
.seg{display:inline-flex;background:var(--i06);border-radius:18px;padding:3px}
.seg span{padding:7px 18px;border-radius:15px;font-size:14px;font-weight:600;color:var(--i65)}
.seg span.on{background:var(--card);color:var(--ink);box-shadow:0 1px 4px rgba(17,28,53,.1)}
.ruler{position:relative;height:84px;overflow:hidden}
.ruler .ticks{position:absolute;left:0;right:0;bottom:24px;height:44px;display:flex;align-items:flex-end;justify-content:center;gap:9px}
.ruler .ticks i{width:2px;background:var(--i20);border-radius:1px;flex:none}
.ruler .ptr{position:absolute;left:50%;bottom:20px;width:3px;height:56px;background:var(--ink);border-radius:2px;transform:translateX(-50%)}
.ruler .lab{position:absolute;bottom:0;font-size:12px;color:var(--i65);transform:translateX(-50%)}
.why{font-size:15px;line-height:1.45;color:var(--i65)}
"""

ICON = {
 'home':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.3 3.3a1 1 0 0 1 1.4 0l8 7.4c.6.6.2 1.6-.7 1.6H19v7.2c0 .8-.7 1.5-1.5 1.5H15v-5.2c0-.6-.4-1-1-1h-4c-.6 0-1 .4-1 1V21H6.5C5.7 21 5 20.3 5 19.5v-7.2H4c-.9 0-1.3-1-.7-1.6z"/></svg>',
 'food':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 11h18a1 1 0 0 1 1 1 9 9 0 0 1-6 8.5V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-.5A9 9 0 0 1 2 12a1 1 0 0 1 1-1zm6.5-8.2c.4-.4 1-.3 1.4.1.4.5.3 1.1-.1 1.5-.6.5-.6.9 0 1.5 1.3 1.3 1.3 2.9 0 4.2H8.6c.7-1 .8-1.6-.1-2.6C7.4 6.2 7.7 4.2 9.5 2.8zm5 0c.4-.4 1-.3 1.4.1.4.5.3 1.1-.1 1.5-.6.5-.6.9 0 1.5 1.3 1.3 1.3 2.9 0 4.2h-2.2c.7-1 .8-1.6-.1-2.6-1.1-1.3-.8-3.3 1-4.7z"/></svg>',
 'train':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 7a1.5 1.5 0 0 1 3 0v10a1.5 1.5 0 0 1-3 0zm11 0a1.5 1.5 0 0 1 3 0v10a1.5 1.5 0 0 1-3 0zM2 9.5a1.2 1.2 0 0 1 2.4 0v5a1.2 1.2 0 0 1-2.4 0zm17.6 0a1.2 1.2 0 0 1 2.4 0v5a1.2 1.2 0 0 1-2.4 0zM8.5 11h7v2h-7z"/></svg>',
 'check':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 13.5c0-.8.7-1.5 1.5-1.5S7 12.7 7 13.5v5.5a1.5 1.5 0 0 1-3 0zm6.5-5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V19a1.5 1.5 0 0 1-3 0zM17 5c0-.8.7-1.5 1.5-1.5S20 4.2 20 5v14a1.5 1.5 0 0 1-3 0z"/></svg>',
 'plus':'<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>',
 'x':'<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
 'cal':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
 'more':'<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18.5" cy="12" r="1.8" fill="currentColor"/></svg>',
 'back':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
 'up':'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
 'camera':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.5zm3 4.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>',
 'menu':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z"/></svg>',
 'search':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
 'scale':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm6 3.5a6 6 0 0 0-5.2 3l2 1.1A3.7 3.7 0 0 1 11 8.9V11h2V8.9a3.7 3.7 0 0 1 2.2 1.7l2-1.1a6 6 0 0 0-5.2-3z"/></svg>',
 'drop':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5c.3 0 .6.2.8.4C15.3 6 19 10.6 19 14.5a7 7 0 0 1-14 0c0-3.9 3.7-8.5 6.2-11.6.2-.2.5-.4.8-.4z"/></svg>',
 'moon':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14.5 2.6a1 1 0 0 1 1.1-.3A10 10 0 1 1 3 15.6a1 1 0 0 1 1.4-1.2A7.5 7.5 0 0 0 14.3 3.8a1 1 0 0 1 .2-1.2z"/></svg>',
 'smile':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM8.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7.8 14a.9.9 0 0 0-.7 1.4 6 6 0 0 0 9.8 0 .9.9 0 0 0-.7-1.4z"/></svg>',
 'bolt':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.6 2.3c.5-.6 1.4-.1 1.2.6L13.2 10H19c.8 0 1.2.9.7 1.5l-9.3 10.2c-.5.6-1.4.1-1.2-.6L10.8 14H5c-.8 0-1.2-.9-.7-1.5z"/></svg>',
 'steps':'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.5 2C10.4 2 11 4.4 11 6.6c0 2.6-.9 4.4-1.3 5.4l-4.4-.8C5 9.9 5 8.4 5 7c0-2.5 1.4-5 3.5-5zm7 5c2.1 0 3.5 2.5 3.5 5 0 1.4 0 2.9-.3 4.2l-4.4.8c-.4-1-1.3-2.8-1.3-5.4 0-2.2.6-4.6 2.5-4.6zM5.4 13.2l4.2.8c.3 1.6-.4 3.6-2.3 3.6-1.6 0-2.3-2-1.9-4.4zm13.2 5c.4 2.4-.3 4.4-1.9 4.4-1.9 0-2.6-2-2.3-3.6z"/></svg>',
}

def status():
    return '<div class="status"><span class="num">9:41</span><span class="r"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#111C35"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#111C35"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#111C35"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#111C35"/></svg><svg width="26" height="12" viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="#111C35" opacity=".4"/><rect x="2" y="2" width="16" height="8" rx="2" fill="#111C35"/></svg></span></div>'

def tabbar(orb_icon='plus', on='home'):
    tabs = [('home','Home'),('food','Food'),('train','Train'),('check','Check-in')]
    t = ''.join(f'<div class="tab{" on" if k==on else ""}">{ICON[k]}<span>{l}</span></div>' for k,l in tabs)
    return f'<div class="tabbar"><div class="capsule glass">{t}</div><div class="orb glass">{ICON[orb_icon]}</div></div>'

def ring(size, stroke, frac, ticks=False, track='var(--i08)'):
    r = (size - stroke) / 2 - (8 if ticks else 0)
    c = 2 * math.pi * r
    cx = size / 2
    out = [f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" style="display:block">']
    if ticks:
        for k in range(60):
            a = k / 60 * 2 * math.pi - math.pi / 2
            r1, r2 = size / 2 - 1, size / 2 - (6 if k % 5 == 0 else 3.5)
            op = '.55' if k / 60 <= frac else '.16'
            out.append(f'<line x1="{cx+r1*math.cos(a):.1f}" y1="{cx+r1*math.sin(a):.1f}" x2="{cx+r2*math.cos(a):.1f}" y2="{cx+r2*math.sin(a):.1f}" stroke="#111C35" stroke-opacity="{op}" stroke-width="1.4" stroke-linecap="round"/>')
    out.append(f'<circle cx="{cx}" cy="{cx}" r="{r:.1f}" fill="none" stroke="{track}" stroke-width="{stroke}"/>')
    out.append(f'<circle cx="{cx}" cy="{cx}" r="{r:.1f}" fill="none" stroke="#E8622A" stroke-width="{stroke}" stroke-linecap="round" stroke-dasharray="{c*frac:.1f} {c:.1f}" transform="rotate(-90 {cx} {cx})"/>')
    out.append('</svg>')
    return ''.join(out)

def dots(color, frac, cols=4, rows=8, size=6, gap=3):
    n = cols * rows
    filled = round(n * frac)
    cells = []
    for k in range(n):
        # fill bottom-up
        if rows <= 2:  # horizontal strip: fill column by column, left to right
            idx = (k % cols) * rows + (k // cols)
        else:  # vertical column: fill row by row, bottom up
            idx = ((n - 1 - k) // cols) * cols + (k % cols)
        on = idx < filled
        cells.append(f'<i style="width:{size}px;height:{size}px;background:{color if on else "var(--i08)"}"></i>')
    return f'<div class="dots" style="grid-template-columns:repeat({cols},{size}px);gap:{gap}px">{"".join(cells)}</div>'

MACROS = [('Protein', 112, 180, 'var(--ink)'), ('Carbs', 168, 260, 'var(--teal)'), ('Fat', 52, 80, 'var(--ochre)')]
TILES = [('steps','Steps','8,214','','On pace',0.62,(0.35,0.75)), ('scale','Weight','78.2','kg','Down 0.6 this week',0.45,(0.3,0.6)), ('drop','Water','1.5','L','Half way',0.5,(0.4,0.9)), ('moon','Sleep','7h 12m','','Normal',0.55,(0.4,0.75))]

def meter(h, frac, band):
    lo, hi = band
    return (f'<div class="meter" style="height:{h}px"><div class="band" style="bottom:{lo*100:.0f}%;top:{(1-hi)*100:.0f}%"></div>'
            f'<div class="mark" style="top:{(1-frac)*100:.0f}%"></div></div>')

GEO = 'Protein is 68 g short. Greek yoghurt now or chicken at dinner closes it.'

# ---------------- Direction A: Instrument ----------------
A_CSS = """
.a .title{font-size:31px;font-weight:700;letter-spacing:-.6px}
.a .sub{font-size:15px;color:var(--i65);margin-top:2px}
.a .cond{font-stretch:72%;font-weight:700}
.a .hero{margin:18px 16px 0;padding:18px 18px 16px}
.a .tile{padding:14px 14px 14px 16px;border-radius:20px;display:flex;justify-content:space-between;gap:8px}
.a .tl{font-size:13px;font-weight:600;color:var(--i65);display:flex;align-items:center;gap:6px}
.a .tl svg{width:14px;height:14px}
.a .tv{font-size:34px;line-height:1;margin-top:10px;letter-spacing:-.5px}
.a .tu{font-size:15px;font-weight:600;color:var(--i65);margin-left:3px;font-stretch:100%}
.a .ts{font-size:13px;margin-top:8px;color:var(--i65)}
"""

def home_a():
    tiles = ''.join(
        f'<div class="card tile"><div><div class="tl">{ICON[ic]}{lab}</div><div class="tv cond num">{v}<span class="tu">{u}</span></div><div class="ts">{st}</div></div>{meter(64,fr,band)}</div>'
        for ic,lab,v,u,st,fr,band in TILES)
    macro_cols = ''.join(
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:8px">{dots(col, cur/tgt, 3, 9, 5, 3)}<div style="text-align:center"><div class="cond num" style="font-size:20px">{cur}<span style="font-size:12px;color:var(--i65);font-weight:600;font-stretch:100%">/{tgt}g</span></div><div style="font-size:12px;color:var(--i65);font-weight:600">{name}</div></div></div>'
        for name,cur,tgt,col in MACROS)
    return f'''<div class="phone a">{status()}<div class="fade-top" style="height:60px"></div>
<div style="padding:8px 20px 0;display:flex;justify-content:space-between;align-items:flex-start">
 <div><div class="title">Today</div><div class="sub num">Friday 24 October</div></div>
 <div style="display:flex;gap:10px"><div class="gbtn glass">{ICON['cal']}</div><div class="gbtn glass">{ICON['more']}</div></div></div>
<div class="card hero">
 <div style="display:flex;align-items:center;gap:18px">
  <div style="position:relative;width:140px;height:140px;flex:none">{ring(140,11,1640/2600,ticks=True)}
   <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div class="cond num" style="font-size:44px;line-height:1;letter-spacing:-1px">960</div><div style="font-size:12.5px;color:var(--i65);font-weight:600;margin-top:4px">kcal left</div></div></div></div>
  <div style="display:flex;gap:6px;flex:1;justify-content:space-between;min-width:0">{macro_cols}</div>
 </div>
 <div style="border-top:1px solid var(--i08);margin-top:16px;padding-top:12px;display:flex;gap:10px;align-items:flex-start">
  <div style="width:22px;height:22px;border-radius:50%;background:var(--ink);color:var(--cream);font-size:11px;font-weight:700;display:grid;place-items:center;flex:none;margin-top:1px">G</div>
  <div style="font-size:15px;line-height:1.45">{GEO}</div></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 16px 0">{tiles}</div>
<div class="card" style="margin:12px 16px 0;padding:14px 16px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:600;color:var(--i65)">Next up</div><div style="font-size:18px;font-weight:700;margin-top:3px">Push day</div></div><div class="num" style="font-size:13px;color:var(--i65)">5 exercises, 45 min</div></div>
<div class="fade-bot"></div>{tabbar()}<div class="home-ind"></div></div>'''

# ---------------- Direction B: Journal ----------------
B_CSS = """
.b .title{font-size:34px;font-weight:600;letter-spacing:-.8px}
.b .sub{font-size:15px;color:var(--i65);margin-top:2px}
.b .lead{font-size:23px;line-height:1.38;letter-spacing:-.3px;font-weight:400;margin:22px 24px 0}
.b .lead b{font-weight:650}
.b .row{display:flex;align-items:center;justify-content:space-between;padding:0 18px;height:60px}
.b .row+.row{border-top:1px solid var(--i06)}
.b .rl{display:flex;align-items:center;gap:12px;font-size:16px;font-weight:500}
.b .rl svg{width:18px;height:18px;opacity:.75}
.b .rv{font-size:17px;font-weight:600}
.b .rv span{font-size:13px;color:var(--i65);font-weight:500;margin-left:2px}
"""

def hbar(frac, band, w=56):
    lo, hi = band
    return (f'<div style="width:{w}px;height:6px;border-radius:3px;background:var(--i06);position:relative">'
            f'<div style="position:absolute;top:0;bottom:0;left:{lo*100:.0f}%;right:{(1-hi)*100:.0f}%;background:var(--i12);border-radius:3px"></div>'
            f'<div style="position:absolute;top:50%;left:{frac*100:.0f}%;width:12px;height:12px;border-radius:50%;background:#fff;border:2.5px solid var(--ink);transform:translate(-50%,-50%)"></div></div>')

def home_b():
    rows = ''.join(
        f'<div class="row"><div class="rl">{ICON[ic]}{lab}</div><div style="display:flex;align-items:center;gap:14px"><div class="rv num">{v}<span>{u}</span></div>{hbar(fr,band)}</div></div>'
        for ic,lab,v,u,st,fr,band in TILES)
    macro = ''.join(
        f'<div style="display:flex;align-items:center;gap:8px">{dots(col, cur/tgt, 10, 1, 6, 3)}<div class="num" style="font-size:13px"><b style="font-weight:650">{cur}</b><span style="color:var(--i65)"> {name.lower()}</span></div></div>'
        for name,cur,tgt,col in MACROS)
    return f'''<div class="phone b">{status()}
<div style="padding:10px 24px 0;display:flex;justify-content:space-between;align-items:flex-start">
 <div><div class="title">Friday</div><div class="sub num">24 October</div></div>
 <div style="display:flex;gap:10px"><div class="gbtn glass">{ICON['cal']}</div><div class="gbtn glass">{ICON['more']}</div></div></div>
<div class="lead">You have had <b class="num">1,640</b> of <b class="num">2,600</b> calories. Protein is 68 g short; Greek yoghurt now or chicken at dinner closes it.</div>
<div class="card" style="margin:22px 16px 0;padding:16px 18px;display:flex;align-items:center;gap:16px">
 <div style="position:relative;width:64px;height:64px;flex:none">{ring(64,7,1640/2600)}<div class="num" style="position:absolute;inset:0;display:grid;place-items:center;font-size:15px;font-weight:700">63%</div></div>
 <div style="display:flex;flex-direction:column;gap:9px">{macro}</div></div>
<div style="font-size:15px;font-weight:600;margin:24px 24px 10px">Body</div>
<div class="card" style="margin:0 16px">{rows}</div>
<div style="font-size:15px;font-weight:600;margin:24px 24px 10px">Meals</div>
<div class="card" style="margin:0 16px"><div class="row"><div class="rl">Breakfast</div><div class="rv num">540<span>kcal</span></div></div><div class="row"><div class="rl">Lunch</div><div class="rv num">1,100<span>kcal</span></div></div></div>
<div class="fade-bot"></div>{tabbar()}<div class="home-ind"></div></div>'''

# ---------------- Direction C: Bento ----------------
C_CSS = """
.c .title{font-size:32px;font-weight:750;font-stretch:118%;letter-spacing:-.6px}
.c .sub{font-size:15px;color:var(--i65);margin-top:2px}
.c .bento{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 16px 0}
.c .bt{border-radius:22px;padding:14px;min-height:118px;position:relative;overflow:hidden}
.c .bl{font-size:13px;font-weight:600;color:var(--i65);display:flex;align-items:center;gap:6px}
.c .bl svg{width:14px;height:14px}
.c .bv{font-size:28px;font-weight:700;font-stretch:110%;letter-spacing:-.6px;margin-top:6px;line-height:1}
.c .bv span{font-size:14px;color:var(--i65);font-weight:600;margin-left:3px;font-stretch:100%}
.c .digit{display:inline-grid;place-items:center;width:30px;height:40px;border-radius:9px;background:var(--i06);font-size:24px;font-weight:700;margin-right:3px}
.c .digit.dim{color:var(--i20)}
"""

def home_c():
    macros = ''.join(
        f'<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div style="font-size:13px;font-weight:600;color:var(--i65);width:50px">{name}</div>{dots(col, cur/tgt, 10, 2, 5, 3)}<div class="num" style="font-size:14px;font-weight:700;width:38px;text-align:right">{cur}g</div></div>'
        for name,cur,tgt,col in MACROS)
    steps_bars = ''.join(f'<i style="display:block;width:5px;height:22px;border-radius:3px;background:{"var(--ink)" if k<14 else "var(--i08)"}"></i>' for k in range(22))
    spark = '<svg width="150" height="34" viewBox="0 0 150 34" style="display:block;margin-top:10px"><rect x="0" y="10" width="150" height="12" rx="6" fill="rgba(17,28,53,.06)"/><path d="M2 6 C20 8,30 12,45 11 S70 16,85 18 S115 22,130 24" fill="none" stroke="#111C35" stroke-width="1.6" stroke-linecap="round"/><circle cx="132" cy="24" r="4.5" fill="#E8622A" stroke="#fff" stroke-width="2.5"/></svg>'
    return f'''<div class="phone c">{status()}
<div style="padding:8px 20px 0;display:flex;justify-content:space-between;align-items:flex-start">
 <div><div class="title">Today</div><div class="sub num">Fri 24 Oct</div></div>
 <div style="display:flex;gap:10px"><div class="gbtn glass">{ICON['cal']}</div><div class="gbtn glass">{ICON['more']}</div></div></div>
<div class="bento">
 <div class="card bt" style="grid-column:span 2;padding:18px">
  <div style="display:flex;align-items:center;gap:18px">
   <div style="position:relative;width:132px;height:132px;flex:none">{ring(132,14,1640/2600)}<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div class="num" style="font-size:34px;font-weight:750;font-stretch:112%;letter-spacing:-1px;line-height:1">960</div><div style="font-size:12px;color:var(--i65);font-weight:600;margin-top:3px">kcal left</div></div></div></div>
   <div style="display:flex;flex-direction:column;gap:14px;flex:1">{macros}</div></div></div>
 <div class="card bt" style="grid-column:span 2;min-height:0;display:flex;gap:12px;align-items:flex-start"><div style="width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--cream);font-size:13px;font-weight:700;display:grid;place-items:center;flex:none">G</div><div style="font-size:15px;line-height:1.45">{GEO}</div></div>
 <div class="card bt"><div class="bl">{ICON['steps']}Steps</div><div class="bv num">8,214</div><div style="display:flex;gap:2px;margin-top:14px">{steps_bars}</div></div>
 <div class="card bt"><div class="bl">{ICON['scale']}Weight</div><div class="bv num">78.2<span>kg</span></div>{spark}</div>
 <div class="card bt"><div class="bl">{ICON['moon']}Sleep</div><div style="margin-top:10px" class="num"><span class="digit">7</span><span style="font-weight:700;color:var(--i20);margin-right:3px">:</span><span class="digit">1</span><span class="digit">2</span></div><div style="font-size:13px;color:var(--i65);margin-top:8px">hours asleep, normal</div></div>
 <div class="card bt" style="padding:0"><div style="position:absolute;left:8px;right:8px;bottom:8px;height:22px;border-radius:14px;background:var(--i06);overflow:hidden"><div style="width:50%;height:100%;background:var(--i20);border-radius:14px"></div></div><div style="position:relative;padding:14px"><div class="bl">{ICON['drop']}Water</div><div class="bv num">1.5<span>of 3 L</span></div><div style="font-size:13px;color:var(--i65);margin-top:8px">Half way</div></div></div>
 <div class="card bt" style="grid-column:span 2;min-height:0;display:flex;justify-content:space-between;align-items:center"><div><div class="bl">Next up</div><div style="font-size:18px;font-weight:700;margin-top:3px">Push day</div></div><div class="num" style="font-size:13px;color:var(--i65)">5 exercises, 45 min</div></div>
</div>
<div class="fade-bot"></div>{tabbar()}<div class="home-ind"></div></div>'''

# ---------------- + sheet (shared, per-direction home behind) ----------------
def sheet(home_html, cls):
    acts = [('camera','Photo'),('menu','Menu'),('search','Search'),('scale','Weight'),('drop','Water'),('moon','Sleep'),('smile','Mood'),('bolt','Energy'),('train','Workout')]
    grid = ''.join(f'<div class="act"><b>{ICON[i]}</b>{l}</div>' for i,l in acts)
    inner = home_html.split('<div class="fade-bot">')[0].replace(f'<div class="phone {cls}">','')
    return f'''<div class="phone {cls}">{inner}<div class="scrim"></div>
<div class="sheet glass" style="background:rgba(253,246,236,.86)"><div class="grab"></div>
 <div style="font-size:15px;font-weight:600;color:var(--i65);margin:0 4px 10px">Tell Geo, or pick one</div>
 <div class="field"><div class="t">2 eggs and toast</div><div class="cam">{ICON['camera']}</div><div class="send">{ICON['up']}</div></div>
 <div class="acts">{grid}</div></div>
<div class="tabbar" style="z-index:8"><div class="capsule glass" style="opacity:0"></div><div class="orb glass">{ICON['x']}</div></div><div class="home-ind"></div></div>'''

# ---------------- onboarding weight step ----------------
def ticks_html(n=31, major=5):
    return ''.join(f'<i style="height:{40 if k%major==0 else 22}px;{"background:var(--i65)" if k%major==0 else ""}"></i>' for k in range(n))

def onboard(cls):
    if cls == 'a':
        body = f'''<div style="padding:34px 24px 0"><div style="font-size:30px;font-weight:700;letter-spacing:-.6px;line-height:1.15">What do you weigh today?</div>
<div class="why" style="margin-top:10px">Geo uses this to set your daily calories.</div></div>
<div style="text-align:center;margin-top:70px"><div class="seg"><span class="on">kg</span><span>lb</span></div>
<div class="num" style="font-size:88px;font-weight:700;font-stretch:70%;letter-spacing:-2px;margin-top:26px;line-height:1">78.2</div></div>
<div class="ruler" style="margin-top:28px"><div class="ticks">{ticks_html()}</div><div class="ptr"></div>
<span class="lab num" style="left:calc(50% - 110px)">76</span><span class="lab num" style="left:calc(50% - 55px)">77</span><span class="lab num" style="left:50%;color:var(--ink);font-weight:700">78</span><span class="lab num" style="left:calc(50% + 55px)">79</span><span class="lab num" style="left:calc(50% + 110px)">80</span></div>'''
    elif cls == 'b':
        body = f'''<div style="padding:40px 26px 0"><div class="why">Step 6 of 20</div>
<div style="font-size:30px;line-height:1.3;letter-spacing:-.5px;margin-top:14px">Today I weigh <span class="num" style="font-weight:650;border-bottom:3px solid var(--ink);padding:0 4px">78.2</span> kg.</div>
<div class="why" style="margin-top:14px">Geo uses this to set your daily calories. You can change it any time.</div>
<div style="margin-top:44px"><div class="seg"><span class="on">kg</span><span>lb</span></div></div></div>
<div class="ruler" style="margin-top:40px"><div class="ticks">{ticks_html()}</div><div class="ptr"></div></div>'''
    else:
        body = f'''<div style="padding:30px 20px 0"><div style="font-size:30px;font-weight:750;font-stretch:115%;letter-spacing:-.6px;line-height:1.12">Your weight today</div>
<div class="why" style="margin-top:10px">Geo uses this to set your daily calories.</div>
<div class="card" style="margin-top:34px;padding:22px 18px 10px;border-radius:26px">
 <div style="display:flex;justify-content:space-between;align-items:center"><div class="seg"><span class="on">kg</span><span>lb</span></div><div style="font-size:13px;color:var(--i65);font-weight:600">Goal 72 kg</div></div>
 <div style="text-align:center;margin-top:22px" class="num"><span class="digit" style="width:52px;height:70px;font-size:46px">7</span><span class="digit" style="width:52px;height:70px;font-size:46px">8</span><span style="font-size:46px;font-weight:700;color:var(--i20)">.</span><span class="digit" style="width:52px;height:70px;font-size:46px">2</span></div>
 <div class="ruler" style="margin-top:14px"><div class="ticks">{ticks_html(27)}</div><div class="ptr"></div></div></div></div>'''
    return f'''<div class="phone {cls}">{status()}
<div class="ob-top"><div class="gbtn glass">{ICON['back']}</div><div class="prog"><i style="width:30%"></i></div></div>
{body}<div class="cta">Continue</div><div class="home-ind"></div></div>'''

if __name__ == '__main__':
    OUT = sys.argv[1]
    DIRS = {'a': ('Direction A - Instrument', A_CSS, home_a), 'b': ('Direction B - Journal', B_CSS, home_b), 'c': ('Direction C - Bento', C_CSS, home_c)}
    for k, (title, css, home) in DIRS.items():
        h = home()
        html = f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>{FONT}<style>{BASE_CSS}{css}</style></head><body>{h}{sheet(h, k)}{onboard(k)}</body></html>'
        open(os.path.join(OUT, f'{k}.html'), 'w').write(html)
    print('written')
