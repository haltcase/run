import { defineConfig } from "vite-plus";

export default defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	fmt: {
		sortImports: {},
		sortPackageJson: {
			sortScripts: true
		},
		trailingComma: "none",
		ignorePatterns: ["pnpm-workspace.yaml"]
	},
	lint: {
		options: {
			typeAware: true,
			typeCheck: true
		}
	},
	pack: {
		entry: ["src/index.ts", "src/cli/bin.ts"],
		deps: {
			skipNodeModulesBundle: true
		},
		unbundle: true,
		attw: {
			profile: "esm-only"
		}
	},
	staged: {
		"*.{js,jsx,ts,tsx,css,yml,yaml}": "pnpm format"
	}
});
