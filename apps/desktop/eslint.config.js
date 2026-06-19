import config from "@orbit/eslint-config";

export default [
  ...config,
  {
    ignores: ["out/**", "scripts/**"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js", "vite.config.ts", "electron.vite.config.ts"],
        },
      },
    },
  },
];
