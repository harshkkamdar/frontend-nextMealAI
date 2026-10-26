"""Usage: python3 scripts/redesign-review-sheets.py
Builds docs/redesign/screens/review/<slice>.png: first-pass (D2) screen on the left, redesign on the right."""
import os
from PIL import Image, ImageDraw
B = 'docs/phase2/screens/after'
R = 'docs/redesign/screens'
PAIRS = {
    'welcome': [('docs/redesign/screens/slice-1b/welcome-1-390.png', f'{R}/slice-1c/welcome-1-390.png')],
    'slice-2-home': [(f'{B}/D2-01-home-default-390.png', f'{R}/slice-2/home-390.png'), (None, f'{R}/slice-2/plus-sheet-390.png')],
    'slice-3-logging': [(f'{B}/D2-06-log-food-search-default-390.png', f'{R}/slice-3/food-results-390.png'), (f'{B}/D2-09-log-weight-default-390.png', f'{R}/slice-3/weight-filled-390.png'), (f'{B}/D2-14-log-chooser-default-390.png', f'{R}/slice-3/logs-default-390.png')],
    'slice-4-geo': [(f'{B}/D2-21-geo-chat-list-default-390.png', f'{R}/slice-4/list-390.png'), (f'{B}/D2-21b-geo-chat-session-default-390.png', f'{R}/slice-4/session-390.png')],
    'slice-5-food': [(f'{B}/D2-05-food-diary-default-390.png', f'{R}/slice-5/food-390.png')],
    'slice-6-train': [(f'{B}/D2-16-train-default-390.png', f'{R}/slice-6/train-390.png'), (f'{B}/D2-17-live-session-default-390.png', f'{R}/slice-6/session-mid-390.png')],
    'slice-7-plans': [(f'{B}/D2-18-plans-list-default-390.png', f'{R}/slice-7/plans-390.png'), (f'{B}/D2-19-plans-detail-workout-default-390.png', f'{R}/slice-7/view-workout-390.png')],
    'slice-8-checkin': [(f'{B}/D2-02-check-in-due-default-390.png', f'{R}/slice-8/due-390.png'), (f'{B}/D2-03-check-in-mid-week-default-390.png', f'{R}/slice-8/mid-week-390.png')],
    'slice-9-settings': [(f'{B}/D2-28-settings-default-390.png', f'{R}/slice-9/settings-390.png'), (f'{B}/D2-29-profile-default-390.png', f'{R}/slice-9/profile-390.png')],
}
W = 300
os.makedirs(f'{R}/review', exist_ok=True)
for name, pairs in PAIRS.items():
    pairs = [(b if b and os.path.exists(b) else None, a) for b, a in pairs if os.path.exists(a)]
    if not pairs: continue
    def load(p):
        im = Image.open(p).convert('RGB'); return im.resize((W, int(im.height * W / im.width)))
    rows = [(load(b) if b else None, load(a)) for b, a in pairs]
    h = max(max(x.height if x else 0, y.height) for x, y in rows)
    sheet = Image.new('RGB', (2 * W + 36, len(rows) * (h + 30) + 12), (232, 228, 220))
    d = ImageDraw.Draw(sheet)
    for i, (b, a) in enumerate(rows):
        y = 28 + i * (h + 30)
        d.text((12, y - 18), 'Before (first pass)', fill=(17, 28, 53)); d.text((24 + W, y - 18), 'After (redesign)', fill=(17, 28, 53))
        if b: sheet.paste(b, (12, y))
        sheet.paste(a, (24 + W, y))
    sheet.save(f'{R}/review/{name}.png'); print(name, len(rows))
