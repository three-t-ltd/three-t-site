"""サイトで使っている文字だけを切り出した日本語フォント（woff2）を作り直す。

新しいコラムを追加して、今までに無い漢字が増えたら実行する（しないと、その字だけ別のフォントで表示される）。
  python scripts/subset_fonts.py
- 元のフォント（Zen Maru Gothic / Zen Kaku Gothic New、SIL OFL 1.1）は google/fonts から一時フォルダに取得する
- 出力: assets/fonts/*.woff2（読み込みは assets/fonts.css）
- 必要: pip install fonttools brotli
"""
import html, json, pathlib, re, subprocess, tempfile, urllib.request

R = pathlib.Path(__file__).resolve().parent.parent
OUT = R / 'assets' / 'fonts'
SRC = {
    'ZenMaruGothic-Bold': 'zenmarugothic/ZenMaruGothic-Bold.ttf',
    'ZenMaruGothic-Black': 'zenmarugothic/ZenMaruGothic-Black.ttf',
    'ZenKakuGothicNew-Regular': 'zenkakugothicnew/ZenKakuGothicNew-Regular.ttf',
    'ZenKakuGothicNew-Bold': 'zenkakugothicnew/ZenKakuGothicNew-Bold.ttf',
}

def site_chars():
    chars = set()
    for f in list(R.glob('*.html')) + list((R / 'column').glob('*.html')):
        s = f.read_text('utf-8')
        s = re.sub(r'<script(?![^>]*ld\+json).*?</script>|<style.*?</style>', '', s, flags=re.S)
        chars |= set(html.unescape(re.sub(r'<[^>]+>', ' ', s)))
    blog = R / 'assets' / 'blog.json'
    if blog.exists():
        for p in json.loads(blog.read_text('utf-8')): chars |= set(p.get('title', ''))
    chars |= {chr(c) for c in range(0x20, 0x7f)} | {chr(c) for c in range(0x3000, 0x3100)} | {chr(c) for c in range(0xff01, 0xff5f)}
    return ''.join(sorted(chars))

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        (tmp / 'chars.txt').write_text(site_chars(), 'utf-8')
        for name, path in SRC.items():
            ttf = tmp / f'{name}.ttf'
            urllib.request.urlretrieve(f'https://github.com/google/fonts/raw/main/ofl/{path}', ttf)
            subprocess.run(['pyftsubset', str(ttf), f'--text-file={tmp / "chars.txt"}', '--flavor=woff2',
                            '--layout-features=*', f'--output-file={OUT / (name + ".woff2")}'], check=True)
            print(name, (OUT / (name + '.woff2')).stat().st_size // 1024, 'KB')

if __name__ == '__main__':
    main()
