const axios = require('axios');
const FormData = require('form-data');

async function getAudioUrl(youtubeUrl) {
    try {
        const formData = new FormData();
        // Exact form parameters jo website browser se bhejti hai
        formData.append('command', `-x --audio-format mp3 --get-url "${youtubeUrl}"`);
        formData.append('type', 'stable');

        const response = await axios.post('https://ytdlp.online/run', formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://ytdlp.online',
                'Referer': 'https://ytdlp.online/'
            }
        });

        const outputText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        // Response me se googlevideo.com ka direct link extract karna
        const urlRegex = /(https?:\/\/[^\s"'<]+googlevideo\.com[^\s"'<]+)/g;
        const match = outputText.match(urlRegex);

        if (match) {
            return match[0];
        } else {
            throw new Error("Audio URL terminal output me nahi mila");
        }
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

// Check karne ke liye:
getAudioUrl("https://youtu.be/Kx4c66-GjgE").then(url => console.log("Extracted Audio Link:\n", url));
