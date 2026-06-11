import { expect, test, vi } from "vitest";

import { Spinner } from "./spinner.js";

const createMockedSpinner = (...parameters: ConstructorParameters<typeof Spinner>) => {
	const spinner = new Spinner(...parameters);

	vi.spyOn(spinner, "write").mockImplementation(function mock(this: Spinner) {
		return this;
	});

	return spinner;
};

test("spinner: runs spinner", () => {
	const spinner = createMockedSpinner();

	const startSpy = vi.spyOn(spinner, "start");
	const updateSpy = vi.spyOn(spinner, "update");

	spinner.start();

	expect(startSpy).toHaveBeenCalled();
	expect(updateSpy).toHaveBeenCalledWith({ text: "", color: "greenBright" });

	spinner.stop();
});

test("spinner: runs spinner with text", () => {
	const spinner = createMockedSpinner("very fast");

	vi.spyOn(spinner, "write").mockImplementation(function mock(this: Spinner) {
		return this;
	});

	const startSpy = vi.spyOn(spinner, "start");
	const updateSpy = vi.spyOn(spinner, "update");

	spinner.start();

	expect(startSpy).toHaveBeenCalled();
	expect(updateSpy).toHaveBeenCalledWith({
		text: "very fast",
		color: "greenBright"
	});

	spinner.stop();
});

test("spinner: runs spinner with custom color", () => {
	const spinner = createMockedSpinner("", { color: "redBright" });

	const startSpy = vi.spyOn(spinner, "start");
	const updateSpy = vi.spyOn(spinner, "update");

	spinner.start();

	expect(startSpy).toHaveBeenCalled();
	expect(updateSpy).toHaveBeenCalledWith({ text: "", color: "redBright" });

	spinner.stop();
});

test("spinner: runs spinner and error", () => {
	const spinner = createMockedSpinner();

	const startSpy = vi.spyOn(spinner, "start");
	const updateSpy = vi.spyOn(spinner, "update");
	const errorSpy = vi.spyOn(spinner, "error");
	const stopSpy = vi.spyOn(spinner, "stop");

	spinner.start();

	expect(startSpy).toHaveBeenCalled();
	expect(updateSpy).toHaveBeenCalledWith({ text: "", color: "greenBright" });

	spinner.error({ text: "This was a failure." });

	expect(errorSpy).toHaveBeenCalledWith({ text: "This was a failure." });
	expect(stopSpy).toHaveBeenCalledWith({
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		mark: expect.any(String),
		text: "This was a failure."
	});
});

test("spinner: runs spinner and success", () => {
	const spinner = createMockedSpinner();

	const startSpy = vi.spyOn(spinner, "start");
	const updateSpy = vi.spyOn(spinner, "update");
	const errorSpy = vi.spyOn(spinner, "error");
	const stopSpy = vi.spyOn(spinner, "stop");
	const successSpy = vi.spyOn(spinner, "success");

	spinner.start();

	expect(startSpy).toHaveBeenCalled();
	expect(updateSpy).toHaveBeenCalledWith({ text: "", color: "greenBright" });

	spinner.success({ text: "This was successful!" });

	expect(successSpy).toHaveBeenCalledWith({ text: "This was successful!" });
	expect(stopSpy).toHaveBeenCalledWith({
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		mark: expect.any(String),
		text: "This was successful!"
	});
	expect(errorSpy).not.toHaveBeenCalled();
});

test("spinner: runs spinner and reset", () => {
	const spinner = createMockedSpinner();

	const startSpy = vi.spyOn(spinner, "start");
	const updateSpy = vi.spyOn(spinner, "update");
	const resetSpy = vi.spyOn(spinner, "reset");

	spinner.start();

	expect(startSpy).toHaveBeenCalled();
	expect(updateSpy).toHaveBeenCalledWith({ text: "", color: "greenBright" });

	spinner.reset();

	expect(resetSpy).toHaveBeenCalled();

	spinner.stop();
});
