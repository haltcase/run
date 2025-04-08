import { readdirSync } from "node:fs";
import { extname } from "node:path";

import { Spinner } from "@favware/colorette-spinner";
import cliui from "@isaacs/cliui";
import { bold, gray, yellow } from "colorette";

import type { AppConfig } from "../config.js";
import { isBrandedTask } from "../tasks/guards.js";
import { getSchemaProperties } from "../util/getSchemaProperties.js";
import { extensions } from "../util/resolveTaskFile.js";
import type { MainContextWithData } from "./main.js";

export const failWith = (spinner: Spinner, message: unknown): never => {
	let text: string | undefined;

	if (Array.isArray(message)) {
		text = message.map(String).join("\n");
	}

	if (text == null || typeof text !== "string") {
		text = String(message);
	}

	spinner.error({
		text
	});

	process.exit(1);
};

export const write = (message: string) => {
	process.stdout.write(`${message}\n`);
};

const usage = `Usage: ${yellow("hr")} <taskFile> [task]`;

interface HelpContextCommand {
	command: string;
}

interface HelpContextFile {
	taskFileList: true;
	config: AppConfig;
}

interface HelpContextScript extends MainContextWithData {
	taskList: true;
}

type HelpContext = HelpContextCommand | HelpContextFile | HelpContextScript;

export const commandHandler = (_context: HelpContextCommand): string => {
	return usage;
};

export const taskFileListHandler = (context: HelpContextFile): string => {
	const fileList = readdirSync(context.config.taskDirectory).filter((file) =>
		extensions.includes(extname(file) as (typeof extensions)[number])
	);

	const content = [
		usage,
		"Available task files:",
		fileList.map((it) => `  ${it}`).join("\n")
	].join("\n\n");

	return `${content}\n`;
};

export const taskListHandler = (context: HelpContextScript): string => {
	const ui = cliui({
		width: Math.max(0, process.stdout.columns - 4),
		wrap: true
	});

	const { config } = context.taskFile.data;

	const baseUsage = usage.replace("<taskFile>", context.taskFile.name);

	ui.div(`${baseUsage} <parameter> [...options]`);

	ui.div({
		text: "Available tasks:",
		padding: [1, 0, 1, 0]
	});

	const taskListPaddingX = 2;
	const nameColumnWidth =
		Object.keys(config).reduce(
			(previous, current) => Math.max(previous, current.length),
			1
		) +
		2 +
		taskListPaddingX * 2;

	for (const [name, value] of Object.entries(config)) {
		if (!value) {
			continue;
		}

		const formattedName = bold(name);

		if (isBrandedTask(value)) {
			if (value.kind === "strictTask") {
				const properties =
					getSchemaProperties(value.schema) || gray("not available");

				ui.div(
					{
						text: formattedName,
						width: nameColumnWidth,
						padding: [0, taskListPaddingX, 0, taskListPaddingX]
					},
					properties
				);

				continue;
			}

			ui.div({
				text: formattedName,
				width: nameColumnWidth,
				padding: [0, taskListPaddingX, 0, taskListPaddingX]
			});

			continue;
		}

		ui.div({
			text: formattedName,
			width: nameColumnWidth,
			padding: [0, taskListPaddingX, 0, taskListPaddingX]
		});
	}

	ui.div("");

	return ui.toString();
};

export const help = (context: HelpContext): string => {
	if ("command" in context) {
		return commandHandler(context);
	}

	if ("taskFileList" in context) {
		return taskFileListHandler(context);
	}

	if ("taskList" in context) {
		return taskListHandler(context);
	}

	return "";
};

export interface Handler {
	spinner: Spinner;
	help: (context: HelpContext) => string;
	write: (message: string) => void;
	failWith: (message: unknown) => never;
}

export const createHandler = (): Handler => {
	const spinner = new Spinner();

	return {
		spinner,
		help,
		write,
		failWith: (message: unknown) => failWith(spinner, message)
	};
};
