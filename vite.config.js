import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "./static", // point to your frontend folder
  build: {
    outDir: "../dist", // matches Forge structure
    emptyOutDir: true,
  },
  plugins: [react()],
});
