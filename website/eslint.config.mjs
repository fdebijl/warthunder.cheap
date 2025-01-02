import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        'Chart': 'readonly'
      }
    }
  },
  pluginJs.configs.recommended,
  {
    ignores: [
      "src/js/lib/**/*.js"
    ]
  }
];
