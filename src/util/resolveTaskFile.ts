import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { SUPPORTED_EXTENSIONS } from "c12";

import type { MainContext } from "../cli/main.js";

export const extensions = SUPPORTED_EXTENSIONS.filter(
	(extension) => extension.endsWith("js") || extension.endsWith("ts")
);

export const resolveTaskFile = (context: MainContext): string | string[] => {
	if (context.taskFile.ext) {
		return resolve(context.taskFile.dir, context.taskFile.name);
	}

	const foundConfigs = extensions
		.map((it) => join(context.taskFile.dir, `${context.taskFile.name}${it}`))
		.filter((path) => existsSync(path));

	if (foundConfigs.length === 1) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return foundConfigs[0]!;
	}

	return foundConfigs;
};
