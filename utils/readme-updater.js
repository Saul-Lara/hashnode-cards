import fs from 'fs';
import path from 'path';

/**
 * Update README.md with generated Hashnode cards links
 * @param {string} readmePath - Path to README.md file
 * @param {Array} generatedCardsInfo - Array of card data objects with timestamp and url
 */
export function updateReadme(readmePath, generatedCardsInfo){
    if (!fs.existsSync(readmePath)) {
        throw new Error(
            `README.md not found at:\n${readmePath}\n\n` + 
            `This action requires a README.md file in the repository root.`
        );
    }

    console.log('[Hashnode Cards] \u{1F4C4} Reading README.md from: \n', readmePath);
    let readme = fs.readFileSync(readmePath, 'utf8');
    
    // Generate new content
    let generatedCards = generatedCardsInfo.map((card, index) => {
        let cardPath =`cards/${card.articleCardName}.svg`;

        return `  <a href="${card.articleUrl}">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="${cardPath}">
      <img alt="Hashnode Card ${index + 1}" src="${cardPath}">
    </picture>
  </a>`;
    }).join('\n');

    let newContent = `<p align="center">\n${generatedCards}\n</p>`;
    
    const START_MARKER = '<!-- HASHNODE-CARDS:START -->';
    const END_MARKER = '<!-- HASHNODE-CARDS:END -->';
    
    console.log('[Hashnode Cards] \u{1F50D} Looking for the required markers...');

    const beginIndex = readme.indexOf(START_MARKER);
    const endIndex = readme.indexOf(END_MARKER);

    console.log(' - Start marker:', START_MARKER, beginIndex !== -1 ? '\u{2705}' : '\u{274C}');
    console.log(' - End marker:', END_MARKER, endIndex !== -1 ? '\u{2705}' : '\u{274C}');

    if(beginIndex === -1 || endIndex === -1){
        if(beginIndex === -1 && endIndex === -1){
            throw new Error(
                `Required markers were not found in README.md\n\n` +
                `Please add the following markers inside your README.md: \n` +
                `${START_MARKER}\n` +
                `${END_MARKER}`
            );
        }

        if(beginIndex === -1 && endIndex !== -1){
            throw new Error(
                `Required marker ${START_MARKER} was not found in README.md\n\n` +
                `Please add the missing marker to your README.md: \n` + `${START_MARKER}`);
        }

        if(beginIndex !== -1 && endIndex === -1){
            throw new Error(
                `Required marker ${END_MARKER} was not found in README.md\n\n` +
                `Please add the missing marker to your README.md: \n` + `${END_MARKER}`);
        }
    }

    const regex = new RegExp(`(${START_MARKER})([\\s\\S]*?)(${END_MARKER})`, 'g');
    readme = readme.replace(regex, `$1\n${newContent}\n$3`);

    fs.writeFileSync(readmePath, readme, 'utf8');
    console.log('[Hashnode Cards] \u{2705} README updated with generated cards');
}