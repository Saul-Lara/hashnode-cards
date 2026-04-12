import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchHashnodeArticles } from '../utils/hashnode-client.js';
import { generateHashnodeCards } from '../utils/card-generator.js';
import { updateReadme } from '../utils/readme-updater.js';

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
            throw new Error("No articles were returned from the Hashnode API");
        }
        
        console.log(`[Hashnode Cards] \u{1F3A8} Generating cards for ${latestArticles.length} articles...`);

        // Hashnode cards generation
        const cardType = process.env.CARD_TYPE || "large";
        const configCardGenerator = {
            templateDir: path.join(ACTION_PATH, 'cards-templates'),
            outputDir: path.join(USER_REPO_PATH, 'cards'),
        };

        let generatedCardsInfo = await generateHashnodeCards(latestArticles, cardType, configCardGenerator);

        // Update README
        const readmePath = path.join(USER_REPO_PATH, 'README.md');
        updateReadme(readmePath, generatedCardsInfo);
    } catch (error) {
        console.error('[Hashnode Cards] \u{274C}', error.message);
        process.exit(1);
    }
};

main()