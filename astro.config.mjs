// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercelStatic from "@astrojs/vercel/static";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  output: "static",
  adapter: vercelStatic({
    webAnalytics: {
      enabled: true,
    },
    maxDuration: 8,
  }),
});
