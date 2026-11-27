"""Build docs/index.html, docs/ja.html and docs/zh.html from src/.

    src/layout.html          page skeleton (<head>, script tags)
    src/components/*.html    one file per section (header, hero, about, ...)
    src/i18n/<lang>.json     the text for each language

Template syntax:
    {{> name}}      insert src/components/name.html
    {{some.key}}    insert the text at that key from the language's JSON file
    {{build.year}}  the current year (for the footer)
    {{build.years}} whole years since CAREER_START (for "5+ years")

The build stops if the language files don't all have the same keys.

Run:  python build.py      (serve.py also runs it on start)
Only standard-library Python is needed.
"""
import datetime
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "docs"

# language code -> output file
PAGES = {"en": "index.html", "ja": "ja.html", "zh": "zh.html"}

# first month as a professional developer (DevPro, Aug 2021)
CAREER_START = (2021, 8)

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


def flat_keys(data, prefix=""):
    keys = set()
    for k, v in data.items():
        key = f"{prefix}{k}"
        keys |= flat_keys(v, key + ".") if isinstance(v, dict) else {key}
    return keys


def check_same_keys(all_strings):
    base_lang = next(iter(all_strings))
    base = flat_keys(all_strings[base_lang])
    problems = []
    for lang, strings in all_strings.items():
        keys = flat_keys(strings)
        if keys - base:
            problems.append(f"[{lang}] keys not in {base_lang}.json: {', '.join(sorted(keys - base))}")
        if base - keys:
            problems.append(f"[{lang}] keys missing from {lang}.json: {', '.join(sorted(base - keys))}")
    if problems:
        raise SystemExit("\n".join(problems))


def build_values(today):
    years = today.year - CAREER_START[0] - (today.month < CAREER_START[1])
    return {"year": str(today.year), "years": str(years)}


def render(template, strings, lang, today):
    # values derived at build time, not translated
    strings = dict(strings, build=build_values(today), current={
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


def build(today=None):
    today = today or datetime.date.today()
    template = expand_includes((SRC / "layout.html").read_text(encoding="utf-8"))
    all_strings = {
        lang: json.loads((SRC / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        for lang in PAGES
    }
    check_same_keys(all_strings)
    for lang, filename in PAGES.items():
        html = render(template, all_strings[lang], lang, today)
        (OUT / filename).write_text(html, encoding="utf-8", newline="\n")
        print(f"built docs/{filename}")


if __name__ == "__main__":
    build()
