const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
app.use(express.json());

app.get('/get-audio', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ success: false, error: "URL parameter required hai" });
    }

    let browser;
    try {
        // Chromium configuration
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto('https://ytdlp.online/', { waitUntil: 'networkidle2', timeout: 60000 });

        const command = `${videoUrl} -x --audio-format mp3 --get-url`;

        // Input field fill
        await page.waitForSelector('#urlText', { timeout: 15000 });
        await page.focus('#urlText');
        
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.type('#urlText', command);

        // Click Run
        await page.click('#download-btn');

        // Extract direct url
        let extractedAudioUrl = null;
        for (let i = 0; i < 25; i++) {
            await new Promise(r => setTimeout(r, 1000));

            const outputText = await page.evaluate(() => {
                const el = document.querySelector('#output');
                return el ? el.innerText : '';
            });

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
            return res.json({ success: true, audio_url: extractedAudioUrl });
        } else {
            return res.status(500).json({ success: false, error: "Link extract nahi ho paya" });
        }

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
