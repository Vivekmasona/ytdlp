const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// CORS Configuration
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
        // Cobalt API Instance (High-speed & No Bot Blocks)
        const response = await axios.post('https://cobalt-api.kwippy.com/', {
            url: videoUrl,
            downloadMode: 'audio',
            audioFormat: 'mp3'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.data && response.data.url) {
            return res.json({ 
                success: true, 
                audioUrl: response.data.url 
            });
        } else {
            return res.status(500).json({ 
                error: 'Audio URL extract nahi ho paya', 
                rawResponse: response.data 
            });
        }

    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ 
            error: 'Audio extraction me dikkat aayi', 
            details: error.response ? error.response.data : error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.send('Server running!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
