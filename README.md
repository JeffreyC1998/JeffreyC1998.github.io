# Personal Page

Junhao Zheng's personal site, published at <https://jeffreyc1998.github.io/> in English, Japanese and Chinese.

It's a plain static site with no framework. Each section of the page is a component, and `build.py` puts them together into the final HTML.

## Layout

```
.
├── src/                 source: edit here
│   ├── layout.html      page skeleton
│   ├── components/      one file per section
│   │   ├── header.html
│   │   ├── hero.html
│   │   ├── about.html
│   │   ├── journey.html
│   │   ├── experience.html
│   │   ├── skills.html
│   │   ├── contact.html
│   │   └── footer.html
│   └── i18n/            text per language
│       ├── en.json
│       ├── ja.json
│       └── zh.json
├── docs/                published by GitHub Pages
│   ├── index.html       ┐
│   ├── ja.html          ├ generated, don't edit
│   ├── zh.html          ┘
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       └── journey.js
├── build.py             src/ → docs/*.html
└── serve.py             local preview
```

| Path | What it is |
| --- | --- |
| `src/layout.html` | `<head>`, the order of the sections, and the script tags |
| `src/components/` | the markup for each section, with `{{key}}` where text goes |
| `src/i18n/` | the text for each language, one JSON file per language |
| `docs/*.html` | the generated pages; `build.py` overwrites them |
| `docs/js/main.js` | dark-mode toggle, experience filter, nav highlight |
| `docs/js/journey.js` | the globe in the Journey section (d3 + topojson from a CDN) |
| `serve.py` | serves `docs/` at localhost:8000 after running the build once |

## Preview locally

```powershell
python serve.py
```

Then open <http://localhost:8000/>. Press `Ctrl + C` to stop.

## Making changes

- **Text**: edit the language's JSON file in `src/i18n/`. All three files must have the same keys.
- **Markup or styling**: edit a component in `src/components/`, or `docs/css/style.css`.
- **A new section**: create `src/components/xxx.html`, add `{{> xxx}}` to `src/layout.html`, and add its text to all three JSON files.

Then run:

```powershell
python build.py
```

### Template syntax

| Syntax | What it does |
| --- | --- |
| `{{> hero}}` | inserts `src/components/hero.html` |
| `{{hero.lead}}` | inserts the text at `hero.lead` from the current language's JSON |

Notes:

- Text from the JSON files is inserted into the HTML as-is, so write `&` as `&amp;`. Tags such as `<br>` work too.
- The `aria-current` on the language switcher is added by the build, so it isn't in the JSON.
- If a language is missing a key, the build stops and lists the missing keys.

## Publishing

GitHub Pages serves the `docs/` folder directly; there is no CI. Commit the generated `docs/*.html` together with your changes in `src/`:

```powershell
python build.py
git add src docs
git commit -m "..."
git push
```

Everything runs on the Python 3 standard library, so there's nothing to install.
