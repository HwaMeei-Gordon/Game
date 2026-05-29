import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base 使用相對路徑 './'，這樣不論部署在 GitHub Pages 的
// https://<user>.github.io/<repo>/ 子路徑，或本機 dev，資源都能正確載入。
export default defineConfig({
  base: "./",
  plugins: [react()],
});
