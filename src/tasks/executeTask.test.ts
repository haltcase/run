import { expect, test, vi } from "vite-plus/test";

import type { MainContextWithData } from "../cli/main.js";
import type { ParsedOptions } from "../cli/parseOptions.js";
import { executeTask } from "./executeTask.js";

test("executeTask: keeps spinner pinned while piping stdout and stderr", async () => {
	const start = vi.fn();
	const update = vi.fn();
	const clear = vi.fn();
	const spin = vi.fn();
	const stdoutWrite = vi.spyOn(process.stdout, "write");
	const stderrWrite = vi.spyOn(process.stderr, "write");

	const context = {
		config: {
			quiet: false
		},
		taskName: "build",
		taskFile: {
			name: "tasks",
			path: "/tmp/tasks.ts",
			data: {
				config: {
					build: () => {
						process.stdout.write("first line\n");
						process.stderr.write("problem details\n");
					}
				}
			}
		},
		handler: {
			spinner: {
				start,
				update,
				clear,
				spin
			},
			help: () => "",
			write: () => {
				// nothing
			},
			failWith: (message: unknown): never => {
				throw new Error(String(message));
			}
		}
	} as unknown as MainContextWithData;

	const options = { _: [] } satisfies ParsedOptions;

	await executeTask(context, options);

	expect(start).toHaveBeenCalledWith({
		text: "Running tasks::build"
	});
	expect(update).toHaveBeenCalledWith({
		interval: 80
	});
	expect(spin).toHaveBeenCalled();
	expect(clear).toHaveBeenCalled();
	expect(stdoutWrite).toHaveBeenCalledWith("first line\n");
	expect(stderrWrite).toHaveBeenCalledWith("problem details\n");
});
