import config from "@orbit/eslint-config";

export default [
  ...config,
  {
    ignores: [".react-router/**", "out/**", "scripts/**"],
  },
  {
    files: ["src/renderer/routes/**"],
    rules: {
      "unicorn/filename-case": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.js",
            "vite.config.ts",
            "electron.vite.config.ts",
            "react-router.config.ts",
          ],
        },
      },
    },
  },
];
