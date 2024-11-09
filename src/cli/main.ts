import type { ParsedPath } from "node:path";
import { parse, resolve } from "node:path";

import type { AppConfig } from "../config.js";
import { getAppConfig } from "../config.js";
import { executeTask } from "../tasks/executeTask.js";
import type { TaskCollection } from "../tasks/types.js";
import type { ResolvedConfigWithFile } from "../util/loadTaskFile.js";
import { loadTaskFile } from "../util/loadTaskFile.js";
import { resolveTaskFile } from "../util/resolveTaskFile.js";
import type { Handler } from "./handler.js";
import { parseOptions } from "./parseOptions.js";

export interface MainProps {
	handler: Handler;
}

export interface MainContext extends MainProps {
	config: AppConfig;
	taskFile: ParsedPath & {
		path: string;
	};
	taskName: string;
}

export interface MainContextWithData extends MainContext {
	taskFile: MainContext["taskFile"] & {
		data: ResolvedConfigWithFile<TaskCollection>;
	};
}

export const main = async (props: MainProps) => {
	const { config } = await getAppConfig();

	const inputFileName = process.argv[2];
	const taskName = process.argv[3] ?? "";

	if (!inputFileName) {
		props.handler.write(
			props.handler.help({
				taskFileList: true,
				config
			})
		);

		props.handler.failWith("Task file name is required");
	}

	const fullFilePath = resolve(config.taskDirectory, inputFileName);

	const context = {
		...props,
		config,
		taskFile: {
			...parse(fullFilePath),
			path: fullFilePath
		},
		taskName
	} satisfies MainContext;

	const resolutions = resolveTaskFile(context);

	if (Array.isArray(resolutions)) {
		props.handler.failWith([
			`Found multiple task files with the name '${context.taskFile.name}'`,
			`Rename the ambiguous files or specify an extension and try again`,
			resolutions.map((it) => `  ${it}`).join("\n")
		]);
	}

	const taskFileResult = await loadTaskFile(context);

	if (!taskFileResult.ok) {
		props.handler.failWith(taskFileResult.error);
	}

	const contextWithData = {
		...context,
		taskFile: {
			...context.taskFile,
			data: taskFileResult.value
		}
	} satisfies MainContextWithData;

	try {
		const options = parseOptions(process.argv.slice(4));
		await executeTask(contextWithData, options);

		if (!config.quiet) {
			props.handler.spinner.success({
				text: "Success"
			});
		}
	} catch (error) {
		props.handler.failWith([`Failed to execute task`, String(error)]);
	}
};
