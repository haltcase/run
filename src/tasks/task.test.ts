import { type } from "arktype";
import { red } from "colorette";
import { expect, expectTypeOf, test } from "vitest";

import { taskUtilities } from "./executeTask.js";
import { task } from "./task.js";

test("task: returns a branded wrapper of the given function", () => {
	const fn = task(() => "ok");
	expect(fn.kind).toBe("task");
	expect(fn({ _: [], env: {} }, taskUtilities)).toBe("ok");
});

test("task: receives positional arguments as `_` property", () => {
	const fn = task(({ _ }) => {
		expectTypeOf(_).toEqualTypeOf<string[]>();

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

test("task.strict: `_` and `env` have default types if not specified", () => {
	const fn = task.strict({}, ({ _, env }) => {
		expectTypeOf(_).toEqualTypeOf<string[]>();
		expectTypeOf(env).toEqualTypeOf<Record<string, string | undefined>>();

		return Array.isArray(_) && Boolean(env);
	});

	expect(fn({ _: [], env: {} }, taskUtilities)).toBe(true);
	expect(fn({ _: ["1"], env: {} }, taskUtilities)).toBe(true);
	expect(fn({ _: [], env: { SHELL: "bash" } }, taskUtilities)).toBe(true);
	expect(fn({ _: ["1"], env: { SHELL: "bash" } }, taskUtilities)).toBe(true);

	// type only specified for `_`
	task.strict({ _: "string[]" }, ({ _, env }) => {
		expectTypeOf(_).toEqualTypeOf<string[]>();
		expectTypeOf(env).toEqualTypeOf<Record<string, string | undefined>>();
		expectTypeOf(env.UNKNOWN_FIELD_BUT_OK).toEqualTypeOf<string | undefined>();
	});

	// type only specified for `env`
	task.strict({ env: { SOME_FLAG: "string" } }, ({ _, env }) => {
		expectTypeOf(env.SOME_FLAG).toEqualTypeOf<string>();
		expectTypeOf(env).not.toHaveProperty("UNKNOWN_FIELD");

		// @ts-expect-error -- UNKNOWN_FIELD is not in the schema
		env.UNKNOWN_FIELD;
	});
});

test("task.strict: `_` and `env` types can be overridden", () => {
	task.strict(
		{
			// these types don't make sense, but they are just for testing
			_: "number",
			env: "number"
		},
		({ _, env }) => {
			expectTypeOf(_).toEqualTypeOf<number>();
			expectTypeOf(env).toEqualTypeOf<number>();
		}
	);
});

test("task.strict: validates positionals with the given schema", () => {
	const fn = task.strict(
		{
			_: "0 < string[] <= 3"
		},
		() => "ok"
	);

	expect(() => fn({ _: ["1", "2"], env: {} }, taskUtilities)).not.toThrow();

	expect(fn({ _: ["1", "2"], env: {} }, taskUtilities)).toBe("ok");

	expect(() => {
		fn({ _: [], env: {} }, taskUtilities);
	}).toThrow("must be non-empty");

	expect(() => {
		fn({ _: ["1", "2", "3", "4"], env: {} }, taskUtilities);
	}).toThrow("must be at most length 3");
});

test("task.strict: validates environment variables with the given schema", () => {
	const fn = task.strict(
		{
			env: {
				SOME_FLAG: type("string").pipe(
					(value) => value.toLowerCase() === "true"
				)
			}
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
	}).toThrow(
		`${red("Environment variable 'SOME_FLAG'")}: must be a string (was missing)`
	);
});

test("task.strict: validates options with the given schema", () => {
	const fn = task.strict(
		{
			startDate: "string.date",
			logLevel: "number >= 0 = 6"
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
	}).toThrow(`${red("--startDate")}: must be a string (was missing)`);

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
	}).toThrow(`${red("--logLevel")}: must be non-negative (was `);
});

test("task.strict: rejects undeclared options", () => {
	const fn = task.strict({}, ({ logLevel }) => logLevel);

	expect(() => {
		fn(
			{
				_: [],
				env: {},
				// note: TypeScript doesn't have errors for extra properties
				undeclared: "value"
			},
			taskUtilities
		);
	}).toThrow(`${red("--undeclared")}: unknown option`);
});

test("task.strict: accepts an existing schema type", () => {
	const inputSchema = type({
		startDate: "string.date",
		logLevel: "number >= 0 = 6"
	});

	const fn = task.strict(inputSchema, ({ logLevel }) => logLevel);

	expect(
		fn({ _: [], env: {}, startDate: "2532-10-10", logLevel: 1 }, taskUtilities)
	).toBe(1);
});

test("task.strict: accepts nested types with morphs", () => {
	const inputSchema = type({
		object: type("string.json.parse").to({
			name: "string",
			version: "string.semver",
			homepage: "string.url"
		})
	});

	const fn = task.strict(inputSchema, ({ object }) => {
		expectTypeOf(object).toEqualTypeOf<{
			name: string;
			version: string;
			homepage: string;
		}>();

		return object;
	});

	expect(
		fn(
			{
				_: [],
				env: {},
				object: `{ "name": "@haltcase/run", "version": "3.0.0", "homepage": "https://github.com/haltcase/run" }`
			},
			taskUtilities
		)
	).toEqual({
		name: "@haltcase/run",
		version: "3.0.0",
		homepage: "https://github.com/haltcase/run"
	});

	expect(() => {
		fn(
			{
				_: [],
				env: {},
				object: `{ "name": "@haltcase/run", "version": "3.0.0", "homepage": "not a url" }`
			},
			taskUtilities
		);
	}).toThrow();
});

test("task.strict: exposes the given schema", () => {
	const fn = task.strict(
		{
			startDate: "string.date",
			logLevel: "number >= 0 = 6"
		},
		({ logLevel }) => logLevel
	);

	expect(
		fn.schema({
			_: [],
			env: {},
			startDate: "2532-10-10"
		})
	).toMatchObject({
		_: [],
		env: {},
		startDate: "2532-10-10",
		logLevel: 6
	});

	expect(
		fn.schema.assert({
			_: [],
			env: {},
			startDate: "2532-10-10",
			logLevel: 5
		}).logLevel
	).toBe(5);

	expect(
		fn.schema.assert({
			_: [],
			env: {},
			startDate: "2532-10-10"
		}).logLevel
	).toBe(6);

	expect(() => {
		fn.schema.assert({
			_: [],
			env: {},
			startDate: "not a date string"
		});
	}).toThrow();
});
