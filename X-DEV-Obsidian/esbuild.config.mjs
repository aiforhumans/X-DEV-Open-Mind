import esbuild from "esbuild";
import process from "process";

const banner =
`/*
X-DEV Obsidian LLM Plugin
Local LLM integration using LM Studio
*/`;

const prod = process.argv[2] === "production";

const externalModules = [
	"obsidian",
	"electron",
	"@codemirror/autocomplete",
	"@codemirror/collab",
	"@codemirror/commands",
	"@codemirror/language",
	"@codemirror/lint",
	"@codemirror/search",
	"@codemirror/state",
	"@codemirror/view",
	"@lezer/common",
	"@lezer/highlight",
	"@lezer/lr",
];

const options = {
	banner: {
		js: banner,
	},
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: externalModules,
	format: "cjs",
	platform: "node",
	target: "ES6",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
};

if (prod) {
	esbuild.build(options).catch(() => process.exit(1));
} else {
	const ctx = await esbuild.context(options);
	await ctx.watch();
}
