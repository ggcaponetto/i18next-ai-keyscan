import simpleGit from "simple-git";
import {promises as fs} from "fs";
import path from "path";

/**
 * @param {string} dir
 * @param {object} [contentMap={}] contentMap - The initial map that holds the source code
 */
async function getSourceCodeMap (dir, contentMap = {}) {

    // Read all entries in the directory
    const entries = await fs.readdir(
        dir,
        {"withFileTypes": true}
    );

    // Iterate through each entry
    let entriesMap = {};
    for (let entry of entries) {

        const entryPath = path.join(
            dir,
            entry.name
        );
        if (entry.isDirectory()) {

            // Recurse into the directory
            let newContentMap = await getSourceCodeMap(
                entryPath,
                entriesMap
            );
            entriesMap = {
                ...entriesMap,
                ...newContentMap
            };

        } else {

            // Read and print the file contents
            const fileContent = await fs.readFile(
                entryPath,
                "utf8"
            );
            entriesMap = {
                ...contentMap,
                ...entriesMap,
                [entryPath]: fileContent
            };

        }

    }
    return {
        ...contentMap,
        ...entriesMap
    };

}


/**
 * @param {string} repoPath
 * @param {string} destinationPath
 */
async function fetchRepository (repoPath, destinationPath) {

    await fs.rm(
        destinationPath,
        {
            "recursive": true,
            "force": true
        }
    );
    let cloneRes = simpleGit().clone(
        repoPath,
        destinationPath
    );
    return cloneRes;

}

export {
    getSourceCodeMap,
    fetchRepository
};
