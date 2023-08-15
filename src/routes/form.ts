import { Router } from 'express';
import { database } from '../index';
import { renderTemplate } from '../utils/renderer';

const router = Router();

router.post("/", async (req, res) => {
    let schoolCollection = await database.collection("schools");
    let entryCollection = await database.collection("entries");

    if (!req.body.schoolNumber) res.send("No school number provided").status(400);

    let school = await schoolCollection?.findOne({ id: req.body.schoolNumber });
    if (!school) {
        res.send("School not found").status(404);
        return;
    }

    let result = await entryCollection?.insertOne(req.body);
    if (!result) {
        res.send("Error while saving entry").status(500);
        return;
    }

    let data = { ...req.body, ...school };

    const pdf = await renderTemplate('static/contract.html', data, ['./static/style.css'], [
        { name: 'euroFormater', func: function (val, cb) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val); }, async: false }
    ]);

    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-disposition': 'attachment;filename=Löwenstark.pdf',
        'Content-Length': pdf.length
    });
    res.end(pdf);
});

export default router;