"""見出し(h1〜h4)に文節区切りの <wbr> を入れる（日本語の見出しが文節の途中で改行されないように）。

使い方:  python scripts/add_wbr.py column/新しい記事.html [ほかのファイル ...]
  - 引数なしなら、サイト内の全ページを処理する。すでに <wbr> がある見出しは触らない
  - 区切りは BudouX（pip install budoux）で求める。本文の文字は変わらない
  - CSS 側で h1〜h4 に word-break:keep-all を指定済み（top.css / light.css / sub.css）
"""
import re, html, sys, pathlib
import budoux

R = pathlib.Path(__file__).resolve().parent.parent
parser = budoux.load_default_japanese_parser()
CJK = re.compile(r'[぀-ヿ㐀-鿿]')

def phrase(inner):
    out = []
    for part in re.split(r'(<[^>]+>)', inner):
        if part.startswith('<') or not CJK.search(part):
            out.append(part); continue
        lead = re.match(r'^\s*', part).group(0); trail = re.search(r'\s*$', part).group(0)
        core = part[len(lead):len(part) - len(trail)] if trail else part[len(lead):]
        out.append(lead + '<wbr>'.join(html.escape(c, quote=False) for c in parser.parse(html.unescape(core))) + trail)
    return ''.join(out)

def process(path):
    s = path.read_text('utf-8'); i = s.index('<body')
    def rep(m):
        tag, attrs, inner = m.group(1), m.group(2) or '', m.group(3)
        if '<wbr>' in inner or '<svg' in inner: return m.group(0)
        return f'<{tag}{attrs}>{phrase(inner)}</{tag}>'
    body = re.sub(r'<(h[1-4])(\s[^>]*)?>(.*?)</\1>', rep, s[i:], flags=re.S)
    if body != s[i:]:
        path.write_text(s[:i] + body, 'utf-8'); print('updated', path.relative_to(R))

targets = [pathlib.Path(a).resolve() for a in sys.argv[1:]] or \
    [R / p for p in ['index.html', 'no3.html', 'services.html', 'contact.html', 'company.html', 'privacy.html']] + sorted((R / 'column').glob('*.html'))
for t in targets: process(t)
