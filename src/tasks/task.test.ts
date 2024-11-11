import { red } from "colorette";
import { expect, test } from "vitest";
import { z } from "zod";

import { taskUtilities } from "./executeTask.js";
import { task } from "./task.js";

test("task: returns a branded wrapper of the given function", () => {
	const fn = task(() => "ok");
	expect(fn.kind).toBe("task");
	expect(fn({ _: [], env: {} }, taskUtilities)).toBe("ok");
});

test("task: receives positional arguments as `_` property", () => {
	const fn = task(({ _ }) => {
		expect(_.join(".")).toBe("1.2.3");
	});

	fn({ _: ["1", "2", "3"], env: {}, irrelevant: "string" }, taskUtilities);
});

test("task: receives `env` property", () => {
	const fn = task(({ env }) => {
		expect(env).toMatchObject({
			PWD: "/home/sources",
			SHELL: "/bin/bash"
		});
	});

	fn(
		{
			_: ["1", "2", "3"],
			env: {
				PWD: "/home/sources",
				SHELL: "/bin/bash"
			}
		},
		taskUtilities
	);
});

test("task.strict: returns a branded wrapper of the given function", () => {
	const fn = task.strict({}, () => "ok");
	expect(fn.kind).toBe("strictTask");
});

test("task.strict: validates positionals with the given schema", () => {
	const fn = task.strict(
		{
			_: z.array(z.string()).min(1).max(3)
		},
		() => "ok"
	);

	expect(() => fn({ _: ["1", "2"], env: {} }, taskUtilities)).not.toThrow();

	expect(fn({ _: ["1", "2"], env: {} }, taskUtilities)).toBe("ok");

	expect(() => {
		fn({ _: [], env: {} }, taskUtilities);
	}).toThrow("at least 1 element(s)");

	expect(() => {
		fn({ _: ["1", "2", "3", "4"], env: {} }, taskUtilities);
	}).toThrow("at most 3 element(s)");
});

test("task.strict: validates environment variables with the given schema", () => {
	const fn = task.strict(
		{
			env: z.object({
				SOME_FLAG: z
					.string()
					.transform((value) => value.toLowerCase() === "true")
			})
		},
		() => "ok"
	);

	expect(fn({ _: ["1"], env: { SOME_FLAG: "true" } }, taskUtilities)).toBe(
		"ok"
	);

	expect(() => {
		fn(
			{
				_: ["1"],
				// @ts-expect-error env.SOME_FLAG is required
				env: {}
			},
			taskUtilities
		);
	}).toThrow(`${red("Environment variable 'SOME_FLAG'")}: Required`);
});

test("task.strict: validates options with the given schema", () => {
	const fn = task.strict(
		{
			startDate: z.string().date(),
			logLevel: z.number().positive().default(6)
		},
		({ logLevel }) => logLevel
	);

	expect(
		fn({ _: [], env: {}, startDate: "2532-10-10", logLevel: 1 }, taskUtilities)
	).toBe(1);

	expect(fn({ _: [], env: {}, startDate: "2532-10-10" }, taskUtilities)).toBe(
		6
	);

	expect(() => {
		fn(
			// @ts-expect-error --startDate is required
			{
				_: [],
				env: {}
			},
			taskUtilities
		);
	}).toThrow(`${red("--startDate")}: Required`);

	expect(() => {
		fn(
			{
				_: [],
				env: {},
				startDate: "2532-10-10",
				logLevel: -1
			},
			taskUtilities
		);
	}).toThrow(`${red("--logLevel")}: Number must be greater than 0`);
});

test("task.strict: exposes the given schema", () => {
	const fn = task.strict(
		{
			startDate: z.string().date(),
			logLevel: z.number().positive().default(6)
		},
		({ logLevel }) => logLevel
	);

	expect(
		fn.schema.safeParse({
			_: [],
			env: {},
			startDate: "2532-10-10"
		}).data
	).toMatchObject({
		_: [],
		env: {},
		startDate: "2532-10-10",
		logLevel: 6
	});

	expect(
		fn.schema.safeParse({
			_: [],
			env: {},
			startDate: "2532-10-10",
			logLevel: 5
		}).data?.logLevel
	).toBe(5);

	expect(
		fn.schema.safeParse({
			_: [],
			env: {},
			startDate: "2532-10-10"
		}).data?.logLevel
	).toBe(6);

	expect(() => {
		fn.schema.parse({
			_: [],
			env: {},
			startDate: "not a date string"
		});
	}).toThrow();
});
