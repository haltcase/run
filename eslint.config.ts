import { join } from "node:path";

import { getEslintConfig } from "@haltcase/style/eslint";

const toPackagePath = (filePath: string) => join(import.meta.dirname, filePath);

const project = [toPackagePath("tsconfig.json")];

export default [
	{
		ignores: ["scripts"]
	},

	...getEslintConfig({
		node: true,
		typescriptProject: project
	}),

	{
		rules: {
			"unicorn/no-process-exit": "off"
		}
	}
];
