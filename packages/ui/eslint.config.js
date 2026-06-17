import config from "@orbit/eslint-config/react";

export default [
  ...config,
  {
    files: ["src/components/**/*.tsx", "src/hooks/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-import-type-side-effects": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
