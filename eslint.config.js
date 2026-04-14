import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "dist-verify/**",
      "node_modules/**",
      "public/vendor/**",
      "src/legacy/**",
      "legacy/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/site/**/*.{ts,tsx}", "src/api.ts", "vite.config.ts", "config/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": ["error", { allow: ["error"] }]
    }
  },
  {
    files: ["src/site/lib/inputSafety.ts", "src/site/lib/security.ts"],
    rules: {
      "no-control-regex": "off"
    }
  },
  {
    files: ["src/site/entry.tsx", "src/site/providers/AppProviders.tsx"],
    rules: {
      "react-refresh/only-export-components": "off"
    }
  }
);
