import { setTimeout } from "node:timers/promises";

import { task } from "@haltcase/run";

await Promise.resolve("top level await");

export const notAFunction = "This will cause an error";

export const error = () => {
	throw new Error("Something went wrong in this script");
};

export const asynchronous = async () => {
	await setTimeout(1000);
	console.log("Asynchronous tasks are 👌");
};

export const hello = task(({ name }) => {
	console.log(`Greetings from a *.ts file, ${String(name)}!`);
});
