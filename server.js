const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/get-audio', async (req, res) => {
    const { videoUrl } = req.body;

    // Log 1: Check request arrival
    console.log("=== NEW REQUEST RECEIVED ===");
    console.log("Target Video URL:", videoUrl);

    if (!videoUrl) {
        return res.status(400).json({ error: 'Video URL is required' });
    }

    try {
        const formData = new FormData();
        formData.append('command', `-x --audio-format mp3 --get-url "${videoUrl}"`);
        formData.append('type', 'stable');

        console.log("Sending request to ytdlp.online/run...");

        const response = await axios.post('https://ytdlp.online/run', formData, {
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://ytdlp.online',
                'Referer': 'https://ytdlp.online/'
            }
        });

        // Log 2: Website Status Code
        console.log("ytdlp.online Response Status:", response.status);
        console.log("Raw Output Data:", JSON.stringify(response.data));

        const outputText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        const urlRegex = /(https?:\/\/[^\s"'<]+googlevideo\.com[^\s"'<]+)/g;
        const match = outputText.match(urlRegex);

        if (match) {
            console.log("Extracted Audio URL successfully!");
            return res.json({ success: true, audioUrl: match[0] });
        } else {
            console.log("Regex Failed: No googlevideo link found in response.");
            return res.status(500).json({ error: 'Audio URL link me nahi mila', rawResponse: outputText });
        }
    } catch (error) {
        // Log 3: Error Trace
        console.error("Error connecting to ytdlp.online:", error.message);
        if (error.response) {
            console.error("Website Error Data:", error.response.data);
        }
        return res.status(500).json({ 
            error: 'Failed to communicate with ytdlp.online', 
            details: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.send('Server is running live!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
