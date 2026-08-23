const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

// Express Server Port for Render deployment
const PORT = process.env.PORT || 3000;

app.post('/get-audio', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'Video URL is required' });
    }

    try {
        const formData = new FormData();
        formData.append('command', `-x --audio-format mp3 --get-url "${videoUrl}"`);
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
        
        // Response me se googlevideo.com link match karna
        const urlRegex = /(https?:\/\/[^\s"'<]+googlevideo\.com[^\s"'<]+)/g;
        const match = outputText.match(urlRegex);

        if (match) {
            return res.json({ success: true, audioUrl: match[0] });
        } else {
            return res.status(500).json({ error: 'Audio URL extract nahi ho paya', rawResponse: outputText });
        }
    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to communicate with ytdlp.online', 
            details: error.response ? error.response.data : error.message 
        });
    }
});

// Root endpoint test karne ke liye
app.get('/', (req, res) => {
    res.send('Server is running live!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
