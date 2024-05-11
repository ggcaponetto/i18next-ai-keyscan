import * as chai from "chai";
import path from "path";
import url from "url";
import {
    fetchRepository,
    getSourceCodeMap
} from "../../src/components/parser/parser.js";
import {
    getPricePrediction,
    getTokenCount,
    processSourceMap,
    splitStringIntoChunks, writeFile
} from "../../src/components/processor/processor.js";
import {URL} from "url";
import {models, promptTemplates} from "../../src/components/constants/constants.js";


const dirname = url.fileURLToPath(new URL(
    ".",
    import.meta.url
));
let modelName = Object.keys(models)[0];
let chunksLengthDefault = 10000;
const globalTimeout = 4000;
const longTaskTimeout = 10000;

describe(
    "Processor",
    () => {

        it(
            "splitStringIntoChunks() - Splits a string into chunks",
            async function () {

                let string_0 = null;
                let string_1 = "";
                let string_2 = " ";
                let string_4 = "Lorem ipsum dolor sit amet";
                let string_5 = "Hello, this is a test string. It is longer than the previous";

                let res_0_0 = splitStringIntoChunks(
                    string_0,
                    1
                );
                chai.expect(res_0_0).to.eql([]);

                let res_1_0 = splitStringIntoChunks(
                    string_1,
                    1
                );
                chai.expect(res_1_0).to.eql([]);

                chai.expect(function () {

                    splitStringIntoChunks(
                        string_1,
                        0
                    );

                }).to.throw("n must be a positive integer");

                let res_2_0 = splitStringIntoChunks(
                    string_2,
                    1
                );
                chai.expect(res_2_0).to.eql([" "]);

                let res_4_0 = splitStringIntoChunks(
                    string_4,
                    1
                );
                chai.expect(res_4_0).to.eql(string_4.split(""));

                let res_5_0 = splitStringIntoChunks(
                    string_5,
                    30
                );
                chai.expect(res_5_0).to.eql([
                    "Hello, this is a test string. ",
                    "It is longer than the previous"
                ]);

            }
        );
        it(
            "splitStringIntoChunks() - Does only process strings",
            function () {

                const badFn = function () {

                    splitStringIntoChunks(
                        1,
                        1
                    );

                };

                chai.expect(badFn).to.throw("Expecting a string as input");

            }
        );
        it(
            "getTokenCount() - The token count for a text",
            async function () {

                this.timeout(globalTimeout);
                let tokens = await getTokenCount(
                    "hello world. this is really great.",
                    modelName
                );
                chai.expect(tokens).to.be.equal(8);

            }
        );
        it(
            "getPricePrediction() - Gets the price prediction of a sourceCodeMap",
            async function () {

                this.timeout(globalTimeout);
                let mockMap = {
                    "a": "hello world. this is frikkin great.",
                    "b": "text is great",
                    "c": "another dummy text"
                };
                let prediction = await getPricePrediction(
                    mockMap,
                    promptTemplates["react-i18next"].promptChain,
                    modelName,
                    chunksLengthDefault
                );
                chai.expect(prediction.totalTokens).to.be.greaterThan(8);

            }
        );
        it(
            "getPricePrediction() - Gets the price prediction of a sourceCodeMap (local test repo)",
            async function () {

                this.timeout(globalTimeout);
                let targetDir = `${dirname}/../repositories/react-i18next`;
                let sourceMap = await getSourceCodeMap(
                    `${targetDir}`,
                    {}
                );
                // filter the content (only src files)
                let filteredSourceMap = Object.keys(sourceMap).
                    filter((key) => {

                        let passesFilter = key.startsWith(`${path.resolve(targetDir)}/src`);
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
                let prediction_variant_1 = await getPricePrediction(
                    filteredSourceMap,
                    promptTemplates["react-i18next"].promptChain,
                    modelName,
                    chunksLengthDefault
                );
                chai.expect(prediction_variant_1.totalTokens).to.be.greaterThan(1000);

                let prediction_variant_2 = await getPricePrediction(
                    filteredSourceMap,
                    promptTemplates["react-i18next"].promptChain,
                    modelName,
                    chunksLengthDefault / 2
                );
                chai.expect(prediction_variant_2.totalTokens).to.be.greaterThan(prediction_variant_1.totalTokens);

            }
        );
        it(
            "processSourceMap() - Applies an arbitrary async function to each file chunk (local test repo)",
            async function () {

                this.timeout(longTaskTimeout);
                let targetDir = `${dirname}/../repositories/react-i18next`;
                let sourceMap = await getSourceCodeMap(
                    `${targetDir}`,
                    {}
                );
                // filter the content (only src files)
                let filteredSourceMap = Object.keys(sourceMap).
                    filter((key) => {

                        let passesFilter = key.startsWith(`${path.resolve(targetDir)}/src`);
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
                let res = await processSourceMap(
                    filteredSourceMap,
                    10000,
                    async () => {

                        await new Promise((res) => {


                            setTimeout(
                                () => {

                                    // simulate an async action

                                    // console.log(`progress: ${data.progress}`);
                                    res();

                                },
                                200
                            );

                        });

                    }
                );
                chai.expect(res).to.equal(true);

            }
        );
        it(
            "processSourceMap() - Applies an arbitrary async function to each file chunk (local repo) and appends to a file on the local fs",
            async function () {

                this.timeout(longTaskTimeout);
                let outputDir = `${dirname}/../data/output/test-repo`;
                let targetDir = `${dirname}/../repositories/react-i18next`;
                let sourceMap = await getSourceCodeMap(
                    `${targetDir}`,
                    {}
                );
                // filter the content (only src files)
                let filteredSourceMap = Object.keys(sourceMap).
                    filter((key) => {

                        let passesFilter = key.startsWith(`${path.resolve(targetDir)}/src`);
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
                let res = await processSourceMap(
                    filteredSourceMap,
                    10000,
                    async (data) => {

                        let result = await new Promise((res) => {


                            setTimeout(
                                () => {

                                    // simulate an async action

                                    // console.log(`progress: ${data.progress}`);
                                    let dummyData = {data,
                                        "date": new Date().toLocaleDateString("de-CH")};
                                    res(dummyData);

                                },
                                200
                            );

                        });
                        tempOutputData.push(result);

                    }
                );
                let outputFilePath = `${path.resolve(outputDir)}/output.json`;
                await writeFile(
                    outputFilePath,
                    JSON.stringify(tempOutputData)
                );
                chai.expect(res).to.equal(true);

            }
        );

    }
);
