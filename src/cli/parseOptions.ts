import { parseArgs } from "node:util";

export interface ParsedOptions {
	_: string[];
	[key: string]: unknown;
}

export const reservedNames = new Set(["_", "env"]);

/**
 * Wrapper around Node's {@link parseArgs} that treats options as strings
 * by default, instead of boolean flags.
 *
 * @param args - argv-like string
 * @returns
 */
export const parseOptions = (args: string[]): ParsedOptions => {
	const { tokens } = parseArgs({
		args,
		allowPositionals: true,
		strict: false,
		tokens: true
	});

	const options: ParsedOptions = {
		_: []
	};

	for (let index = 0; index < tokens.length; index++) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const token = tokens[index]!;

		if (token.kind === "option-terminator") {
			continue;
		}

		if (token.kind === "option") {
			if (reservedNames.has(token.name)) {
				throw new Error(
					`Reserved name '${token.name}' cannot be used as option`
				);
			}

			if (index + 1 < tokens.length) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const next = tokens[index + 1]!;

				if (next.kind !== "positional") {
					throw new Error(`Expected value for option ${token.rawName}`);
				}

				options[token.name] = next.value;
				index++;
			} else {
				throw new Error(
					`Expected option ${token.rawName} to be followed by a value`
				);
			}
		}

		if (token.kind === "positional") {
			options._.push(token.value);
		}
	}

	return options;
};
