import { join } from "node:path";

import { $, execa } from "execa";

import type { MainContextWithData } from "../cli/main.js";
import type { ParsedOptions } from "../cli/parseOptions.js";
import type { TaskUtilities } from "./types.js";

const execaInherited = execa({
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit"
}) satisfies TaskUtilities["exec"];

export const taskUtilities = {
	command: execa,
	$,
	exec: execaInherited
} satisfies TaskUtilities;

export const executeTask = async (
	context: MainContextWithData,
	options: ParsedOptions
) => {
	const taskFunction = context.taskFile.data.config[context.taskName];
	const specifier = `${context.taskFile.name}::${context.taskName}`;

	if (taskFunction == null) {
		context.handler.write(
			context.handler.help({
				taskList: true,
				...context
			})
		);

		if (!context.taskName) {
			context.handler.failWith(`Task name is required.`);
		}

		context.handler.failWith([
			`Task file '${context.taskFile.base}' does not export '${context.taskName}'`,
			`Resolved to: ${join(context.taskFile.dir, context.taskFile.base)}`
		]);
	}

	try {
		const optionsWithEnvironment = {
			...options,
			env: process.env
		};

		await taskFunction(optionsWithEnvironment, taskUtilities);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		if (message.includes("is not a function")) {
			context.handler.failWith([
				`Failed to execute ${specifier}`,
				`Exported value '${context.taskName}' is not a function`
			]);
		}

		context.handler.failWith([`Failed to execute ${specifier}`, message]);
	}
};
