import type { ParsedOptions, Task } from "@haltcase/run";
import { task } from "@haltcase/run";
import { type } from "arktype";
import { writeFile } from "fs/promises";

interface HelloOptions extends ParsedOptions {
	name: string;
}

export const hallo: Task<HelloOptions> = ({ name }) => {
	console.log(`Greetings from a *.ts file, ${name}!`);
};

export const hello = task<HelloOptions>(async ({ name }, { $ }) => {
	console.log(`Greetings from a *.ts file, ${name}!`);
	const { stdout } = await $`echo ${"hello"}`;
	console.log(`stdout = ${stdout}`);

	const image = (await (
		await fetch(
			"https://fakerapi.it/api/v2/images?_quantity=1&width=48&height=48"
		)
	).json()) as any;

	console.log(`Downloaded image (title = "${image.data[0].title}")`);

	try {
		await $`mkdir ./image-data`;
	} catch {}

	await writeFile(
		"./image-data/example.json",
		JSON.stringify(image.data[0]),
		"utf8"
	);
});

export const test = task.strict(
	{
		_: type("string[]").pipe((value) => value.length),
		env: {
			SHELL: "string"
		},
		foo: "string = 'bar'"
	},
	async ({ _, env, foo }) => {
		console.log(_, env.SHELL, foo);
	}
);

export const printCharacter = task.strict(
	{
		name: "string",
		armorClass: "string.numeric.parse",
		flag: type("string").pipe((value) => value === "true"),
		env: {
			SOME_FLAG: "string.numeric.parse"
		}
	},
	async ({ name, armorClass, flag }) => {
		console.log(flag, typeof flag);
		console.log(`🎲 ${name}\n🛡️  ${armorClass}`);
	}
);

const inputSchema = type({
	_: type("string[]").pipe((values) => values.length),
	env: {
		// undeclared property handling (default is "ignore", aka passthrough)
		"+": "delete",
		SECRET_KEY: "string >= 8"
	}
});

export const fun = task.strict(inputSchema, async ({ _, env }) => {
	console.log(`Positionals count (_) = ${_}`);
	console.log(`SECRET_KEY = ${env.SECRET_KEY}`);
});
