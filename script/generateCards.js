import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchHashnodeArticles } from '../utils/hashnode-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ACTION_PATH = path.join(__dirname, '..');
const USER_REPO_PATH = process.env.GITHUB_WORKSPACE || process.cwd();

dotenv.config();

const main = async () => {

    try {
        // Validate that the cards directory exists
        const cardsDir = path.join(USER_REPO_PATH, 'cards');
        if (!fs.existsSync(cardsDir)) {
            fs.mkdirSync(cardsDir, { recursive: true });
        }

        // Fetch latest articles from your hashnode blog
        const latestArticles = await fetchHashnodeArticles(process.env.HASHNODE_BLOG_HOST);

        if (!latestArticles || latestArticles.length === 0) {
            throw new Error("No articles found from Hashnode API");
        }
        
        console.log(`Generating cards for ${latestArticles.length} articles...`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

main()