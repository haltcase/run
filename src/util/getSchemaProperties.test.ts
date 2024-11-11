import { expect, test } from "vitest";
import { z } from "zod";

import { getSchemaProperties } from "./getSchemaProperties.js";

test("getSchemaProperties: lists properties of the given zod schema", () => {
	expect(getSchemaProperties(z.object({}))).toBe("");

	expect(
		getSchemaProperties(
			z.object({
				optionName: z.string()
			})
		)
	).toBe("{ optionName }");
});

test("getSchemaProperties: wraps optional parameter names with []", () => {
	expect(
		getSchemaProperties(
			z.object({
				optionName: z.string(),
				maybeFlag: z.boolean().optional()
			})
		)
	).toBe("{ optionName, [maybeFlag] }");
});

test("getSchemaProperties: `_` and `env` are not listed", () => {
	expect(
		getSchemaProperties(
			z.object({
				_: z.string().array(),
				env: z.object({
					SOME_FLAG: z
						.string()
						.transform((value) => value.toLowerCase() === "true")
				}),
				optionName: z.string(),
				maybeFlag: z.boolean().optional()
			})
		)
	).toBe("{ optionName, [maybeFlag] }");
});
