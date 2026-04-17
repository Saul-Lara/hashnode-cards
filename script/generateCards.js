import dotenv from 'dotenv';
import fs, { stat } from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchHashnodeArticles, fetchHashnodeFullStats } from '../utils/hashnode-client.js';
import { generateHashnodeCards, generateHashnodeStatsCard } from '../utils/card-generator.js';
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

        // Hashnode stats card generation
        const statsEnabled = process.env.HASHNODE_STATS === "true";
        if(statsEnabled){
            let hashnodeStats = {};
            const statsMode = process.env.HASHNODE_STATS_MODE || "partial";
            const allowedModes = ["partial", "full"];

            if (!allowedModes.includes(statsMode)) {
                throw new Error(`Invalid stats mode value: ${statsMode}`);
            }

            if(statsMode == "partial"){
                hashnodeStats = {
                    statsMode: `Last ${latestArticles.length} articles`,
                    articles: latestArticles.length,
                    views: latestArticles.reduce((acc, article) => acc + article.views, 0),
                    reactions: latestArticles.reduce((acc, article) => acc + article.reactions, 0),
                    readingTime: latestArticles.reduce((acc, article) => acc + article.readTime, 0)
                };
            }else if(statsMode == "full"){
                hashnodeStats = await fetchHashnodeFullStats(process.env.HASHNODE_BLOG_HOST);
            }
            
            await generateHashnodeStatsCard(hashnodeStats, configCardGenerator);
        }

        // Update README
        const readmePath = path.join(USER_REPO_PATH, 'README.md');
        updateReadme(readmePath, generatedCardsInfo);
    } catch (error) {
        console.error('[Hashnode Cards] \u{274C}', error.message);
        process.exit(1);
    }
};

main()