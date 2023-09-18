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

    let staff_cost_2023: number = 0;
    req.body.entries?.forEach((entry: any) => {
      if (entry.year === "2023") {
        entry.staff.forEach((staff: any) => {
          staff_cost_2023 += staff.cost || 0;
        });
      }
    });

    let staff_cost_2023_incl = staff_cost_2023 * 1.15;

    let material_cost_2023: number = 0;
    req.body.entries?.forEach((entry: any) => {
      if (entry.year === "2023") {
        entry.material.forEach((material: any) => {
            material_cost_2023 += material.cost || 0;
        });
      }
    });

    let total_cost_2023 = staff_cost_2023_incl + material_cost_2023;

    let staff_cost_2024: number = 0;
    req.body.entries?.forEach((entry: any) => {
      if (entry.year === "2024") {
        entry.staff.forEach((staff: any) => {
            staff_cost_2024 += staff.cost || 0;
        });
      }
    });

    let staff_cost_2024_incl = staff_cost_2024 * 1.15;

    let material_cost_2024: number = 0;
    req.body.entries?.forEach((entry: any) => {
      if (entry.year === "2024") {
        entry.material.forEach((material: any) => {
            material_cost_2024 += material.cost || 0;
        });
      }
    });

    let total_cost_2024 = staff_cost_2024_incl + material_cost_2024;

    const data = { ...req.body, staff_cost_2023, staff_cost_2023_incl, material_cost_2023, total_cost_2023, staff_cost_2024, staff_cost_2024_incl, material_cost_2024, total_cost_2024 }

    const pdf = await renderTemplate('static/template.html', data, ['./static/style.css'], [
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