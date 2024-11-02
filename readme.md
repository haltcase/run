# `@haltcase/run` &middot; [![npm version](https://img.shields.io/npm/v/@haltcase/run?style=flat-square)](https://www.npmjs.com/package/@haltcase/run) [![license](https://img.shields.io/npm/l/@haltcase/run?style=flat-square)](https://www.npmjs.com/package/@haltcase/run) [![@haltcase/run](https://img.shields.io/static/v1?label=style&message=haltcase&color=0ca5ed&style=flat-square)](https://haltcase.dev/style)

> Flexible, function-based task runner where command line options are props.

## Features

- ✅ Write task files in TypeScript or plain JavaScript
- ✅ [Execa] built in for shell command execution
- ✅ Tasks are "just functions" exported from your script files
- ✅ [Zod] schema support for stricter task execution

## Quick start

Install `@haltcase/run`:

```shell
# pnpm
pnpm add --save-dev @haltcase/run

# npm
npm install --save-dev @haltcase/run

# yarn
yarn add --dev @haltcase/run
```

Create a file in a scripts folder at the root of your project and export your
tasks &mdash; they're just functions! [¹](#tasks)

```js
// scripts/tasks.js

export const hello = ({ name }) => {
	console.log(`Hello, ${name}!`);
};
```

Now you can execute these functions and pass options from the command line:

```shell
pnpm hr tasks hello --name World
# → Hello, World!
```

## Task files

Task files are simple JavaScript or TypeScript files located (by default) in
the `scripts` folder within your current working directory. Organize them
however you like.

```
.
└── scripts/
    ├── build.js
    ├── database-tasks.ts
    └── dev.ts
```

To execute a task within one of these files, pass the name of the file
and the name of the task. For example:

```shell
pnpm hr database-tasks seed
```

> [!NOTE]
> It is allowed (although confusing) to have multiple task files with the
> same base name, however you must supply a file extension to make it
> unambiguous which file you are referring to.
>
> ```shell
> ✖ Found multiple task files with the name 'miscellaneous'
> Rename the ambiguous files or specify an extension and try again
> 	C:\dev\sources\js\skrrt\scripts\miscellaneous.js
> 	C:\dev\sources\js\skrrt\scripts\miscellaneous.ts
> 	C:\dev\sources\js\skrrt\scripts\miscellaneous.mjs
> ```

> [!TIP]
> If you want `*.js` task files to use a different module type from your root
> project, add a `package.json` to your scripts folder that specifies
> `"type": "module"` or `"type": "commonjs"`.

### CommonJS support

While TypeScript or ESM are much more highly recommended, you can also write
task files in CommonJS. Use the `*.cjs` file extension or create a package.json
file in your scripts folder with `"type": "commonjs"` and use `exports`.

```js
// scripts/greetings.cjs

exports.hello = ({ name }) => {
	console.log(`Hello, ${name}!`);
};
```

## Tasks

While tasks can be as simple as an exported function, they're capable of more.

### TypeScript types

So far, all tasks have been simple functions. However, you can get type-safety
by using the `task` function from `@haltcase/run`:

```ts
// scripts/hello.ts

import type { ParsedOptions } from "@haltcase/run";
import { task } from "@haltcase/run";

interface HelloProps extends ParsedOptions {
	name: string;
}

export const hello = task<HelloProps>(({ name }) => {
	console.log(`Hello, ${name}!`);
});
```

### Asynchronous

Tasks can return a Promise:

```js
export const getUser = async ({ id }) => {
	const userResponse = await fetch(
		`https://fakerapi.it/api/v2/custom?_quantity=1&id=${id}&email=email&website=website`
	);

	const { data } = await userResponse.json();

	console.log(data[0]);
};
```

### Positional arguments

Aside from named options of the form `--option`, task functions also receive
positional or unnamed arguments as an array of strings in the `_` property.

```js
// scripts/greetings.js

export const hello = ({ name, _ }) => {
	console.log(`Hello, ${name}! ${_.join(" ")}`);
};
```

```shell
pnpm hr greetings hello --name World Welcome to the cosmos!
# → Hello, World! Welcome to the cosmos!
```

Everything following a `--` option terminator will be treated as positional:

```shell
pnpm hr greetings hello --name World -- --ThisIsNotAnOption
# → Hello, World! --ThisIsNotAnOption
```

### Shell execution

Each task additionally receives a second argument, giving you access to shell
execution powered by [Execa].

```js
export const build = async ({ mode }, { $ }) => {
	const { stdout } = await $`vite build --mode ${mode}`;
	console.log(`stdout = ${stdout}`);
};
```

See [API](#api) for full API details.

### Task option validation using Zod schemas

Using [`task.strict`](#taskstrict), you can supply a [Zod] schema to move validations out of
your task's logic. If you transform the input, your task function's TypeScript
types will infer the output type.

## Configuration

You can configure `@haltcase/run` using a `haltcase.run.{extension}` file in
your current working directory.

Configuration is loaded using [c12] &mdash; see the documentation there for the
list of supported configuration locations, file types, and other features.

```ts
// haltcase.run.ts
import { HaltcaseRunConfig } from "@haltcase/run";

export default {
	taskDirectory: "./scripts",
	quiet: false
} satisfies HaltcaseRunConfig;
```

You can also set options in the `haltcase.run` property of your package.json:

```jsonc
{
	// ...
	"haltcase.run": {
		"taskDirectory": "./scripts",
		"quiet": false
	}
}
```

### TypeScript configuration

You will likely want to create a `tsconfig.json` file in your scripts folder,
for example:

```jsonc
{
	// if you want to extend your root config
	"extends": "../tsconfig.json",
	"compilerOptions": {
		// if you want to allow non-TypeScript task files
		"allowJs": true,
		"noEmit": true
	},
	"include": [
		// feel free to remove extensions here
		"**/*.ts",
		"**/*.mts",
		"**/*.cts",
		"**/*.js",
		"**/*.mjs",
		"**/*.cjs"
	],
	"exclude": ["node_modules"]
}
```

## API

### Option parsing

Command line option parsing is done with Node's [`util.parseArgs`][nodeparseargs],
but all options are treated as `string` types. In other words, all options
expect values, meaning the following usage will throw an error:

```shell
pnpm hr greetings hello --name
```

If you want to pass a boolean value for an option, pass `true`/`false` and
parse it yourself or use [`task.strict`](#taskstrict), for example using the
Zod schema: `z.string().transform(value => value === "true")`.

### `task`

`task` is a very light wrapper around a function that provides improved type inference.

```ts
task<TOptions>(fn: Task<T>): BrandedTask<T>
```

Usage:

```ts
import type { ParsedOptions } from "@haltcase/run";
import { task } from "@haltcase/run";

// without providing a type parameter
export const defaultOptions = task((options) => {
	console.log(options._); // ok, `_: string[]`
	console.log(options.name); // ok, but `name: unknown` and no hints
});

interface CustomOptions extends ParsedOptions {
	name: string;
}

// providing a type parameter
export const customOptions = task<CustomOptions>((options) => {
	console.log(options.name); // ok, `name: string`
});
```

> [!IMPORTANT]
> Because all command line arguments are strings, you should only use `string`
> as the value type for options with this method. If you want to be stricter
> about value types by validating or transforming them, implement the parsing
> yourself or use [`task.strict`](#taskstrict) with a Zod schema.

### `Task`

The type for a task function, which accepts two arguments: the parsed command
line options and a [`utilities`](#taskutilities) object providing tools for shell execution.

```ts
<TOptions = ParsedOptions> = (
	options: TOptions,
	utilities: TaskUtilities
) => unknown;
```

### `TaskUtilities`

Properties:

- `$` &ndash; Runa command using Execa's [script mode][execascript].
- `command` &ndash; Run a command using [Execa] (e.g., shell command or script).
- `exec` &ndash; Same as `command`, but inherits the parent process' stdio streams by default.

### `task.strict`

Provide the shape for a Zod schema as the first argument and a task function as
the second. The task function will receive the safely parsed and validated
output of the Zod schema, and its types will be inferred automatically.

Note that you supply a plain object for the shape rather than a full Zod schema.

```ts
task.strict<TShape, TSchema?>(shape: TShape, fn: Task<z.infer<TSchema>>): BrandedTaskStrict<z.infer<TSchema>>
```

Usage:

```ts
// scripts/strict-tasks.ts

import { task } from "@haltcase/run";
import { z } from "zod";

export const printCharacter = task.strict(
	{
		// positional/unnamed arguments
		_: z.array(z.string()),
		name: z.string(),
		armorClass: z.coerce.number()
	},
	async ({ name, armorClass }) => {
		console.log(`🎲 ${name}\n🛡️  ${armorClass}`);
	}
);
```

This also allows you to parse, validate, and safely type the `_` property
beyond an array of strings.

[execa]: https://github.com/sindresorhus/execa#readme
[execascript]: https://github.com/sindresorhus/execa/blob/main/docs/scripts.md
[zod]: https://zodjs.netlify.app/
[nodeparseargs]: https://nodejs.org/api/util.html#utilparseargsconfig
[c12]: https://github.com/unjs/c12?tab=readme-ov-file#-features
