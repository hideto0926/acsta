# アクスタ箱 / Acsta Box — Web

アプリの紹介ページ（日英切り替え）とプライバシーポリシー。

- `index.html` … トップ。ヒーローは three.js の 3D 棚。WebGL が使えないときはアイコン画像に切り替わる
- `hero3d.js` … 3D 棚のもと。**変えたら `python3 Tools/build_web.py`（app_acsta で実行）で index.html に埋め込み直す**（アクスタの形・画像も一緒に埋め込むので、index.html を直接開いても 3D が出る）
- `privacy.html` … プライバシーポリシー（`?lang=en` で英語から開ける）。App Store Connect の「プライバシーポリシー URL」に使う
- `assets/stands/` … 3D のアクスタの形（アプリの Demo と同じ切り抜き。単位はメートル）
- `assets/shots/` … アプリの素の画面（`AppStore/raw` を幅 600 の JPEG にしたもの。枠は CSS で付ける）

## 手元で見る

```sh
cd web && python3 -m http.server 8765
# → http://localhost:8765/
```

（index.html を直接ダブルクリックで開いても見られる）

## 公開（GitHub Pages）

1. この `web` フォルダの中身をリポジトリ（例: `hideto0926/acsta`）の `main` ブランチ直下に置いて push
2. Settings → Pages → Branch: `main` / `/ (root)`
3. `https://hideto0926.github.io/acsta/` と `…/acsta/privacy.html` を App Store Connect に登録

`.nojekyll` は Jekyll の変換を止めるためのもの（消さない）。
App Store のリンクは公開後に `index.html` の App Store ボタンの `href` を差し替える。
