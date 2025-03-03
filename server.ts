import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import { getGeminiResponse } from './gemini';
import {GoogleGenerativeAI} from '@google/generative-ai';

//Load env variables
config();

type Message = {
    role: "system" | "user" | "assistant"
    content: string
}

//Init Express app
const app = express();
const port = process.env.PORT || 3000

// Middleware
app.use(cors());
app.use(express.json())


// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')


//Gemini chat enpoint
app.post('/api/chat', async (req, res) => {
    try{
        const {message, context={}} = req.body

        if(!message){
            res.status(400).json({error: "Message is required"});
            return;
        }

        const messages: Message[] = [
            {
                role: "system",
                content: `You are an AI writing assistant. Complete the user's text naturally, continuing
                their thought or sentence. Respond ONLY with the completion text, no explanations or additional content. Keep the completion concise and relevant
                
                Current webpage contex:
                ${JSON.stringify(context)}`
            },
            {
                role: "user",
                content: message
            }
        ]

        console.log(messages);

        const result = await getGeminiResponse(messages);
        
        res.json({response: result})
    } catch(error) {
        console.error('Error in chat endpoint', error)
        res.status(500).json({error: 'Internal server error'})
    }
})


//Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})

