import { fileURLToPath } from "node:url";

import { getEslintConfig } from "@haltcase/style/eslint";

const toPackagePath = (filePath: string) =>
	fileURLToPath(new URL(filePath, import.meta.url));

const project = [toPackagePath("tsconfig.json")];

export default [
	{
		ignores: ["scripts"],
	},

	...getEslintConfig({
		node: true,
		typescriptProject: project,
	}),

	{
		rules: {
			"unicorn/no-process-exit": "off",
		},
	},
];
