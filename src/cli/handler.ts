import { Spinner } from "@favware/colorette-spinner";
import cliui from "@isaacs/cliui";
import { bold, yellow } from "colorette";

import { isBrandedTask } from "../tasks/guards.js";
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

const usage = `Usage: ${yellow("hr")} <action> [task]`;

interface HelpContextCommand {
	command: string;
}

interface HelpContextScript extends MainContextWithData {
	taskList: true;
}

type HelpContext = HelpContextCommand | HelpContextScript;

export const commandHandler = (_context: HelpContextCommand): string => {
	return usage;
};

export const taskListHandler = (context: HelpContextScript): string => {
	const ui = cliui({
		width: Math.max(0, process.stdout.columns - 4),
		wrap: true
	});

	const { config } = context.taskFile.data;
	const taskInfo = Object.entries(config)
		.map(([name, value]) => {
			if (!value) {
				return "";
			}

			const formattedName = bold(name);

			if (isBrandedTask(value)) {
				if (value.kind === "strictTask") {
					const keys = Object.keys(value.inputSchema).join(", ");
					const { description = "" } = value.schema;

					return [formattedName, keys && `{ ${keys} }`, description]
						.filter(Boolean)
						.join("\t");
				}

				return formattedName;
			}

			return formattedName;
		})
		.join("\n");

	ui.div(usage.replace("<action>", context.taskFile.name));

	ui.div({
		text: "Available tasks:",
		padding: [1, 0, 1, 0]
	});

	ui.div({
		text: taskInfo,
		padding: [0, 2, 1, 2]
	});

	return ui.toString();
};

export const help = (context: HelpContext): string => {
	if ("command" in context) {
		return commandHandler(context);
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
