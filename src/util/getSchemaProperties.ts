import type { z } from "zod";

import { reservedNames } from "../cli/parseOptions.js";

export const getSchemaProperties = (schema: z.ZodTypeAny): string => {
	const definition = schema._def as object;

	if (!("shape" in definition) || typeof definition.shape !== "function") {
		return "";
	}

	const shape = definition.shape() as Record<string, z.ZodTypeAny>;
	const entries = Object.entries(shape);

	if (entries.length === 0) {
		return "";
	}

	const propertyList = Object.entries(shape)
		.filter(([key]) => !reservedNames.has(key))
		.map(([key, value]) => {
			if (value.isOptional()) {
				return `[${key}]`;
			}

			return key;
		});

	return `{ ${propertyList.join(", ")} }`;
};
