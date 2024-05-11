import OpenAI from "openai";

const openai = new OpenAI();

async function ask (body) {

    return await openai.chat.completions.create(body);

}
export {
    ask
};
