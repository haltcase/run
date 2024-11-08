import { red } from "colorette";
import { z } from "zod";
import type { MessageBuilder } from "zod-validation-error";
import { fromZodError } from "zod-validation-error";

import type { ParsedOptions } from "../cli/parseOptions.js";
import type {
	BrandedTask,
	BrandedTaskStrict,
	ExpectShape,
	Task
} from "./types.js";

const zodMessageBuilder: MessageBuilder = (issues) =>
	issues
		.map((issue) => {
			const propertyName = issue.path[0];

			if (issue.code === "unrecognized_keys") {
				const keyList = issue.keys.map((key) => `--${key}`).join(", ");
				return `${red("Unrecognized options")}: ${keyList}`;
			}

			if (!propertyName) {
				return issue.message;
			}

			const optionText =
				propertyName === "_" ? "Positionals" : `--${propertyName}`;

			// we currently assume there is only ever one path segment
			return `${red(optionText)}: ${issue.message}`;
		})
		.join("\n");

export const task = <T = ParsedOptions>(fn: Task<T>): BrandedTask<T> => {
	(fn as BrandedTask<T>).kind = "task";
	return fn as BrandedTask<T>;
};

task.strict = <
	TShape extends ExpectShape,
	TSchema extends z.ZodObject<TShape> = z.ZodObject<TShape>
>(
	shape: TShape,
	fn: Task<z.infer<TSchema>>
): BrandedTask<z.infer<TSchema>> => {
	const schema = z.strictObject(shape);

	const taskFunction: BrandedTaskStrict<z.infer<TSchema>> = (
		options,
		utilities
	) => {
		const { data, success, error } = schema.safeParse(options);

		if (!success) {
			throw new Error(
				fromZodError(error, { messageBuilder: zodMessageBuilder }).message,
				{
					cause: error
				}
			);
		}

		return fn(data as z.infer<TSchema>, utilities);
	};

	taskFunction.kind = "strictTask";
	taskFunction.schema = schema;
	taskFunction.inputSchema = shape;

	return taskFunction;
};
