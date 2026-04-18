import { fetch, Agent, setGlobalDispatcher } from 'undici';

const HASHNODE_API_BASE_URL = 'https://gql.hashnode.com';

const agent = new Agent({ keepAliveTimeout: 10000 });
setGlobalDispatcher(agent);

/**
 * Fetch hashnode articles from blog host url
 * @param {string} blogHost - Hashnode blog host
 * @returns {Promise<Object>} Object with Hashnode articles
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
                        readTimeInMinutes
                        views
                        reactionCount
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
            views: data.node.views,
            reactions: data.node.reactionCount,
            readTime: data.node.readTimeInMinutes,
            coverImage: data.node.coverImage?.url ?? null
        }))
        
    } catch (error) {
        console.error('[Hashnode Cards] \u{274C}', error.message);
        process.exit(1);
    }
}

/**
 * Fetches full Hashnode statistics for a given blog host and map the response to compute totals
 * @param {string} blogHost - Hashnode blog host
 * @returns {Promise<Object>} Object with Hashnode full stats
 */

export async function fetchHashnodeFullStats(blogHost){
    console.log('[Hashnode Cards] \u{1F504} Fetching full Hashnode statistics...');
    let articlesStats = await fetchAllHashnodeStatsPages(blogHost, 20);

    return {
        statsMode: "All the articles",
        articles: articlesStats.length,
        views: articlesStats.reduce((acc, article) => acc + article.views, 0),
        reactions: articlesStats.reduce((acc, article) => acc + article.reactions, 0),
        readingTime: articlesStats.reduce((acc, article) => acc + article.readTime, 0)
    };
}

/**
 * Fetches and aggregates full Hashnode statistics for a given blog host using pagination
 * @param {string} blogHost - Hashnode blog host
 * @param {number} limit - Number of items to fetch per request
 * @param {string|null} cursor - Cursor for pagination (null for the first request)
 * @param {Array<Object>} articlesStats - Accumulator for article statistics across pages
 * @returns {Promise<{views: number, reactions: number, readingTime: number}>} Object with Hashnode full stats
 */
async function fetchAllHashnodeStatsPages(blogHost, limit, cursor = null, articlesStats = []) {
    let query = `
    query($host: String!, $limit: Int!, $cursor: String) {
        publication(host: $host) {
            posts(first: $limit, after: $cursor) {
                edges {
                    node {
                        readTimeInMinutes
                        views
                        reactionCount
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
    }`

    const queryVariables = {
        host: blogHost,
        limit: limit,
        cursor: cursor || null
    }
    
    try {
        const response = await fetch(HASHNODE_API_BASE_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ query: query, variables: queryVariables }),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch stats from Hashnode API.\n` +
                `Status code: ${response.status}`);
        }

        const data = await response.json();

        if (!data?.data?.publication) {
            throw new Error("Invalid GraphQL response from Hashnode");
        }

        let articlesData = data.data.publication.posts.edges.map((data) => ({
            views: data.node.views,
            reactions: data.node.reactionCount,
            readTime: data.node.readTimeInMinutes,
        }))

        const updatedArticleStats = [...articlesStats, ...articlesData];
        
        if(data.data.publication.posts.pageInfo.hasNextPage){
            cursor = data.data.publication.posts.pageInfo.endCursor;
            console.log(typeof cursor);
            return fetchAllHashnodeStatsPages(blogHost, limit, cursor, updatedArticleStats);
        }
        
        return updatedArticleStats;
        
    } catch (error) {
        console.error('[Hashnode Cards] \u{274C}', error.message);
        process.exit(1);
    }

}