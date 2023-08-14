import { launch } from 'puppeteer';
import { render } from 'nunjucks';
import CleanCSS from 'clean-css';

const baseDirectory = './src/template';
const pdfHeader = `<div></div>`;
const pdfFooter = `
<div style="width: 100%;">
    <span style="margin: 0 15mm 5mm 0; font-size: 8pt; float: right;" class="pageNumber"></span>
</div>
`;

export async function renderContractPDF(data: any): Promise<Buffer> {
    // Minify CSS to insert it into the HTML Template
    // Render HTML Template with style and data blocks
    const style = new CleanCSS().minify([`${baseDirectory}/style.css`]).styles;
    const document = render(`${baseDirectory}/contract.html`, { style: style, data: data });

    // Create browser and page with pre-rendered content and PDF settings
    const browser = await launch({
        headless: true, executablePath: process.env.CHROME_BIN,
        args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage']
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
