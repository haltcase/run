import { expect, test } from "vitest";

import { parseOptions } from "./parseOptions.js";

test("parseOptions: parses options as key/value and returns positionals", () => {
	expect(
		parseOptions([
			"--file",
			"readme.md",
			"--dryRun",
			"true",
			"you",
			"spin",
			"me",
			"right",
			"round"
		])
	).toStrictEqual({
		_: ["you", "spin", "me", "right", "round"],
		file: "readme.md",
		dryRun: "true"
	});
});

test("parseOptions: expects all options to have values", () => {
	expect(() => parseOptions(["--name"])).toThrow(
		"Expected option --name to be followed by a value"
	);
});

test("parseOptions: returns everything after terminator as positionals", () => {
	expect(parseOptions(["--color", "blue", "--", "--name", "-aBcDeF"]))
		.toMatchInlineSnapshot(`
		{
		  "_": [
		    "--name",
		    "-aBcDeF",
		  ],
		  "color": "blue",
		}
	`);
});
