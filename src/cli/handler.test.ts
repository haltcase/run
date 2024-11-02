import { expect, test, vi } from "vitest";

import { createHandler } from "./handler.js";

const handler = createHandler();

const stdoutSpy = vi.spyOn(globalThis.process.stdout, "write");
const stderrSpy = vi.spyOn(globalThis.process.stderr, "write");
const exitSpy = vi.spyOn(globalThis.process, "exit");

test("handler: writes to stdout", () => {
	const stdout = stdoutSpy.mockImplementationOnce(() => true);
	const message = "Success";
	handler.write(message);
	expect(stdout).toHaveBeenCalledWith(`${message}\n`);
});

test("handler: writes to stderr and exits", () => {
	const stderr = stderrSpy.mockImplementationOnce(() => true);
	// @ts-expect-error we can't actually return never
	const exit = exitSpy.mockImplementationOnce(() => {
		// nothing
	});

	handler.failWith("Error message");

	expect(stderr).toHaveBeenCalled();
	expect(exit).toHaveBeenCalled();
});
