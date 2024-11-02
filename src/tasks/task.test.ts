import { expect, test } from "vitest";
import { z } from "zod";

import { taskUtilities } from "./executeTask.js";
import { task } from "./task.js";

test("task: returns a branded wrapper of the given function", () => {
	const fn = task(() => "ok");
	expect(fn.kind).toBe("task");
	expect(fn({ _: [] }, taskUtilities)).toBe("ok");
});

test("task.strict: validates options with the given schema", () => {
	const fn = task.strict(
		{
			_: z.array(z.string()).min(1).max(3)
		},
		() => "ok"
	);

	expect(fn.kind).toBe("strictTask");

	expect(() => {
		fn({ _: [] }, taskUtilities);
	}).toThrow("at least 1 element(s)");

	expect(() => {
		fn({ _: ["1", "2", "3", "4"] }, taskUtilities);
	}).toThrow("at most 3 element(s)");

	expect(() => {
		fn({ _: ["1", "2"] }, taskUtilities);
	}).not.toThrow();
});
