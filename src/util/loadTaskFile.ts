import { resolve } from "node:path";

import type { ResolvedConfig, UserInputConfig } from "c12";
import { loadConfig } from "c12";

import type { MainContext } from "../cli/main.js";
import type { TaskCollection } from "../tasks/types.js";
import type { Result } from "./result.js";

export type ResolvedConfigWithFile<
	T extends UserInputConfig = UserInputConfig
> = Omit<ResolvedConfig<T>, "configFile"> & {
	configFile: NonNullable<ResolvedConfig<T>["configFile"]>;
};

export const loadTaskFile = async (
	context: MainContext
): Promise<Result<ResolvedConfigWithFile<TaskCollection>>> => {
	try {
		const collection = await loadConfig<TaskCollection>({
			cwd: context.taskFile.dir,
			name: context.taskFile.name,
			configFile: context.taskFile.base,
			dotenv: false,
			rcFile: false,
			packageJson: false
		});

		if (!collection.configFile || collection.layers?.length === 0) {
			return {
				ok: false,
				error: new Error(
					`Failed to load task file at path ${resolve(context.taskFile.dir, context.taskFile.base)}`
				)
			};
		}

		return {
			ok: true,
			value: collection as ResolvedConfigWithFile<TaskCollection>
		};
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error : new Error(String(error))
		};
	}
};
