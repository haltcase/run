import { type } from "arktype";
import { dim } from "colorette";
import { expect, test } from "vitest";

import { getSchemaProperties } from "./getSchemaProperties.js";

test("getSchemaProperties: lists properties of the given schema", () => {
	expect(getSchemaProperties(type({}))).toBe("");

	expect(
		getSchemaProperties(
			type({
				optionName: "string"
			})
		)
	).toBe("{ optionName }");
});

test("getSchemaProperties: wraps optional parameter names with []", () => {
	expect(
		getSchemaProperties(
			type({
				optionName: "string",
				maybeFlag: "boolean?"
			})
		)
	).toBe(`{ optionName, ${dim("[maybeFlag]")} }`);
});

test("getSchemaProperties: `_` and `env` are not listed", () => {
	expect(
		getSchemaProperties(
			type({
				_: "string[]",
				env: {
					SOME_FLAG: type("string").pipe(
						(value) => value.toLowerCase() === "true"
					)
				},
				optionName: "string",
				maybeFlag: "boolean?"
			})
		)
	).toBe(`{ optionName, ${dim("[maybeFlag]")} }`);
});

test("getSchemaProperties: outputs empty list if only reserved names present", () => {
	expect(
		getSchemaProperties(
			type({
				_: "string[]",
				env: "Record<string, string | undefined>"
			})
		)
	).toBe("{  }");
});
