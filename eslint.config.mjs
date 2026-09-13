import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
	{
		ignores: ["main.js", "node_modules/**", "tools/**"],
	},
	...obsidianmd.configs.recommended,
	{
		// Build script, not plugin code: it runs under Node by design.
		files: ["esbuild.config.mjs"],
		rules: {
			"obsidianmd/no-nodejs-modules": "off",
		},
	},
	{
		files: ["src/**/*.ts"],
		extends: [...tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
);
