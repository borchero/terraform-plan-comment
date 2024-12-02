import typescriptEslint from "@typescript-eslint/eslint-plugin"
import prettier from "eslint-plugin-prettier"
import tsParser from "@typescript-eslint/parser"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  {
    ignores: ["dist/**/*"]
  },
  ...compat.extends("standard", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "script",

      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      "import/order": "error",
      "no-use-before-define": "off",
      "n/no-callback-literal": "off",
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
      "prettier/prettier": "error"
    }
  }
]
