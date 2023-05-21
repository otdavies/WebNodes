import axios from 'axios';
import { AxiosResponse } from 'axios';

enum OpenAIEngine {
    DAVINCI = 'davinci',
    GPT3 = '',
    GPT4 = '',
}

class OpenAI {
    private static API_URL: string = '';
    private static API_KEY: string = ''; // replace with your actual OpenAI key

    constructor(engine: OpenAIEngine) {
        // Check if API key is saved in session storage
        let sessionKey = sessionStorage.getItem('openai-api-key');
        if (sessionKey) {
            OpenAI.API_KEY = sessionKey;
        }
        OpenAI.API_URL = `https://api.openai.com/v1/engines/${engine}/completions`;
    }

    async generateResponse(prompt: string): Promise<string> {
        const data = {
            prompt,
            max_tokens: 100,
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OpenAI.API_KEY}`
            }
        };

        let response: AxiosResponse;
        try {
            response = await axios.post(OpenAI.API_URL, data, config);
        } catch (error) {
            console.error(error);
            throw error;
        }

        // Assuming the response data has a field called 'choices' which is an array containing the generated text.
        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].text;
        } else {
            throw new Error('No response generated.');
        }
    }
}