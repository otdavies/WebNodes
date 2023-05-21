import axios from 'axios';
var OpenAIEngine;
(function (OpenAIEngine) {
    OpenAIEngine["DAVINCI"] = "davinci";
    OpenAIEngine["GPT3"] = "";
    OpenAIEngine["GPT4"] = "";
})(OpenAIEngine || (OpenAIEngine = {}));
class OpenAI {
    constructor(engine) {
        // Check if API key is saved in session storage
        let sessionKey = sessionStorage.getItem('openai-api-key');
        if (sessionKey) {
            OpenAI.API_KEY = sessionKey;
        }
        OpenAI.API_URL = `https://api.openai.com/v1/engines/${engine}/completions`;
    }
    async generateResponse(prompt) {
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
        let response;
        try {
            response = await axios.post(OpenAI.API_URL, data, config);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
        // Assuming the response data has a field called 'choices' which is an array containing the generated text.
        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].text;
        }
        else {
            throw new Error('No response generated.');
        }
    }
}
OpenAI.API_URL = '';
OpenAI.API_KEY = ''; // replace with your actual OpenAI key
