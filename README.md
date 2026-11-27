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
│   ├── 404.html         hand-written, not generated
│   ├── robots.txt, sitemap.xml
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   └── journey.js
│   ├── vendor/
│   │   └── globe-deps.min.js
│   └── data/
│       └── land-110m.json
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
| `docs/js/journey.js` | the globe in the Journey section |
| `docs/vendor/globe-deps.min.js` | the globe's libraries, concatenated in this order: d3-array 3.2.4, d3-geo 3.1.1, d3-dispatch 3.0.1, d3-selection 3.0.0, d3-drag 3.0.0, topojson-client 3.1.0 (the `dist/*.min.js` files from npm) |
| `docs/data/land-110m.json` | land shapes for the globe, from world-atlas 2.0.2 |
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
| `{{build.year}}` | the current year (footer) |
| `{{build.years}}` | whole years since `CAREER_START` in `build.py` (the "5+ years" card) |

Notes:

- Text from the JSON files is inserted into the HTML as-is, so write `&` as `&amp;`. Tags such as `<br>` work too.
- The `aria-current` on the language switcher is added by the build, so it isn't in the JSON.
- The build stops if the three JSON files don't have exactly the same keys, and lists the differences.
- `build.year` and `build.years` come from today's date, so rebuild after New Year and each August.

## Publishing

GitHub Pages serves the `docs/` folder directly. A GitHub Action (`.github/workflows/check-build.yml`) reruns the build on each push and fails if `docs/` doesn't match `src/`. Commit the generated `docs/*.html` together with your changes in `src/`:

```powershell
python build.py
git add src docs
git commit -m "..."
git push
```

Everything runs on the Python 3 standard library, so there's nothing to install.
