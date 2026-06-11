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

export const executeTask = async (context: MainContextWithData, options: ParsedOptions) => {
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
			`Task file '${context.taskFile.name}' does not export '${context.taskName}'`,
			`Resolved to: ${context.taskFile.path}`
		]);
	}

	try {
		const optionsWithEnvironment = {
			...options,
			env: process.env
		};

		const isSpinnerEnabled = !context.config.quiet;
		const pinnedSpinnerRenderInterval = 80;

		if (isSpinnerEnabled) {
			context.handler.spinner.start({
				text: `Running ${specifier}`
			});

			context.handler.spinner.update({
				interval: pinnedSpinnerRenderInterval
			});
		}

		const originalStdoutWrite = Reflect.get(process.stdout, "write");
		const originalStderrWrite = Reflect.get(process.stderr, "write");

		const passthroughStdoutWrite = originalStdoutWrite.bind(process.stdout);
		const passthroughStderrWrite = originalStderrWrite.bind(process.stderr);

		let isSpinnerWrite = false;
		let lastForcedRender = 0;

		const clearPinnedSpinner = () => {
			if (!isSpinnerEnabled) {
				return;
			}

			isSpinnerWrite = true;
			context.handler.spinner.clear();
			isSpinnerWrite = false;
		};

		const renderPinnedSpinner = () => {
			if (!isSpinnerEnabled) {
				return;
			}

			const now = Date.now();

			if (now - lastForcedRender < pinnedSpinnerRenderInterval) {
				return;
			}

			lastForcedRender = now;

			isSpinnerWrite = true;
			context.handler.spinner.spin();
			isSpinnerWrite = false;
		};

		const interceptWrite = (passthroughWrite: typeof process.stdout.write) => {
			return ((
				chunk: string | Uint8Array,
				encoding?: BufferEncoding | ((error?: Error | null) => void),
				callback?: (error?: Error | null) => void
			) => {
				const writeArgs = [chunk, encoding, callback].filter(
					(value): value is Exclude<typeof value, undefined> => value != null
				);

				if (!isSpinnerEnabled || isSpinnerWrite) {
					return Reflect.apply(passthroughWrite, process.stdout, writeArgs) as boolean;
				}

				clearPinnedSpinner();
				const didWrite = Reflect.apply(passthroughWrite, process.stdout, writeArgs) as boolean;
				renderPinnedSpinner();

				return didWrite;
			}) as typeof process.stdout.write;
		};

		process.stdout.write = interceptWrite(passthroughStdoutWrite);
		process.stderr.write = interceptWrite(passthroughStderrWrite);

		try {
			await taskFunction(optionsWithEnvironment, taskUtilities);
		} finally {
			process.stdout.write = originalStdoutWrite;
			process.stderr.write = originalStderrWrite;
		}
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
