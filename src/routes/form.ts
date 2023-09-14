import { database, mail_transporter } from '../index';

import { Router } from 'express';
import { renderTemplate } from '../utils/renderer';

const router = Router();

router.post("/", async (req, res) => {
    let entryCollection = await database.collection("entries");

    if (!req.body.school || !req.body.principal || !req.body.entries) {
        res.send("Invalid data recieved!").status(400);
        return;
    }

    let result = await entryCollection?.insertOne(req.body);
    if (!result) {
        res.send("Error while saving entry").status(500);
        return;
    }

    const pdf = await renderTemplate('static/template.html', req.body, ['./static/style.css'], [
        { name: 'euroFormater', func: function (val, cb) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val); }, async: false }
    ]);

    mail_transporter.sendMail({
        from: process.env.SMTP_FROM || 'root',
        to: process.env.APPLICATION_MAIL || 'root',
        subject: req.body.school.name + ' - Neue Anmeldung',
        text: 'Neue Anmeldung erhalten!',
        attachments: [
            {
                filename: 'Löwenstark.pdf',
                content: pdf,
                contentType: 'application/pdf'
            }
        ]
    });

    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-disposition': 'attachment;filename=Löwenstark.pdf',
        'Content-Length': pdf.length
    });
    res.end(pdf);
});

export default router;