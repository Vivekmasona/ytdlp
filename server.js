const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

// API Endpoint
app.get('/get-audio', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ success: false, error: "YouTube URL zaroori hai" });
    }

    let browser;
    try {
        // Headless browser start karein (Background me chalega)
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Website open karein
        await page.goto('https://ytdlp.online/', { waitUntil: 'networkidle2' });

        // Command format karein (URL + direct link extraction flags)
        const command = `${videoUrl} -x --audio-format mp3 --get-url`;

        // Input field me text enter karein
        await page.waitForSelector('#urlText');
        await page.focus('#urlText');
        
        // Existing text clear karke naya command dalein
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.type('#urlText', command);

        // Run Button Click Karein
        await page.click('#download-btn');

        // Output me google video ka link aane ka wait karein (Max 20 sec)
        let extractedAudioUrl = null;
        const maxRetries = 20;

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 1000)); // 1 sec delay

            // Output box ka text extract karein
            const outputText = await page.evaluate(() => {
                const el = document.querySelector('#output');
                return el ? el.innerText : '';
            });

            // Check karein ki link aa gaya ya nahi
            if (outputText.includes('googlevideo.com/videoplayback')) {
                const lines = outputText.split('\n');
                for (let line of lines) {
                    if (line.includes('googlevideo.com/videoplayback')) {
                        extractedAudioUrl = line.trim();
                        break;
                    }
                }
            }

            if (extractedAudioUrl) break;
        }

        await browser.close();

        if (extractedAudioUrl) {
            return res.json({
                success: true,
                audio_url: extractedAudioUrl
            });
        } else {
            return res.status(500).json({ success: false, error: "Link extract nahi ho paya, try again." });
        }

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
