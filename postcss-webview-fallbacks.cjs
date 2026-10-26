// Fallbacks for Android System WebView as old as Chrome 91, run after Tailwind.
// Each fallback is ignored by modern browsers, so their rendering is unchanged.
//
// 1. Individual transform properties `translate`/`scale`/`rotate` (Chrome 104+):
//    add a `transform` copy inside `@supports not (translate:0)`.
// 2. `dvh` units (Chrome 108+): add a `vh` copy inside `@supports not (height:1dvh)`.

const SUPPORTS = "not (translate:0)";
// A separate block, not a preceding declaration: the minifier drops duplicates.
const DVH_SUPPORTS = "not (height:1dvh)";
const TRANSFORM =
  "translate(var(--tw-translate-x,0),var(--tw-translate-y,0)) rotate(var(--tw-rotate-fb,0deg)) scale(var(--tw-scale-x,1),var(--tw-scale-y,1))";

// scale() only takes percentages from Chrome 108, so 110% becomes 1.1.
const toNumber = (v) => v.replace(/(-?[\d.]+)%/g, (_, n) => String(Number(n) / 100));

function transformVars(decls) {
  const vars = [];
  for (const d of decls) {
    const parts = d.value.trim().split(/\s+/);
    if (/^--tw-scale-[xy]$/.test(d.prop)) vars.push([d.prop, toNumber(d.value)]);
    else if (d.prop === "rotate") vars.push(["--tw-rotate-fb", d.value]);
    else if (d.prop === "scale" && !d.value.includes("var(")) {
      vars.push(["--tw-scale-x", toNumber(parts[0])], ["--tw-scale-y", toNumber(parts[1] ?? parts[0])]);
    } else if (d.prop === "translate" && !d.value.includes("var(")) {
      vars.push(["--tw-translate-x", parts[0]], ["--tw-translate-y", parts[1] ?? "0"]);
    }
  }
  return vars;
}

const plugin = () => ({
  postcssPlugin: "webview-fallbacks",
  OnceExit(root, { AtRule, Rule }) {
    let usedRotate = false;
    root.walkRules((rule) => {
      const parent = rule.parent;
      if (parent.type === "atrule" && (/keyframes$/.test(parent.name) || parent.params === SUPPORTS)) return;
      const decls = rule.nodes.filter((n) => n.type === "decl");
      if (!decls.some((d) => d.prop === "translate" || d.prop === "scale" || d.prop === "rotate")) return;
      const fallback = new Rule({ selector: rule.selector });
      for (const [prop, value] of transformVars(decls)) {
        if (prop === "--tw-rotate-fb") usedRotate = true;
        fallback.append({ prop, value });
      }
      fallback.append({ prop: "transform", value: TRANSFORM });
      rule.after(new AtRule({ name: "supports", params: SUPPORTS }).append(fallback));
    });
    // Registered (non-inheriting) so a rotated parent does not rotate transformed children.
    if (usedRotate) {
      root.append(
        new AtRule({ name: "property", params: "--tw-rotate-fb" }).append(
          { prop: "syntax", value: '"<angle>"' },
          { prop: "inherits", value: "false" },
          { prop: "initial-value", value: "0deg" },
        ),
      );
    }
    root.walkDecls((decl) => {
      const rule = decl.parent;
      if (!/\ddvh/.test(decl.value) || rule.type !== "rule" || rule.parent.params === DVH_SUPPORTS) return;
      const fallback = new Rule({ selector: rule.selector });
      fallback.append(decl.clone({ value: decl.value.replace(/(\d)dvh/g, "$1vh") }));
      rule.after(new AtRule({ name: "supports", params: DVH_SUPPORTS }).append(fallback));
    });
  },
});
plugin.postcss = true;

module.exports = plugin;
