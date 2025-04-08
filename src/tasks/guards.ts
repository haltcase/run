import type { BrandedTask, BrandedTaskStrict, Task } from "./types.js";

export const isBrandedTask = (task: Task): task is BrandedTask =>
	"kind" in task;

export const isBrandedTaskStrict = <T>(
	task: Task<T>
): task is BrandedTaskStrict<T> => "kind" in task && task.kind === "strictTask";
