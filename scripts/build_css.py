"""CSSを1ファイルにまとめて軽くする（読み込みの往復回数を減らし、表示を速くするため）。

元のCSS（styles-light.css / light.css / sub.css / top.css / fonts.css）を直したら必ず実行する。
  python scripts/build_css.py
出力:
  assets/site.bundle.css … トップ以外の全ページ用（fonts + styles-light + light + sub）
  assets/top.bundle.css  … トップ用（fonts + top）
light.css は各ページ内の <style> より後に効かせたい上書きなので、まとめる際にセレクタの頭へ
「html 」を付けて優先度を1段上げる（読み込み順に関係なく勝つようにする）。
"""
import pathlib, re

A = pathlib.Path(__file__).resolve().parent.parent / 'assets'


def strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)


def minify(css):
    css = strip_comments(css)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};,>])\s*', r'\1', css)
    css = re.sub(r':\s+', ':', css)          # コロンの後ろだけ詰める（前の空白は子孫セレクタの意味がある）
    css = css.replace(';}', '}')
    return css.strip() + '\n'


def boost(css):
    """各ルールのセレクタの頭に html を付ける（@media などの中も対象、@規則そのものは除く）"""
    css = strip_comments(css)
    def fix(m):
        head = m.group(1)
        if head.strip().startswith('@'):
            return m.group(0)
        sels = [s.strip() for s in head.split(',')]
        sels = [s if s.startswith('html') else 'html ' + s for s in sels if s]
        return ','.join(sels) + '{'
    return re.sub(r'([^{}]+)\{', fix, css)


BUNDLES = {
    'site.bundle.css': ['fonts.css', 'styles-light.css', 'light.css', 'sub.css', 'chrome.css'],
    'top.bundle.css': ['fonts.css', 'top.css', 'chrome.css'],
}

for out, parts in BUNDLES.items():
    body = '\n'.join(boost((A / p).read_text('utf-8')) if p == 'light.css' else (A / p).read_text('utf-8') for p in parts)
    (A / out).write_text(f'/* 生成ファイル（scripts/build_css.py）。直接編集しない。元: {", ".join(parts)} */\n' + minify(body), 'utf-8')
    print(out, len(body.encode('utf-8')) // 1024, 'KB ->', (A / out).stat().st_size // 1024, 'KB')
