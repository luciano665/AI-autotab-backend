import OpenAI from "openai";
import {config} from "dotenv";

config();

//Rate limits
// 15RMP
// 1 million TPM
// 1500 RPD

interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

const GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
];

const MAX_RET = 3;
const INIT_DELAY_RET = 1000; // -> 1 second

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function tryWithRetry(
    modelName: string,
    messages: Message[],
    maxRetries: number = MAX_RET
): Promise<string> {

    let lastError: Error | null = null;

    for(let attempt = 0; attempt < maxRetries; attempt++){
        try{
            const response = await openai.chat.completions.create({
                model: modelName,
                messages: messages,
            });

            return response.choices[0].message.content || "";
        } catch(error) {
            lastError = error as Error;
            if(attempt < maxRetries -1) {
                const delay = INIT_DELAY_RET * Math.pow(2, attempt);
                console.log(`Attempt ${attempt + 1}/${maxRetries} failed for model ${modelName}. Retrying in ${delay}ms`, {error: lastError});
                await sleep(delay);
                continue;
            }
            console.error({error: lastError});
        }
    }
    throw lastError;   
}

export async function getGeminiResponse(messages: Message[]): Promise<string>{

    let lastError: Error | null = null;
    for(const modelName of GEMINI_MODELS){
        try{
            const response = await tryWithRetry(modelName, messages);
            return response;
        } catch(error){
            lastError = error as Error;
            console.log({error: lastError});
            continue;
        }
    }

    throw new Error( `All models and retries failed. Last error: ${lastError?.message}`);
}