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
 * Generate SVG card for a hashnode article
 * @param {Object} article - Hashnode blog article object
 * @param {string} templateDir - Directory containing SVG templates
 * @param {string} outputDir - Directory to save generated cards
 * @param {string} index - Index of the article
 * @returns {Promise<Object>} Object with card filename and article url
 */

export async function generateHashnodeCard(article, templateDir, outputDir, index) {
	const templatePath = path.join(templateDir, "simple-card.svg");
	let template = fs.readFileSync(templatePath, "utf8");

	template = template.replace(/\$\{article.title\}/g, article.title);
	template = template.replace(/\$\{article.publishedAt\}/g, article.publishedAt);
	template = template.replace(/\$\{article.brief\}/g, article.brief);

	let coverImage = await fetchImageAsBase64(article.coverImage);
	template = template.replace(/\$\{article.coverImage\}/g, coverImage);

	let cardName = `hashnode-article-card-${index}.svg`;
	const outputPath = path.join(outputDir, cardName);
	fs.writeFileSync(outputPath, template, "utf8");

	return {
		articleCardName: cardName,
		articleUrl: article.url,
	};
}