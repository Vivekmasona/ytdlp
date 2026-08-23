const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const PORT = process.env.PORT || 3000;

app.post('/get-audio', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'Video URL required hai' });
    }

    try {
        const formData = new FormData();
        
        // Exact format as seen in ytdlp.online HTML response
        const formattedCommand = `'${videoUrl}' -x --audio-format mp3 --get-url -o "%(title)s.%(ext)s"`;
        
        formData.append('command', formattedCommand);
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
        
        // Output text me se googlevideo.com URL filter karna
        const urlRegex = /(https?:\/\/[^\s"'<]+googlevideo\.com[^\s"'<]+)/g;
        const match = outputText.match(urlRegex);

        if (match) {
            return res.json({ success: true, audioUrl: match[0] });
        } else {
            return res.status(500).json({ 
                error: 'Audio link terminal output me nahi mila', 
                rawOutput: outputText 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            error: 'ytdlp.online se connect karne me dikkat aayi', 
            details: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.send('Server live hai!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
