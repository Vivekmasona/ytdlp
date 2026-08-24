const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/detect', async (req, res) => {
  let { url } = req.body;

  if (!url) return res.status(400).json({ status: 'error', message: 'URL required hai' });
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      },
      timeout: 8000
    });

    const headers = response.headers;
    const html = response.data.toLowerCase();
    const tech = [];

    // Server & Headers Check
    if (headers['server']) tech.push({ name: headers['server'], categories: ['Web Server'] });
    if (headers['x-powered-by']) tech.push({ name: headers['x-powered-by'], categories: ['Backend Tech'] });

    // Cookies Check
    const cookies = headers['set-cookie'] ? headers['set-cookie'].join(' ') : '';
    if (cookies.includes('PHPSESSID')) tech.push({ name: 'PHP', categories: ['Programming Language'] });
    if (cookies.includes('csrftoken')) tech.push({ name: 'Django', categories: ['Python Framework'] });

    // HTML / Meta / Script Patterns Check
    if (html.includes('vercel')) tech.push({ name: 'Vercel', categories: ['Hosting / PaaS'] });
    if (html.includes('next/static') || html.includes('__next')) tech.push({ name: 'Next.js', categories: ['React Framework'] });
    if (html.includes('react')) tech.push({ name: 'React', categories: ['JavaScript Library'] });
    if (html.includes('wp-content')) tech.push({ name: 'WordPress', categories: ['CMS'] });
    if (html.includes('tailwind')) tech.push({ name: 'Tailwind CSS', categories: ['CSS Framework'] });

    return res.json({
      status: 'success',
      target: url,
      technologies: tech
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Website check karne me dikkat aayi. Website ne access block kiya ho sakta hai.',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


