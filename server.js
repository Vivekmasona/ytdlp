const express = require('express');
const cors = require('cors');
const Wappalyzer = require('wappalyzer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Wappalyzer configuration options
const options = {
  debug: false,
  delay: 1000,
  maxDepth: 1,
  maxUrls: 1,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// API Endpoint to check URL
app.post('/api/detect', async (req, res) => {
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ status: 'error', message: 'URL required hai' });
  }

  // URL me http/https nahi hai toh add karein
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const wappalyzer = new Wappalyzer(options);

  try {
    await wappalyzer.init();
    const site = await wappalyzer.open(url);
    const results = await site.analyze();

    // Data ko categorize karke filter karna
    const technologies = results.technologies.map(tech => ({
      name: tech.name,
      categories: tech.categories.map(c => c.name),
      confidence: tech.confidence,
      version: tech.version || null,
      icon: tech.icon || null
    }));

    await wappalyzer.destroy();

    return res.json({
      status: 'success',
      target: url,
      total_detected: technologies.length,
      technologies: technologies
    });

  } catch (error) {
    if (wappalyzer) {
      await wappalyzer.destroy();
    }
    return res.status(500).json({
      status: 'error',
      message: 'Website check karne me dikkat aayi',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
