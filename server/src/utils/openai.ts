import OpenAI from "openai";
import 'dotenv/config'

export const openai = new OpenAI({
    baseURL:process.env.LLM_BASE_URL,
    apiKey:process.env.LLM_KEY
})
