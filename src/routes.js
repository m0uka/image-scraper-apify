const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handlePage = async ({ request, page }, proxyConfiguration) => {
    // scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // give the page a chance to load some lazily loaded images
    await page.waitForLoadState();

    // try to scroll again
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState();

    await page.waitForTimeout(3000)
};