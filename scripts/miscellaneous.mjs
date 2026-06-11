import { setTimeout } from "node:timers/promises";

await Promise.resolve("top level await");

export const notAFunction = "This will cause an error";

export const error = () => {
	throw new Error("Something went wrong in this script");
};

export const asynchronous = async () => {
	await setTimeout(1_000);
	console.log("Asynchronous *.mjs tasks are 👌");
};

export const hello = ({ name }) => {
	console.log(`Greetings from an *.mjs file, ${name}!`);
};
