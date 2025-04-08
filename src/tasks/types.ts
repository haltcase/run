import type { Type } from "arktype";
import type { ExecaMethod, ExecaScriptMethod } from "execa";

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

export type DefaultOptionsInput = ParsedOptions & {
	env: Record<string, string | undefined>;
};

export type TaskCollection = Partial<Record<string, Task>>;

type MergePositionals<TOptions> = "_" extends keyof TOptions
	? TOptions
	: TOptions & ParsedOptions;

type MergeEnvironment<TOptions> = "env" extends keyof TOptions
	? TOptions
	: TOptions & Pick<DefaultOptionsInput, "env">;

export type Task<TOptions = unknown> = (
	options: MergePositionals<MergeEnvironment<TOptions>>,
	utilities: TaskUtilities
) => unknown;

export type BrandedTaskStrict<TShape = DefaultOptionsInput> = Task<TShape> & {
	kind: "strictTask";
	schema: Type<TShape>;
};

export type BrandedTaskLoose<TOptions = unknown> = Task<TOptions> & {
	kind: "task";
	schema: never;
};

export type BrandedTask<TOptions = unknown> =
	| BrandedTaskLoose<TOptions>
	| BrandedTaskStrict<TOptions>;
