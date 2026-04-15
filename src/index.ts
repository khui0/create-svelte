#!/usr/bin/env node

import { confirm } from "@inquirer/prompts";
import * as childProcess from "child_process";
import { stripIndent } from "common-tags";
import { PathLike } from "fs";
import { appendFile, opendir, writeFile } from "fs/promises";
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
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
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

const isDirEmpty = async (path: PathLike) => {
  try {
    const dir = await opendir(path);
    const entry = await dir.read();
    await dir.close();
    return entry === null;
  } catch (e) {
    return false;
  }
};

async function run() {
  const isEmpty = await isDirEmpty(".");

  if (!isEmpty) {
    const answer = await confirm({
      message: "Directory is not empty, continue?",
    });

    if (!answer) {
      return;
    }
  }

  console.log("Running sv create (this might take a while)");
  await exec(
    `npx sv@latest create --template minimal --types ts --add prettier eslint tailwindcss="plugins:none" --install npm --no-dir-check ./`,
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
