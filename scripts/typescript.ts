import type { ParsedOptions, Task } from "@haltcase/run";
import { task } from "@haltcase/run";
import { writeFile } from "fs/promises";
import { z } from "zod";

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
		_: z
			.string()
			.array()
			.transform((values) => values.length),
		env: z
			.object({
				SHELL: z.string()
			})
			.transform((object) => ({ ...object })),
		foo: z.string().default("bar")
	},
	async ({ _, env }) => {
		console.log(_, env.SHELL);
	}
);

export const printCharacter = task.strict(
	{
		name: z.string(),
		armorClass: z.coerce.number(),
		flag: z
			.string()
			.transform((value) => value === "true")
			.optional()
	},
	async ({ name, armorClass, flag }) => {
		console.log(flag, typeof flag);
		console.log(`🎲 ${name}\n🛡️  ${armorClass}`);
	}
);
