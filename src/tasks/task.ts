import type { ArkErrors, Type } from "arktype";
import { type } from "arktype";
import { red } from "colorette";

import type {
	BrandedTask,
	BrandedTaskStrict,
	DefaultOptionsInput,
	Task
} from "./types.js";

const formatValidationIssues = (errors: ArkErrors): string =>
	errors
		.map((error) => {
			const propertyName = String(error.path[0]);
			const dottedPath = error.path.join(".");

			if (!propertyName) {
				return error.message;
			}

			const messageWithoutProperty = error.message.startsWith(dottedPath)
				? error.message.slice(dottedPath.length + 1)
				: error.message;

			if (propertyName === "env") {
				const prefix = red(`Environment variable '${String(error.path[1])}'`);
				return `${prefix}: ${messageWithoutProperty}`;
			}

			const optionText =
				propertyName === "_" ? "Positionals" : `--${propertyName}`;

			if (error.code === "predicate" && error.expected === "removed") {
				return `${red(optionText)}: unknown option`;
			}

			// we currently assume there is only ever one path segment
			return `${red(optionText)}: ${messageWithoutProperty}`;
		})
		.join("\n");

export const task = <T = DefaultOptionsInput>(fn: Task<T>): BrandedTask<T> => {
	(fn as BrandedTask<T>).kind = "task";
	return fn as BrandedTask<T>;
};

/**
 * Default schema for the options received by a {@link task}.
 */
export const defaultOptionsInput = type({
	_: "string[]",
	env: "Record<string, string | undefined>"
});

/**
 * Create a task that validates its input against a schema.
 */
task.strict = <const TShape>(
	shape: type.validate<TShape>,
	fn: Task<NoInfer<Type<type.infer<TShape>>["infer"]>>
): BrandedTaskStrict<Type<type.infer<TShape>>["inferIn"]> => {
	const schema = defaultOptionsInput
		.merge(type.raw(shape))
		.onUndeclaredKey("reject");

	const taskFunction: ReturnType<typeof task.strict<TShape>> = (
		options,
		utilities
	) => {
		const validationResult = schema(options);

		if (validationResult instanceof type.errors) {
			throw new TypeError(formatValidationIssues(validationResult), {
				cause: validationResult
			});
		}

		return fn(validationResult as never, utilities);
	};

	taskFunction.kind = "strictTask";
	taskFunction.schema = schema as never;

	return taskFunction;
};
