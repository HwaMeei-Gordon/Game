# THE TOWER · 無盡塔防

一款單人塔防 roguelite：你是場地正中央的塔，敵人從四面八方湧入，靠擊殺賺金幣即時強化，死亡後用鑽石在「技能地圖」做永久強化。使用 React + HTML Canvas，純前端、可離線遊玩。

## 在瀏覽器上玩（GitHub Pages）

本專案內含自動部署設定（`.github/workflows/deploy.yml`）。啟用一次即可：

1. 進入 Repo → **Settings → Pages**
2. **Build and deployment → Source** 選 **GitHub Actions**
3. 之後每次 push 到 `main`，都會自動 build 並發佈到
   `https://<你的帳號>.github.io/<repo>/`

> 注意：目前開發在分支 `claude/tower-defense-game-wMEvt`，Pages 只會部署 `main`。要上線請先把分支合併進 `main`。

## 本機開發

```bash
npm install
npm run dev      # 本機開發伺服器
npm run build    # 產出 dist/（Pages 部署用）
npm run preview  # 預覽 build 結果
```

## 文件

- **[DESIGN.md](./DESIGN.md)** — 完整的遊戲機制、數值、存檔格式、架構與設計理念說明（供開發者與 AI 閱讀）。
- **[changelog/](./changelog/)** — 變更紀錄區，一筆變更一個檔案。

## 架構（模組化）

程式碼依「各司其職」拆分：入口、畫面、資料、機制、戰鬥、渲染、紀錄各自獨立，細節見 `DESIGN.md`。
