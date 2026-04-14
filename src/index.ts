#!/usr/bin/env node

import * as childProcess from "child_process";
import { stripIndent } from "common-tags";
import { appendFile, writeFile } from "fs/promises";
import { join } from "path";
import { promisify } from "util";

const exec = promisify(childProcess.exec);

const prettierContent = stripIndent`
{
	"useTabs": false,
	"singleQuote": false,
	"trailingComma": "all",
	"printWidth": 100,
	"plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
	"overrides": [
		{
			"files": "*.svelte",
			"options": {
				"parser": "svelte"
			}
		}
	],
	"tailwindStylesheet": "./src/routes/layout.css"
}
`;

const viteContent = stripIndent`
import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit(),
    Icons({
      compiler: "svelte",
    }),
  ],
});
`;

const cssAdditions = stripIndent`
@plugin "daisyui";
`;

const ambientTypeAdditions = stripIndent`
import 'unplugin-icons/types/svelte'
`;

async function run() {
  console.log("Running sv create");
  await exec(
    `npx sv@latest create --template minimal --types ts --add prettier eslint tailwindcss="plugins:none" --install npm ./`,
  );

  console.log("Installing additional dependencies");
  await exec(`npm i -D daisyui unplugin-icons @iconify/json`);

  console.log("Updating configs");
  await Promise.all([
    writeFile(join(process.cwd(), ".prettierrc"), prettierContent),
    writeFile(join(process.cwd(), "vite.config.ts"), viteContent),
    appendFile(
      join(process.cwd(), "src", "routes", "layout.css"),
      cssAdditions,
    ),
    appendFile(join(process.cwd(), "src", "app.d.ts"), ambientTypeAdditions),
  ]);

  console.log("Formatting with prettier");
  await exec("npx prettier --write .");
}

run()
  .catch((err) => console.log("Error", err))
  .then(() => console.log("Done"));
