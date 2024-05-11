import * as chai from "chai";
import {ask} from "../../src/components/openai/openai.js";
import {models, promptTemplates} from "../../src/components/constants/constants.js";
import {getPricePrediction} from "../../src/components/processor/processor.js";


let openAITimeout = 10000;
let promptChain = promptTemplates["react-i18next"].promptChain;
let modelName = Object.keys(models)[0];
let chunksLength = 1000;
const getMockData = async (textChunk) => {

    let mockInputChunk = textChunk;
    let mockSourceMap = {
        "/my/test/file.js": mockInputChunk
    };
    let pricePrediction = await getPricePrediction(
        mockSourceMap,
        promptTemplates["react-i18next"].promptChain,
        modelName,
        chunksLength
    );
    let requestBody = {
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "max_tokens": pricePrediction.totalTokens,
        "messages": [
            ...promptChain,
            {
                "role": "user",
                "content": mockInputChunk
            }
        ],
        "model": modelName
    };
    return {
        pricePrediction,
        requestBody,
        mockSourceMap,
        mockInputChunk
    };

};
describe.skip(
    "OpenAI",
    async function () {

        it(
            "ask() - Gets a response from openAI",
            async function () {

                this.timeout(openAITimeout);
                let res = await ask({
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant."
                        }
                    ],
                    "model": modelName
                });
                chai.expect(res?.choices?.[0]).to.not.equal(undefined);

            }
        );

        it(
            "ask() - is able to extract all i18next/locize keys from a partial source code string (1)",
            async function () {

                this.timeout(openAITimeout);
                let mockInputChunk =
                    `
import React from 'react';
import { useTranslation } from 'react-i18next';

export function MyComponent() {
const { t, i18n } = useTranslation(); // not passing any namespace will use the defaultNS (by default set to 'translation')
// or const [t, i18n] = useTranslation();

return <p>{t('mykey')}</p>
}
`;
                let {
                    requestBody, pricePrediction, mockSourceMap
                } = await getMockData(mockInputChunk);
                let res = await ask(requestBody);
                let parsedResponse = JSON.parse(res?.choices?.[0]?.message?.content);
                chai.expect(JSON.stringify(parsedResponse)).to.equal(JSON.stringify({"mykey": true}));

                /* We assume that the output can consume maximum the amount of tokens the input consumes.
                * This would be the case where the input file contains only labels */
                chai.expect(pricePrediction.totalTokens * 2).to.be.greaterThanOrEqual(res.usage.total_tokens);

            }
        );

        it(
            "ask() - is able to extract all i18next/locize keys from a partial source code string (2)",
            async function () {

                this.timeout(openAITimeout);
                let mockInputChunk =
                    `
import React from 'react';
import { withTranslation } from 'react-i18next';

function MyComponent({ t, i18n }) {
    let brand = "audi"
    let myTrans = t;
    return (
        <>
            <p>{t('my translated text')}</p>
            <p>{t('menu:title')}</p>
            <p>{t(\`cars:car-title-\${brand}\`)}</p>
            <p>{t("meta"+"-description")}</p>
            <p>{myTrans("page-content")}</p>
        </>
    )
}

export default withTranslation()(MyComponent);
`;
                let {
                    requestBody, pricePrediction, mockSourceMap
                } = await getMockData(mockInputChunk);

                let res = await ask(requestBody);
                let parsedResponse = JSON.parse(res?.choices?.[0]?.message?.content);
                chai.expect(JSON.stringify(parsedResponse)).to.equal(JSON.stringify({
                    "my translated text": true,
                    "menu:title": true,
                    "cars:car-title-audi": true,
                    "meta-description": true,
                    "page-content": true
                }));

                /* We assume that the output can consume maximum the amount of tokens the input consumes.
                * This would be the case where the input file contains only labels */
                chai.expect(pricePrediction.totalTokens * 2).to.be.greaterThanOrEqual(res.usage.total_tokens);

            }
        );

    }
);
