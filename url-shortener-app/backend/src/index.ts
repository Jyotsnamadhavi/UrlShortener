import "reflect-metadata";
import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';  //I have used nanoid to generate a random slug of 6 characters. Since this is small application, I have not used any other medthod like counter approach with hashing for generating unique ids.
import rateLimit from 'express-rate-limit';
import { validateUrl } from './utils/urlValidator';
import { AppDataSource } from './config/database';
import { Url } from './entities/Url';

const app = express();
const port = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log("In-memory database initialized");
    })
    .catch((error) => {
        console.error("Error initializing database:", error);
    });

// Routes
app.post('/api/shorten', async (req, res) => {
    const { longUrl, customSlug } = req.body;
    
    if (!longUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!validateUrl(longUrl)) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    try {
        const urlRepository = AppDataSource.getRepository(Url);
        let slug = customSlug || nanoid(6); //I have used nanoid to generate a random slug of 6 characters. Since this is small application, I have not used any other medthod like counter approach with hashing for generating unique ids.

        // Check if custom slug is already taken
        if (customSlug) {
            const existingUrl = await urlRepository.findOne({ where: { slug } });
            if (existingUrl) {
                return res.status(400).json({ error: 'Custom slug already taken' });
            }
        }

        const urlEntry = urlRepository.create({
            shortUrl: `http://localhost:3001/${slug}`,
            longUrl,
            slug
        });

        await urlRepository.save(urlEntry);
        res.json(urlEntry);
    } catch (error) {
        console.error('Error creating short URL:', error);
        res.status(500).json({ error: 'Error creating short URL' });
    }
});

app.get('/api/urls', async (req, res) => {
    try {
        const urlRepository = AppDataSource.getRepository(Url);
        const urls = await urlRepository.find({
            order: { createdAt: 'DESC' }
        });
        res.json(urls);
    } catch (error) {
        console.error('Error fetching URLs:', error);
        res.status(500).json({ error: 'Error fetching URLs' });
    }
});

app.get('/api/urls/:slug', async (req, res) => {
    try {
        const urlRepository = AppDataSource.getRepository(Url);
        const url = await urlRepository.findOne({ where: { slug: req.params.slug } });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        res.json(url);
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).json({ error: 'Error fetching URL' });
    }
});

app.put('/api/urls/:slug', async (req, res) => {
    try {
        const urlRepository = AppDataSource.getRepository(Url);
        const { newSlug } = req.body;
        const url = await urlRepository.findOne({ where: { slug: req.params.slug } });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        if (newSlug && newSlug !== req.params.slug) {
            const existingUrl = await urlRepository.findOne({ where: { slug: newSlug } });
            if (existingUrl) {
                return res.status(400).json({ error: 'New slug already taken' });
            }
            url.slug = newSlug;
            url.shortUrl = `http://localhost:3001/${newSlug}`;
        }

        await urlRepository.save(url);
        res.json(url);
    } catch (error) {
        console.error('Error updating URL:', error);
        res.status(500).json({ error: 'Error updating URL' });
    }
});

app.get('/:slug', async (req, res) => {
    try {
        const urlRepository = AppDataSource.getRepository(Url);
        const url = await urlRepository.findOne({ where: { slug: req.params.slug } });

        if (!url) {
            return res.status(404).render('404');
        }

        // Increment visit count
        url.visits += 1;
        await urlRepository.save(url);

        res.redirect(url.longUrl);
    } catch (error) {
        console.error('Error redirecting:', error);
        res.status(500).json({ error: 'Error redirecting to URL' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 