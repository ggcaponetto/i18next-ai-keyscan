import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";


export default [
    stylistic.configs["all-flat"],
    {
        ...pluginJs.configs.recommended,
        "files": [
            "*.jsx",
            "*.js",
            "*.mjs"
        ],
        "languageOptions": {
            "globals": {
                ...globals.mocha,
                ...globals.node,
                ...globals.es2021,
                ...globals.browser
            },
            "ecmaVersion": "latest",
            "sourceType": "module"
        },
        "rules": {
            "no-unused-vars": "error",
            "no-undef": "error",
            "@stylistic/semi": "error"
        }
    }
];
