const Apify = require('apify');
const playwright = require('playwright');
const { handlePage } = require('./src/routes');
const md5 = require('crypto-js/md5');
const { archiveKVS } = require('./src/helpers');
const mime = require('mime-types');

const { utils: { log } } = Apify;

function cleanURL(url) {
    return md5(url).toString()
}

Apify.main(async () => {
    const { startUrls, proxy } = await Apify.getInput();

    const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();
    const proxyConfiguration = await Apify.createProxyConfiguration(proxy);

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

            const urlHash = cleanURL(context.request.url)
            const store = await Apify.openKeyValueStore(urlHash)

            await handlePage(context, proxyConfiguration)

            // finished! wrap up things here, save to ZIP, then to default KVS and then push to dataset
            const zipBuffer = await archiveKVS(store, urlHash)
            const fileName = `${urlHash}.zip`

            await Apify.setValue(fileName, zipBuffer, { contentType: 'application/zip' })

            const defaultKVS = await Apify.openKeyValueStore()

            await Apify.pushData({
                url,
                urlHash,
                download: defaultKVS.getPublicUrl(fileName)
            })

            await store.drop()
        },

        preNavigationHooks: [
            async ({ request, page }) => {
                const baseUrl = cleanURL(request.url)

                let store = await Apify.openKeyValueStore(baseUrl)
                await store.drop()
                store = await Apify.openKeyValueStore(baseUrl)
                
                page.on('response', async (response) => {
                    await response.finished()

                    if (response.ok()) {
                        const contentType = await response.headerValue('content-type')
                        if (!contentType.startsWith('image') || contentType.includes('svg')) return

                        const body = await response.body()
                        await store.setValue(`${cleanURL(response.url())}-${mime.extension(contentType)}`, body, { contentType })
                    }
                })
            }
        ]
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
