#!/usr/bin/env node

import chalk from "chalk";
import {getSourceCodeMap} from "../parser/parser.js";
import path from "path";
import {getPricePrediction, processSourceMap, writeFile} from "../processor/processor.js";
import {models, promptTemplates} from "../constants/constants.js";
import {ask} from "../openai/openai.js";
import readline from "node:readline";
import {readFile} from "fs/promises";
import {URL} from "url";
const currentDirectory = process.cwd();


async function main (myArgv) {

    let prompts = promptTemplates;
    let scanTarget = myArgv.target;
    let outputTarget = myArgv.output;
    let regexFilter = new RegExp(`${myArgv.filter}`);
    let dryRun = myArgv.dryRun;
    let verbose = myArgv.verbose;
    let model = myArgv.model || Object.keys(models)[0];
    let chunksLength = myArgv.chunkLength || 10000;
    let isFlatOutput = !(myArgv.flat === "false");
    let promptsFile = myArgv["prompts-file"];
    let promptsFilePath;
    let prompt = myArgv["prompt"] || Object.keys(prompts)[0];
    if (Object.keys(models).includes(model) === false) {

        throw new Error(`The OpenAI model (${model}) is not supported.`);

    }
    if (promptsFile !== undefined && !path.isAbsolute(promptsFile)) {

        promptsFilePath = path.resolve(`${currentDirectory}/./${promptsFile}`).toString();

    }
    if (promptsFilePath !== undefined) {

        console.log(chalk.white(`Loading file: ${promptsFilePath}`));
        const customPromptsJSON = JSON.parse(await readFile(new URL(
            promptsFilePath,
            import.meta.url
        )));
        // Override the prompts with the ones provided via cli argument
        prompts = {
            ...prompts,
            ...customPromptsJSON
        };

    }
    if (!path.isAbsolute(myArgv.target)) {

        scanTarget = path.resolve(`${currentDirectory}/./${scanTarget}`);

    }
    if (myArgv.output && !path.isAbsolute(myArgv.output)) {

        outputTarget = path.resolve(`${currentDirectory}/./${outputTarget}`);

    }
    let sourceMap = await getSourceCodeMap(
        scanTarget,
        {}
    );
    // filter the content (only src files)
    let filteredSourceMap = Object.keys(sourceMap).
        filter((key) => {

            let passesFilter = regexFilter.test(key);
            return passesFilter;

        }).
        reduce(
            (acc, curr) => {

                return {
                    ...acc,
                    [curr]: sourceMap[curr]
                };

            },
            {}
        );
    let tempOutputData = [];

    let costPrediction = await getPricePrediction(
        filteredSourceMap,
        prompts[prompt].promptChain,
        model,
        chunksLength
    );


    if (dryRun) {

        console.log(chalk.white(`This operation would cost you approximately: ${costPrediction.unit} ${costPrediction.totalPrice}.`));
        return 0;

    }
    let userAnswer = await new Promise((resolve) => {

        const readLineInterface = readline.createInterface({
            "input": process.stdin,
            "output": process.stdout
        });
        readLineInterface.question(
            `This operation will cost you approximately: ${costPrediction.unit} ${costPrediction.totalPrice}. Do you want to proceed? [y/n]:\n`,
            (answer) => {

                // Close the readline interface
                readLineInterface.close();
                let answerClean = answer.trim().toLowerCase();
                resolve(answerClean);

            }
        );

    });
    let userWantsToProceed = [
        "yes",
        "y"
    ].includes(userAnswer) === true;
    if (userWantsToProceed === false) {

        console.log(chalk.yellow("Aborting this operation."));
        return 0;

    }

    let errors = [];
    let res = await processSourceMap(
        filteredSourceMap,
        chunksLength,
        async (data) => {

            let result = await new Promise(async (resolve) => {

                let textInput = data.chunkOfText;
                let miniSourceMap = {
                    [data.key]: textInput
                };
                let pricePrediction = await getPricePrediction(
                    miniSourceMap,
                    prompts[prompt].promptChain,
                    model,
                    chunksLength
                );
                let requestBody = {
                    "temperature": 0,
                    "response_format": {"type": "json_object"},
                    "max_tokens": pricePrediction.totalTokens,
                    "messages": [
                        ...prompts[prompt].promptChain,
                        {
                            "role": "user",
                            "content": textInput
                        }
                    ],
                    "model": model
                };

                let res = await ask(requestBody);
                let parsedResponse = JSON.parse(res?.choices?.[0]?.message?.content);
                if (verbose) {

                    console.log(chalk.white(
                        `OpenAI response to '${data.key}' (key ${data.keyIndex + 1} of ${data.keyLength}, chunk ${data.chunkIndex + 1} of ${data.chunkLength}):`,
                        JSON.stringify(parsedResponse)
                    ));

                }
                resolve(parsedResponse);

            }).catch((e) => {

                console.error(
                    chalk.red(`Error processing ${data.key}: ${e.message}`),
                    e
                );
                errors.push({
                    data,
                    "error": e.message
                });
                return null;

            });
            if (result) {

                tempOutputData.push(result);

            }

        }
    );
    if (errors.length > 0) {

        let errorFilePath = `${outputTarget}.error.json`;
        await writeFile(
            errorFilePath,
            JSON.stringify(
                errors,
                null,
                2
            )
        );
        console.log(chalk.yellow(`Operation completed with ${errors.length} errors.`));
        console.log(chalk.white(`The errors have been saved to ${errorFilePath}`));

    }

    let finalOutputJSON;
    if (isFlatOutput) {

        finalOutputJSON = {};
        tempOutputData.forEach((item) => {

            finalOutputJSON = {
                ...finalOutputJSON,
                ...item
            };

        });

    } else {

        finalOutputJSON = [];
        tempOutputData.forEach((item) => {

            finalOutputJSON.push(item);

        });

    }
    await writeFile(
        outputTarget,
        JSON.stringify(
            finalOutputJSON,
            null,
            2
        )
    );
    console.log(chalk.white(`The output has been saved to ${outputTarget}`));
    return 0;

}

export {
    main
};
