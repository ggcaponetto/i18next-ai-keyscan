#!/usr/bin/env node
import chalk from "chalk";
import {checkOpenAIEnvs} from "./env-check.js";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import {models, promptTemplates} from "../constants/constants.js";
import {readFile} from "fs/promises";
import {URL} from "url";
const packageJSON = JSON.parse(await readFile(new URL(
    "./../../../package.json",
    import.meta.url
)));


let argv = yargs(hideBin(process.argv)).
    option(
        "target",
        {
            "describe": "Scan a target directory or file"
        }
    ).
    option(
        "filter",
        {
            "describe": "A regex filter applied to the file path. E.g: TODO "
        }
    ).
    option(
        "output",
        {
            "describe": "The file path of the generated JSON output. E.g. ./out/output.json"
        }
    ).
    option(
        "flat",
        {
            "describe": "If set to true, it will take all the first-level attributes of the JSON response and merge them into a JSON object. A JSON array will be returned otherwise."
        }
    ).
    option(
        "model",
        {
            "describe": "The OpenAI model to use. E.g. gpt-4-turbo-2024-04-09",
            "choices": Object.keys(models)
        }
    ).
    option(
        "chunk-length",
        {
            "describe": "Files are split according to this number, which indicates character count. Default is 10000"
        }
    ).
    option(
        "propmpts-file",
        {
            "describe": "Override the available OpenAI prompts providing the path to your own custom-propmpts.json file."
        }
    ).
    option(
        "propmpt",
        {
            "describe": "The selected prompt from your custom-propmpts.json file. Alternatively choose one of the default templates.",
            "choices": Object.keys(promptTemplates)
        }
    ).
    option(
        "dry-run",
        {
            "describe": "If set, performs an indicative cost analysis."
        }
    ).
    option(
        "verbose",
        {
            "describe": "If set, does some more logging."
        }
    ).
    parse();

let res = await checkOpenAIEnvs().catch((e) => {

    console.error(chalk.red(`Environment variable check failed: ${e.message}`));
    return null;

});

if (res) {

    let main = (await import("./cli.js")).main;

    // Combine styled and normal strings
    console.log(chalk.green(`Starting ${packageJSON.name} - v${packageJSON.version}.`));
    let mainExecutionCode = await main(argv).catch((e) => {

        console.error(
            chalk.red("Exited with errors."),
            e
        );

    });
    if (mainExecutionCode === 0) {

        console.log(chalk.green("Done."));

    }

}
