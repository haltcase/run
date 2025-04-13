/* eslint-disable import-x/no-default-export */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable unicorn/prevent-abbreviations */

// Types for cliui@9.0.1 since they explicitly avoid publishing them
// See https://github.com/yargs/cliui/issues/96
// Built from https://github.com/yargs/cliui/commit/2737977df41e728bd8c7d3ca0658498273cecce5

// However, I had to make 2 modifications to make them work:
// - Change named export of `cliui` to default export
// - Make the `_mixin` parameter to `cliui` optional

declare module "cliui" {
	export interface UIOptions {
		width: number;
		wrap?: boolean;
		rows?: string[];
	}
	export interface Column {
		text: string;
		width?: number;
		align?: "right" | "left" | "center";
		padding: number[];
		border?: boolean;
	}
	interface ColumnArray extends Array<Column> {
		span: boolean;
	}
	interface Line {
		hidden?: boolean;
		text: string;
		span?: boolean;
	}
	interface Mixin {
		stringWidth: Function;
		stripAnsi: Function;
		wrap: Function;
	}
	export declare class UI {
		width: number;
		wrap: boolean;
		rows: ColumnArray[];
		constructor(opts: UIOptions);
		span(...args: ColumnArray): void;
		resetOutput(): void;
		div(...args: (Column | string)[]): ColumnArray;
		private shouldApplyLayoutDSL;
		private applyLayoutDSL;
		private colFromString;
		private measurePadding;
		toString(): string;
		rowToString(row: ColumnArray, lines: Line[]): Line[];
		private renderInline;
		private rasterize;
		private negatePadding;
		private columnWidths;
	}
	declare function cliui(opts: Partial<UIOptions>, _mixin?: Mixin): UI;
	export default cliui;
}
