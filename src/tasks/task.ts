import { red } from "colorette";
import { z } from "zod";
import type { MessageBuilder } from "zod-validation-error";
import { fromZodError } from "zod-validation-error";

import type { Defined, Merge } from "../util/types.js";
import type {
	BrandedTask,
	BrandedTaskStrict,
	DefaultOptionsInput,
	SchemaDefaults,
	SchemaInput,
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

			if (propertyName === "env") {
				const prefix = red(`Environment variable '${issue.path[1]}'`);
				return `${prefix}: ${issue.message}`;
			}

			const optionText =
				propertyName === "_" ? "Positionals" : `--${propertyName}`;

			// we currently assume there is only ever one path segment
			return `${red(optionText)}: ${issue.message}`;
		})
		.join("\n");

export const task = <T = DefaultOptionsInput>(fn: Task<T>): BrandedTask<T> => {
	(fn as BrandedTask<T>).kind = "task";
	return fn as BrandedTask<T>;
};

task.strict = <
	TShape extends Partial<SchemaInput>,
	TSchema extends z.ZodObject<
		Merge<SchemaDefaults, Defined<TShape>>
	> = z.ZodObject<Merge<SchemaDefaults, Defined<TShape>>>
>(
	shape: TShape,
	fn: Task<z.input<TSchema>>
): BrandedTaskStrict<z.input<TSchema>> => {
	const defaultValidators = {
		_: z.string().array(),
		env: z.object({}).passthrough()
	};

	const schema = z.strictObject({
		...defaultValidators,
		...(shape as Defined<TShape>)
	});

	const taskFunction: BrandedTaskStrict<z.input<TSchema>> = (
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
