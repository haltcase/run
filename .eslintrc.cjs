"use strict";

const { resolve } = require("node:path");

const [off] = [0, 1, 2];

const project = [resolve(__dirname, "tsconfig.json")];

module.exports = {
	root: true,
	env: {
		node: true
	},
	extends: [
		require.resolve("@haltcase/style/eslint/node"),
		require.resolve("@haltcase/style/eslint/typescript")
	],
	parserOptions: {
		project: true,
		tsconfigRootDir: __dirname
	},
	settings: {
		"import/resolver": {
			typescript: {
				project
			}
		}
	},
	rules: {
		"unicorn/no-process-exit": off
	}
};
