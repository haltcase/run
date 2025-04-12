import { type Type, type } from "arktype";
import { dim } from "colorette";

import { reservedNames } from "../cli/parseOptions.js";

const propertyEntry = type({
	key: "string",
	"+": "delete"
});

const arktypeJson = type({
	domain: "string",
	required: propertyEntry.array().default(() => []),
	optional: propertyEntry.array().default(() => [])
});

export const getSchemaProperties = (schema: Type): string => {
	const definition = arktypeJson.assert(schema.json);

	if (definition instanceof type.errors || definition.domain !== "object") {
		return "";
	}

	const { required, optional } = definition;

	const requiredProperties = required.map(({ key }) => ({
		key,
		isOptional: false
	}));
	const optionalProperties = optional.map(({ key }) => ({
		key,
		isOptional: true
	}));

	const properties = [...requiredProperties, ...optionalProperties];

	if (properties.length === 0) {
		return "";
	}

	const propertyList = properties
		.filter(({ key }) => !reservedNames.has(key))
		.map(({ key, isOptional }) => {
			if (isOptional) {
				return dim(`[${key}]`);
			}

			return key;
		});

	return `{ ${propertyList.join(", ")} }`;
};
