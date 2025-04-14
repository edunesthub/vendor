import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        console: "readonly", // Allow console
      },
    },
    rules: {
      "quotes": ["error", "double"],
      "indent": ["error", 2],
      "max-len": ["error", { "code": 100 }],
      "comma-dangle": ["error", "always-multiline"],
      "arrow-parens": ["error", "always"],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }], // Allow unused args like _context
      "semi": ["error", "always"],
    },
  },
];