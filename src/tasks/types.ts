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

export interface ExpectShape {
	_: z.ZodArray<z.ZodTypeAny>;
	[key: string]: z.ZodTypeAny;
}

export type TaskCollection = Partial<Record<string, Task>>;

export type Task<TOptions = ParsedOptions> = (
	options: TOptions,
	utilities: TaskUtilities
) => unknown;

export type BrandedTaskStrict<TOptions = ParsedOptions> = Task<TOptions> & {
	kind: "strictTask";
	inputSchema: ExpectShape;
	schema: z.ZodType<TOptions>;
};

export type BrandedTaskLoose<TOptions = ParsedOptions> = Task<TOptions> & {
	kind: "task";
	schema: never;
};

export type BrandedTask<TOptions = ParsedOptions> =
	| BrandedTaskLoose<TOptions>
	| BrandedTaskStrict<TOptions>;
