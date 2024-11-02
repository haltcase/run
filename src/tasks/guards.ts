import type { BrandedTask, BrandedTaskStrict, Task } from "./types.js";

export const isBrandedTask = (task: Task): task is BrandedTask =>
	"kind" in task;

export const isBrandedTaskStrict = (task: Task): task is BrandedTaskStrict =>
	"kind" in task && task.kind === "strictTask";
