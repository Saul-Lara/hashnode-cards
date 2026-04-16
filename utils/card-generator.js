import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import sharp from 'sharp';

/**
 * Fetch an image from a URL, resize it, and convert it to base64
 * @param {string} url - Image URL
 * @returns {Promise<string>} Base64 encoded image with data URI prefix
 */

async function fetchImageAsBase64(url) {
	const client = url.startsWith('https') ? https : http;
    
	return new Promise((resolve, reject) => {
        client.get(url, async (res) => {
			if (res.statusCode !== 200) {
				reject(new Error(`Request failed with status ${res.statusCode}`));
			}
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', async () => {
				try {
					const buffer = Buffer.concat(data);
					let imageResized = await sharp(buffer).resize({ width: 540}).jpeg({ quality: 70 }).toBuffer();
					resolve(`data:image/jpeg;base64,${imageResized.toString('base64')}`);
				} catch (error) {
					reject(error)
				}
            });
        }).on('error', reject);
    });
}

/**
 * Get the SVG template for the selected card type
 * @param {string} templateDir - Path to the directory containing SVG templates
 * @param {string} cardType - Card type to generate (e.g., "large", "horizontal", "hashnodeStats")
 * @returns {string} Raw SVG template as a string
 */

function getCardTypeTemplate(templateDir, cardType){
	let templatePath;

	switch(cardType){
		case "large":
			templatePath = path.join(templateDir, "simple-card.svg");
			break;

		case "horizontal":
			templatePath = path.join(templateDir, "horizontal-card.svg");
			break;

		case "hashnodeStats":
			templatePath = path.join(templateDir, "hashnode-stats-card.svg");
			break;
	}

	return fs.readFileSync(templatePath, "utf8");
}

/**
 * Generates an SVG card for a Hashnode article
 * @param {Object} article - Hashnode article data
 * @param {string} templateDir - Path to the directory containing SVG templates
 * @param {string} outputDir - Path to the directory where generated cards will be saved
 * @param {number} index - Position of the article in the list
 * @param {string} cardType - Type of card to generate
 * @returns {Promise<{ articleCardName: string, articleUrl: string }>} Generated card metadata
 */

async function generateHashnodeCard(article, templateDir, outputDir, index, cardType) {
	console.log(`[Hashnode Cards] \u{1F9E9} Generating card ${index}`);

	let template = getCardTypeTemplate(templateDir, cardType);

	template = template.replace(/\$\{article.title\}/g, article.title);
	template = template.replace(/\$\{article.publishedAt\}/g, article.publishedAt);
	template = template.replace(/\$\{article.brief\}/g, article.brief);

	let coverImage = await fetchImageAsBase64(article.coverImage);
	template = template.replace(/\$\{article.coverImage\}/g, coverImage);

	let cardName = `hashnode-article-card-${index}.svg`;
	const outputPath = path.join(outputDir, cardName);
	fs.writeFileSync(outputPath, template, "utf8");

	return {
		articleCardName: `hashnode-article-card-${index}`,
		articleUrl: article.url,
	};
}

/**
 * Generates SVG cards for Hashnode articles
 * @param {Array} articles - Hashnode blog articles
 * @param {string} cardType - Type of card to generate
 * @param {Object} config - Card generator configuration
 * @returns {Promise<Array<{ articleCardName: string, articleUrl: string }>>} Generated cards metadata
 */

export async function generateHashnodeCards(articles, cardType, config) {
	let cardsInfo = []

	for (const [index, article] of articles.entries()){
		let cardInfo = await generateHashnodeCard(article, config.templateDir, config.outputDir, index + 1, cardType);
		cardsInfo.push(cardInfo);
	}

	return cardsInfo;
}

/**
 * Generates an SVG card for Hashnode stats
 * @param {Object} hashnodeStats - Hashnode statistics
 * @param {Object} config - Card generator configuration
 * @returns {Promise<void>}
 */
export async function generateHashnodeStatsCard(hashnodeStats, config){
	console.log(`[Hashnode Cards] \u{1F4CA} Generating Hashnode stats card`);

	let template = getCardTypeTemplate(config.templateDir, "hashnodeStats");

	template = template.replace(/\$\{statsMode\}/g, hashnodeStats.statsMode);
	template = template.replace(/\$\{articlesCount\}/g, hashnodeStats.articles);
	template = template.replace(/\$\{articlesReactionsCount\}/g, hashnodeStats.reactions);
	template = template.replace(/\$\{articlesTotalViews\}/g, hashnodeStats.views);
	template = template.replace(/\$\{articlesTotalReadTime\}/g, hashnodeStats.readingTime);

	let cardName = "hashnode-stats-card.svg";
	const outputPath = path.join(config.outputDir, cardName);
	fs.writeFileSync(outputPath, template, "utf8");
}