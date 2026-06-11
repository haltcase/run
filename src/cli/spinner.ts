import tty from "node:tty";
import { styleText } from "node:util";

type Style = Parameters<typeof styleText>[0];

/**
 * Based on `nanospinner` and `@favware/colorette-spinner` but using
 *
 * @see https://github.com/usmanyunusov/nanospinner (ISC © 2021 Usman Yunusov)
 * @see https://github.com/favware/colorette-spinner (MIT © 2022 Favware)
 */
export class Spinner implements SpinnerShape {
	#isCI =
		process.env.CI ||
		process.env.WT_SESSION ||
		process.env.ConEmuTask === "{cmd::Cmder}" ||
		process.env.TERM_PROGRAM === "vscode" ||
		process.env.TERM === "xterm-256color" ||
		process.env.TERM === "alacritty";

	#isTTY = tty.isatty(1) && process.env.TERM !== "dumb" && !("CI" in process.env);

	#supportUnicode = process.platform === "win32" ? this.#isCI : process.env.TERM !== "linux";

	#symbols = {
		// eslint-disable-next-line no-nested-ternary
		frames: this.#isTTY
			? this.#supportUnicode
				? ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
				: ["-", "\\", "|", "/"]
			: ["-"],
		tick: this.#supportUnicode ? "✔" : "√",
		cross: this.#supportUnicode ? "✖" : "×"
	};

	#text = "";
	#current = 0;
	#interval = 50;
	#stream: NodeJS.WriteStream = process.stderr;
	#frames = this.#symbols.frames;
	#color: Style = "greenBright";
	#lines = 0;
	#timer: NodeJS.Timeout | undefined;

	constructor(text?: string, options?: SpinnerOptions) {
		this.#text = text ?? this.#text;

		this.#interval = options?.interval ?? this.#interval;
		this.#stream = options?.stream ?? this.#stream;

		if (options?.frames?.length) {
			this.#frames = options.frames;
		}

		this.#color = options?.color ?? this.#color;
	}

	clear(): this {
		this.write("\u001B[1G");

		for (let index = 0; index < this.#lines; index++) {
			if (index > 0) {
				this.write("\u001B[1A");
			}

			this.write("\u001B[2K\u001B[1G");
		}

		this.#lines = 0;

		return this;
	}

	error(...[options = {}]: Parameters<SpinnerShape["error"]>): this {
		const mark = styleText("red", this.#symbols.cross);
		return this.stop({ mark, ...options });
	}

	reset(): this {
		this.#current = 0;
		this.#lines = 0;

		if (this.#timer) {
			clearTimeout(this.#timer);
		}

		return this;
	}

	spin(): this {
		this.render();
		this.#current = ++this.#current % this.#frames.length;
		return this;
	}

	start(...[options = {}]: Parameters<SpinnerShape["start"]>): this {
		if (this.#timer) {
			this.reset();
		}

		return this.update({
			text: options.text ?? this.#text,
			color: options.color ?? this.#color
		}).loop();
	}

	stop(...[options = {}]: Parameters<SpinnerShape["stop"]>): this {
		if (this.#timer) {
			clearTimeout(this.#timer);
		}

		const mark = styleText(options.color || this.#color, this.#frames[this.#current] || "");

		const optionsMark =
			options.mark && options.color ? styleText(options.color, options.mark) : options.mark;

		this.write(`${optionsMark || mark} ${options.text || this.#text}\n`, true);

		return this.#isTTY ? this.write(`\u001B[?25h`) : this;
	}

	success(...[options = {}]: Parameters<SpinnerShape["success"]>): this {
		const mark = styleText("green", this.#symbols.tick);
		return this.stop({ mark, ...options });
	}

	update(...[options = {}]: Parameters<SpinnerShape["update"]>): this {
		this.#text = options.text || this.#text;

		this.#interval = options.interval ?? this.#interval;
		this.#stream = options.stream ?? this.#stream;

		if (options.frames?.length) {
			this.#frames = options.frames;
		}

		this.#color = options.color ?? this.#color;

		if (this.#frames.length - 1 < this.#current) {
			this.#current = 0;
		}

		return this;
	}

	private loop(): this {
		if (this.#isTTY) {
			this.#timer = setTimeout(() => this.loop(), this.#interval);
		}

		return this.spin();
	}

	write(value: string, clear = false): this {
		if (clear && this.#isTTY) {
			this.clear();
		}

		this.#stream.write(value);
		return this;
	}

	private render() {
		const mark = styleText(this.#color, this.#frames[this.#current] || "");
		let value = `${mark} ${this.#text}`;
		if (this.#isTTY) {
			this.write(`\u001B[?25l`);
		} else {
			value += "\n";
		}

		this.write(value, true);

		if (this.#isTTY) {
			this.#lines = this.getLines(value, this.#stream.columns);
		}
	}

	private getLines(value = "", width = 80) {
		return (
			value
				// eslint-disable-next-line no-control-regex
				.replaceAll(/\u001B[^m]*m/g, "")
				.split("\n")
				.reduce((column, line) => column + Math.max(1, Math.ceil(line.length / width)), 0)
		);
	}
}

export interface SpinnerOptions {
	stream?: NodeJS.WriteStream;
	frames?: string[];
	interval?: number;
	text?: string;
	color?: Style;
}

export interface SpinnerShape {
	clear: () => Spinner;
	error: (options?: { text?: string; mark?: string }) => Spinner;
	reset: () => Spinner;
	spin: () => Spinner;
	start: (options?: { text?: string; color?: Style }) => Spinner;
	stop: (options?: { text?: string; mark?: string; color?: Style }) => Spinner;
	success: (options?: { text?: string; mark?: string }) => Spinner;
	update: (options?: SpinnerOptions) => Spinner;
}
