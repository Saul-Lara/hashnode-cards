import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchHashnodeArticles } from '../utils/hashnode-client.js';
import { generateHashnodeCard } from '../utils/card-generator.js'

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
        
        console.log(`[Hashnode Cards] Generating cards for ${latestArticles.length} articles...`);

        // Hashnode cards generation
        const outputDir = path.join(USER_REPO_PATH, 'cards');
        const templateDir = path.join(ACTION_PATH, 'cards-templates');

        let generatedCardsInfo = []
        for (const [index, article] of latestArticles.entries()){
            let ret = await generateHashnodeCard(article, templateDir, outputDir, index + 1);
            generatedCardsInfo.push(ret);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

main()