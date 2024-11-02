import { join } from "node:path";
import { cwd } from "node:process";

import { loadConfig } from "c12";

export interface AppConfig {
	/**
	 * Directory containing task files. Defaults to the `scripts` folder within
	 * the current working directory.
	 *
	 * @default `<cwd>/scripts`
	 */
	taskDirectory: string;

	/**
	 * Print no output unless errors occur.
	 *
	 * @default false
	 */
	quiet: boolean;
}

export const getAppConfig = async () => {
	const configName = "haltcase.run";

	return loadConfig<AppConfig>({
		name: configName,
		configFile: configName,
		packageJson: configName,
		rcFile: configName,

		defaults: {
			taskDirectory: join(cwd(), "scripts"),
			quiet: false
		}
	});
};
