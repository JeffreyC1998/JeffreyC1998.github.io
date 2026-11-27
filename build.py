"""Build docs/index.html, docs/ja.html and docs/zh.html from src/.

    src/layout.html          page skeleton (<head>, script tags)
    src/components/*.html    one file per section (header, hero, about, ...)
    src/i18n/<lang>.json     the text for each language

Template syntax:
    {{> name}}      insert src/components/name.html
    {{some.key}}    insert the text at that key from the language's JSON file

Run:  python build.py      (serve.py also runs it on start)
Only standard-library Python is needed.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "docs"

# language code -> output file
PAGES = {"en": "index.html", "ja": "ja.html", "zh": "zh.html"}

INCLUDE = re.compile(r"\{\{>\s*([\w-]+)\s*\}\}")
KEY = re.compile(r"\{\{\s*([\w.]+)\s*\}\}")


def expand_includes(text):
    def repl(m):
        path = SRC / "components" / f"{m.group(1)}.html"
        if not path.exists():
            raise SystemExit(f"Unknown component: {m.group(0)} (expected {path})")
        return expand_includes(path.read_text(encoding="utf-8").rstrip("\n"))
    return INCLUDE.sub(repl, text)


def lookup(data, key):
    node = data
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            raise KeyError(key)
        node = node[part]
    if not isinstance(node, str):
        raise KeyError(key)
    return node


def render(template, strings, lang):
    # aria-current on the language switcher is derived, not translated
    strings = dict(strings, current={
        code: ' aria-current="page"' if code == lang else "" for code in PAGES
    })
    missing = []

    def repl(m):
        try:
            return lookup(strings, m.group(1))
        except KeyError:
            missing.append(m.group(1))
            return m.group(0)

    html = KEY.sub(repl, template)
    if missing:
        raise SystemExit(f"[{lang}] missing keys in src/i18n/{lang}.json: {', '.join(sorted(set(missing)))}")
    return html


def build():
    template = expand_includes((SRC / "layout.html").read_text(encoding="utf-8"))
    for lang, filename in PAGES.items():
        strings = json.loads((SRC / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        html = render(template, strings, lang)
        (OUT / filename).write_text(html, encoding="utf-8", newline="\n")
        print(f"built docs/{filename}")


if __name__ == "__main__":
    build()
