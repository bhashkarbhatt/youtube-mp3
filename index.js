const express = require('express');
const fs = require('fs');
const ytdl = require('ytdl-core');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Route to serve the main HTML form
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube to MP3 Downloader</title>
        </head>
        <body>
            <h1>YouTube to MP3 Downloader</h1>
            <form action="/download" method="post">
                <label for="youtubeUrls">YouTube URLs (one per line):</label>
                <textarea id="youtubeUrls" name="youtubeUrls" rows="10" cols="50" required></textarea>
                <br><br>
                <input type="submit" value="Download as MP3">
            </form>
        </body>
        </html>
    `);
});

// Route to handle the download request
app.post('/download', async (req, res) => {
    const { youtubeUrls } = req.body;
    const urls = youtubeUrls.split('\n').map(url => url.trim()).filter(url => url);
    const outputDirectory = path.join(__dirname, 'downloads');

    // Ensure the downloads directory exists
    fs.mkdirSync(outputDirectory, { recursive: true });

    try {
        for (let youtubeUrl of urls) {
            if (!youtubeUrl) continue;
            // Get video info
            const info = await ytdl.getInfo(youtubeUrl);
            const videoTitle = info.videoDetails.title.replace(/[<>:"\/\\|?*]+/g, ''); // Clean up title
            const outputFilePath = path.join(outputDirectory, `${videoTitle}.mp3`);

            // Log the start of the download process
            console.log(`Starting download: ${youtubeUrl} as ${outputFilePath}`);

            // Download and save the MP3 file
            await new Promise((resolve, reject) => {
                ytdl(youtubeUrl, { filter: 'audioonly' })
                    .pipe(fs.createWriteStream(outputFilePath))
                    .on('finish', () => {
                        console.log(`Finished download: ${outputFilePath}`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`Error downloading ${youtubeUrl}: ${err.message}`);
                        reject(err);
                    });
            });
        }

        res.send(`
            <p>All videos downloaded and saved as MP3s. Check the downloads folder.</p>
            <button onclick="window.location.href='/'">Go to Home Page</button>
        `);
    } catch (error) {
        res.status(500).send(`Failed to download videos: ${error.message}`);
    }
});

// Route to serve the downloaded file
app.get('/download-file', (req, res) => {
    const filePath = req.query.filename;
    res.download(filePath, err => {
        if (err) {
            res.status(500).send(`Failed to download file: ${err.message}`);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
