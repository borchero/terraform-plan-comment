import typescriptEslint from "@typescript-eslint/eslint-plugin"
import prettier from "eslint-plugin-prettier"
import importPlugin from "eslint-plugin-import"
import promisePlugin from "eslint-plugin-promise"
import nPlugin from "eslint-plugin-n"
import tsParser from "@typescript-eslint/parser"
import js from "@eslint/js"

export default [
  {
    ignores: ["dist/**/*"]
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier,
      import: importPlugin,
      promise: promisePlugin,
      n: nPlugin
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      // Base ESLint rules
      "no-use-before-define": "off",

      // Import plugin rules
      "import/order": "error",

      // Node plugin rules
      "n/no-callback-literal": "off",

      // TypeScript ESLint rules
      ...typescriptEslint.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports"
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          ignoreVoid: false
        }
      ],

      // Prettier rules
      "prettier/prettier": "error"
    }
  }
]
