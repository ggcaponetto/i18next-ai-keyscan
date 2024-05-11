const models = Object.freeze({
    "gpt-4-turbo-2024-04-09": {
        "unit": "US$",
        "input": 10 / 1000000,
        "output": 30 / 1000000
    }
});

const promptTemplates = {
    "react-i18next": {
        "promptChain": [
            {
                "role": "system",
                "content": "You are a helpful assistant designed to output JSON."
            },
            {
                "role": "user",
                "content": "I will provide you a complete or partial source code of a file. Your job is to give me a flat json map of all the react-i18next keys passed to the translation function."
            },
            {
                "role": "user",
                "content": "I expect your output to look like: " +
                "{\"namespace:key\":true, \"cars:title\": true}" +
                "\n Please watch out for:" +
                "- Concatenated keys" +
                "- Reassigned t function" +
                "- Keys that do not have a namespace specified should appear as {\"keywithnonamespace\": true}"
            }
        ]
    }
};

export {
    models,
    promptTemplates
};
