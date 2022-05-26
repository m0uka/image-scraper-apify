const Apify = require('apify');
const playwright = require('playwright');
const { handlePage } = require('./src/routes');
const md5 = require('crypto-js/md5')

const { utils: { log } } = Apify;

function cleanURL(url) {
    return md5(url).toString()
}

Apify.main(async () => {
    const { startUrls } = await Apify.getInput();

    const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();
    const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.PlaywrightCrawler({
        requestList,
        requestQueue,
        proxyConfiguration,
        launchContext: {
            launcher: playwright.firefox,
        },
        browserPoolOptions: {
            useFingerprints: true,
        },

        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            log.info('Page opened.', { label, url });

            const store = await Apify.openKeyValueStore(cleanURL(context.request.url))

            await handlePage(context, proxyConfiguration)

            // finished! wrap up things here, push 
        },

        preNavigationHooks: [
            async ({ request, page }) => {
                let i = 0

                const baseUrl = cleanURL(request.url)
                const store = await Apify.openKeyValueStore(baseUrl)
                
                page.on('response', async (response) => {
                    await response.finished()

                    if (response.ok()) {
                        const contentType = await response.headerValue('content-type')
                        if (!contentType.startsWith('image') || contentType.includes('svg')) return

                        const body = await response.body()

                        i++
                        await store.setValue(`${i}`, body, { contentType })
                        console.log('resp parsed')
                    }
                })
            }
        ]
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
