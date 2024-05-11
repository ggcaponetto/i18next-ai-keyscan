import {encodingForModel} from "js-tiktoken";
import {writeFile as fsWriteFile, mkdir} from "fs/promises";
import {dirname} from "path";
import log from "loglevel";
import {models} from "../constants/constants.js";

async function getPricePrediction (
    sourceCodeMap,
    promptChain,
    modelName,
    chunksLength
) {

    const encoding = await getEncoding(modelName);
    let totalTokens = 0;
    let keys = Object.keys(sourceCodeMap);
    let tokenMap = {};
    for (let i = 0; i < keys.length; i++) {

        let key = keys[i];
        let text = sourceCodeMap[key];
        let textChunks = splitStringIntoChunks(
            text,
            chunksLength
        );

        let filePrice = 0;
        let fileTotalTokenCount = 0;

        let chunkInfos = [];
        for (let j = 0; j < textChunks.length; j++) {

            let chunkOfText = textChunks[j];
            let chunkTokenCount = await getTokenCount(
                chunkOfText,
                modelName,
                encoding
            );
            let promptTokenCount = await getTokenCount(
                JSON.stringify(promptChain),
                modelName,
                encoding
            );
            fileTotalTokenCount += chunkTokenCount + promptTokenCount;
            let chunkPrice = models[modelName].input * chunkTokenCount;
            filePrice += chunkPrice;
            chunkInfos.push({
                "chunkIndex": j,
                promptTokenCount,
                chunkTokenCount
            });

        }
        totalTokens += fileTotalTokenCount;
        tokenMap[key] = {
            "unit": models[modelName].unit,
            "price": filePrice.toFixed(4),
            "fileTotalTokenCount": fileTotalTokenCount,
            "chunkCount": textChunks.length,
            chunkInfos
        };

    }
    let totalPrice = (models[modelName].input * totalTokens).toFixed(4);
    return {
        "unit": models[modelName].unit,
        totalPrice,
        totalTokens,
        tokenMap
    };

}

async function getTokenCount (text, modelName, encoding) {

    const enc = encoding !== undefined
        ? encoding
        : await getEncoding(modelName);
    return enc.encode(text).length;

}
async function getEncoding (modelName) {

    return await encodingForModel(modelName);

}


function splitStringIntoChunks (str, chunksLength) {

    if (str === null) return [];
    if (str === undefined) return [];
    if (typeof str !== "string") {

        throw new Error("Expecting a string as input");

    }
    if (chunksLength <= 0) {

        throw new Error("n must be a positive integer");

    }
    const result = [];
    for (let i = 0; i < str.length; i += chunksLength) {

        result.push(str.substring(
            i,
            i + chunksLength
        ));

    }
    return result;

}


/**
 * @param {object} sourceCodeMap
 * @param {number} chunksLength
 * @param {function} processFunction
 */
async function processSourceMap (sourceCodeMap, chunksLength, processFunction) {

    let keys = Object.keys(sourceCodeMap);
    for (let i = 0; i < keys.length; i++) {

        let key = keys[i];
        let text = sourceCodeMap[key];
        let textChunks = splitStringIntoChunks(
            text,
            chunksLength
        );

        for (let j = 0; j < textChunks.length; j++) {

            let chunkOfText = textChunks[j];
            let keysProgressPercentage = ((i + 1) / keys.length * 100).toFixed(2);
            let chunksProgressPercentage = ((j + 1) / textChunks.length * 100).toFixed(2);
            let data = {
                chunkOfText,
                key,
                "keyIndex": i,
                "keyLength": keys.length,
                "chunkIndex": j,
                "chunkLength": textChunks.length,
                "progress": `Keys: ${keysProgressPercentage}% - Chunks: ${chunksProgressPercentage}% - Key: ${key}`
            };
            await processFunction(data);

        }


    }

    return true;

}

// Function to create directories recursively
const createDirectory = async (path) => {

    try {

        await mkdir(
            path,
            {"recursive": true}
        );

    } catch (error) {

        log.error(
            `Error creating directory ${path}:`,
            error
        );

    }

};

async function writeFile (filePath, jsonString) {

    const directoryPath = dirname(filePath);
    await createDirectory(directoryPath); // Create directories recursively
    await fsWriteFile(
        filePath,
        jsonString,
        "utf-8"
    );

}

export {
    processSourceMap,
    splitStringIntoChunks,
    getTokenCount,
    getPricePrediction,
    writeFile
};
