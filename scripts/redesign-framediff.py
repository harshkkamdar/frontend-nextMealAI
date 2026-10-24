"""Usage: python3 scripts/redesign-framediff.py docs/redesign/screens/<slice>/transitions
Frame-diff each recorded transition and flag pops.

Regions: chrome = top 64 px and bottom 120 px (progress, back, CTA); content = the rest.
A pop is either
  - chrome: an isolated frame carrying more than 8% of the chrome's total change (rubric item 4: a jump
    outside an animation). Isolated = neither neighbouring frame changed by a quarter as much, so a colour
    or progress animation spread over several frames is motion, not a pop. Ignored when the chrome change
    is tiny (< 400 px, e.g. a pressed-state tint), or
  - content: one frame carrying more than 50% of the content's total change (no motion, a hard cut), or
  - late shift: a one-frame change after the transition has settled for 6 frames (layout shift after paint).
Writes report.json next to the transitions and prints one line per transition."""
import json, os, sys
import numpy as np
from PIL import Image

root = sys.argv[1]
TOP, BOTTOM, PX = 64, 120, 12  # px; a pixel counts as changed when any channel moves more than PX


def load(p):
    return np.asarray(Image.open(p).convert('RGB'), dtype=np.int16)


report = {}
for name in sorted(os.listdir(root)):
    d = os.path.join(root, name)
    if not os.path.isdir(d):
        continue
    files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    if len(files) < 3:
        report[name] = {'frames': len(files), 'verdict': 'too few frames'}
        continue
    frames = [load(os.path.join(d, f)) for f in files]
    h = frames[0].shape[0]
    chrome_mask = np.zeros(frames[0].shape[:2], bool)
    chrome_mask[:TOP] = True
    chrome_mask[h - BOTTOM:] = True
    chrome, content = [], []
    for a, b in zip(frames, frames[1:]):
        changed = (np.abs(b - a).max(axis=2) > PX)
        chrome.append(int((changed & chrome_mask).sum()))
        content.append(int((changed & ~chrome_mask).sum()))
    ct, nt = sum(chrome), sum(content)
    issues = []
    if ct >= 400:
        for i, c in enumerate(chrome):
            prev = chrome[i - 1] if i > 0 else 0
            nxt = chrome[i + 1] if i + 1 < len(chrome) else 0
            isolated = prev < c / 4 and nxt < c / 4
            if c / ct > 0.08 and c > 400 and isolated:
                issues.append(f'chrome jump frame {i + 1}: {c / ct:.0%} of chrome change')
    if nt > 0:
        for i, c in enumerate(content):
            if c / nt > 0.5 and nt > 2000:
                issues.append(f'content hard cut frame {i + 1}: {c / nt:.0%} of content change')
    total = [a + b for a, b in zip(chrome, content)]
    quiet = 0
    for i, c in enumerate(total):
        if c < 50:
            quiet += 1
        else:
            # E3 (Ved, 24 Oct 2026): a jump is a pop only when it lands in one frame. A late change that keeps
            # moving over the next frames (a live clock rolling a digit) is motion; a one-frame shift is a pop.
            nxt = total[i + 1] if i + 1 < len(total) else 0
            if quiet >= 6 and i > 0 and sum(total[:i]) > 0 and nxt < c / 4:
                issues.append(f'late change frame {i + 1} after {quiet} still frames ({c} px)')
            quiet = 0
    report[name] = {'frames': len(files), 'chrome_px': ct, 'content_px': nt, 'max_chrome_share': round(max(chrome) / ct, 3) if ct else 0, 'max_content_share': round(max(content) / nt, 3) if nt else 0, 'issues': issues, 'verdict': 'pop' if issues else 'smooth'}
    print(f"{name}: {len(files)} frames, max chrome share {report[name]['max_chrome_share']:.0%}, max content share {report[name]['max_content_share']:.0%}, {report[name]['verdict']}" + (' - ' + '; '.join(issues) if issues else ''))

json.dump(report, open(os.path.join(root, 'report.json'), 'w'), indent=2)
