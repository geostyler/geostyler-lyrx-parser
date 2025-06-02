import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "tests/**/*.spec.ts"], // <- Add this line
    globals: true,
    environment: "jsdom",
  },
});
