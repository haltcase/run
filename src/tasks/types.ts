import type { ExecaMethod, ExecaScriptMethod } from "execa";
import type { z } from "zod";

import type { ParsedOptions } from "../cli/parseOptions.js";

export interface TaskUtilities {
	/**
	 * Run a command using Execa's
	 * {@link https://github.com/sindresorhus/execa/blob/main/docs/scripts.md|script mode}.
	 *
	 * @example
	 * ```ts
	 * const { stdout } = await $`echo ${"hello"}`;
	 * console.log(`stdout = ${stdout}`);
	 * ```
	 *
	 * @see {@link https://github.com/sindresorhus/execa/blob/main/docs/execution.md#%EF%B8%8F-basic-execution|Execa docs}
	 */
	$: ExecaScriptMethod;

	/**
	 * Run a command using {@link https://github.com/sindresorhus/execa|Execa}
	 * (e.g., shell command or script).
	 *
	 * @example
	 * ```ts
	 * const { stdout } = await execa`echo 'hello'`;
	 * console.log(stdout);
	 * ```
	 *
	 * @see {@link https://github.com/sindresorhus/execa/blob/main/docs/execution.md#%EF%B8%8F-basic-execution|Execa docs}
	 */
	command: ExecaMethod;

	/**
	 * Same as `command`, but inherits the parent process' stdio streams by
	 * default, i.e., logs and errors will be sent directly to the terminal.
	 * Use `command` or `$` if you want to capture the output instead.
	 */
	exec: ExecaMethod<{
		stdin: "inherit";
		stdout: "inherit";
		stderr: "inherit";
	}>;
}

export type CustomShape = Record<string, z.ZodTypeAny>;

// allow `any` type here which allows type inference to work
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SchemaInput {
	_: z.ZodType<any, z.ZodTypeDef, string[]>;
	env: z.ZodType<any, z.ZodTypeDef, Record<string, string | undefined>>;
	[key: string]: z.ZodTypeAny;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface SchemaDefaults {
	_: z.ZodArray<z.ZodString>;
	env: z.ZodObject<Record<string, z.ZodOptional<z.ZodString>>>;
}

export type DefaultOptionsInput = ParsedOptions & {
	env: Record<string, string | undefined>;
};

export type TaskCollection = Partial<Record<string, Task>>;

export type Task<TOptions = DefaultOptionsInput> = (
	options: TOptions,
	utilities: TaskUtilities
) => unknown;

export type BrandedTaskStrict<
	TSchema extends z.ZodTypeAny = z.ZodType<DefaultOptionsInput>
> = Task<z.input<TSchema>> & {
	kind: "strictTask";
	schema: TSchema;
};

export type BrandedTaskLoose<TOptions = DefaultOptionsInput> =
	Task<TOptions> & {
		kind: "task";
		schema: never;
	};

export type BrandedTask<TOptions = DefaultOptionsInput> =
	| BrandedTaskLoose<TOptions>
	| BrandedTaskStrict<z.ZodType<TOptions>>;
