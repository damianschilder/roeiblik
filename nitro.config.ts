import { defineNitroConfig } from "nitropack";

export default defineNitroConfig({
  devProxy: {
    "/api/": {
      target: "https://api.beta.regatta.time-team.nl/api/1/",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\//, ""),
    },
  },
});
