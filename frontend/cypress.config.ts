import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(_on, _config) {},
  },
});
