import { fetch, Agent, setGlobalDispatcher } from 'undici';

const HASHNODE_API_BASE_URL = 'https://gql.hashnode.com';

const agent = new Agent({ keepAliveTimeout: 10000 });
setGlobalDispatcher(agent);

/**
 * Fetch hashnode articles from blog host url
 * @param {string} blogHost - Hashnode blog host
 * @returns {Promise<Array>} Array of LinkedIn posts
 */

export async function fetchHashnodeArticles(blogHost){

    let maxCards = Number(process.env.MAX_CARDS_TO_GENERATE) || 4;

    let query = `
    query {
        publication(host: "${blogHost}") {
            posts(first: ${maxCards} ) {
                edges {
                    node {
                        title
                        publishedAt
                        brief
                        url
                        coverImage {
                            url
                        }
                    }
                }
            }
        }
    }`

    console.log('[Hashnode Cards] \u{1F504} Fetching articles...');

    try {
        const response = await fetch(HASHNODE_API_BASE_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch articles from Hashnode API.\n` +
                `Status code: ${response.status}`);
        }

        const data = await response.json();

        if (!data?.data?.publication) {
            throw new Error("Invalid GraphQL response from Hashnode");
        }
        
        const options = {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
        };

        return data.data.publication.posts.edges.map((data) => ({
            title: data.node.title,
            publishedAt: new Date(data.node.publishedAt).toLocaleDateString("en-US", options),
            brief: data.node.brief.replaceAll('\n', ' '),
            url: data.node.url,
            coverImage: data.node.coverImage?.url ?? null
        }))
        
    } catch (error) {
        console.error('[Hashnode Cards] \u{274C}', error.message);
        process.exit(1);
    }
}