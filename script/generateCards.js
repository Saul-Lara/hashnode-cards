import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

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

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

main()