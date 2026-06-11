import { setTimeout } from "node:timers/promises";

import { task } from "@haltcase/run";

await Promise.resolve("top level await");

export const notAFunction = "This will cause an error";

export const error = () => {
	throw new Error("Something went wrong in this script");
};

export const asynchronous = async () => {
	console.log("This task will take a while...");
	await setTimeout(1_000);
	console.log("Yeah, we're still waiting...");
	await setTimeout(1_000);
	console.log("It will be done soon...");
	await setTimeout(1_000);
	console.log("Checking...");
	await setTimeout(1_000);
	console.log("Almost there...");
	await setTimeout(1_000);
	console.log("Asynchronous *.ts tasks are 👌");
};

export const hello = task(({ name }) => {
	console.log(`Greetings from a *.ts file, ${String(name)}!`);
});
