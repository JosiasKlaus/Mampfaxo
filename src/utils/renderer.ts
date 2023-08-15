import { launch } from 'puppeteer';
import { configure, render } from 'nunjucks';
import CleanCSS from 'clean-css';

const pdfHeader = `<div></div>`;
const pdfFooter = `
<div style="width: 100%;">
    <span style="margin: 0 15mm 5mm 0; font-size: 8pt; float: right;" class="pageNumber"></span>
</div>
`;

export async function renderTemplate(template: string, data: object, styles: string[] = [], filters: { name: string, func: (...args: any[]) => any, async?: boolean | undefined }[] = []): Promise<Buffer> {
    // Combine and minify stylesheets for use in the HTML Template
    const stylesheet = new CleanCSS().minify(styles).styles;

    // Configure nunjucks and add filters if any
    const nunjucks = configure('', { autoescape: true });
    for (const filter of filters) {
        nunjucks.addFilter(filter.name, filter.func, filter.async);
    }

    // Render HTML Template with style and data blocks
    const document = render(template, { style: stylesheet, data: data });

    // Create browser and page with pre-rendered content and PDF settings
    const browser = await launch({
        headless: 'new', executablePath: process.env.CHROME_BIN,
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setContent(document);
    await page.emulateMediaType('print');

    // Generate PDF with custom header and footer for page numbering
    const pdf = await page.pdf({
        preferCSSPageSize: true, displayHeaderFooter: true,
        headerTemplate: pdfHeader, footerTemplate: pdfFooter
    });

    await browser.close();
    return pdf;
}
