import { Router } from 'express';
import * as XLSX from 'xlsx';
import { database } from '..';
import autoFitColumns from '../utils/transform';

const router = Router();
const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

router.get("/", async (req, res) => {
    if (!req.query.password || req.query.password != process.env.EXCEL_PASSWORD) {
        res.status(401).send("Unauthorized");
        return;
    }

    const collection = await database.collection("entries");
    const data = await collection.find({}).toArray();

    let columns: any[] = [];

    data.forEach((entry: any) => {
        Object.values(entry.entry).forEach((value: any) => {
            let staff_cost: any[] = [];
            Object.values(value.cost.staff).forEach((cost: any) => {
                if (cost.type == "Beschäftigung Befristeter TV-H Kräfte") {
                    staff_cost.push(`${cost.type} (${cost.staff.percentage} | ${cost.staff.months} | ${currencyFormatter.format(cost.cost)})`);
                } else {
                    staff_cost.push(`${cost.type} (${cost.hours} Stunden | ${currencyFormatter.format(cost.cost)})`);
                }
            });
            const staff_string = staff_cost.join("\r\n");

            let material_cost: any[] = [];
            Object.values(value.cost.material).forEach((cost: any) => {
                material_cost.push(`${cost.type} (${currencyFormatter.format(cost.cost)})`);
            });
            const material_string = material_cost.join("\\\n");


            columns.push({
                number: entry.number,
                principal_name: entry.principal.name,
                principal_email: entry.principal.email,
                year: value.year,
                staff_count: entry.count.staff,
                staff: staff_string,
                material: material_string,
                staff_cost: currencyFormatter.format(entry.cost.staff),
                material_cost: currencyFormatter.format(entry.cost.material)
            });
        });
    });

    columns.unshift({
        number: "Schulnummer",
        principal_name: "Schulleiter",
        principal_email: "Schulleiter E-Mail",
        year: "Jahr",
        staff_count: "Anzahl der Lehrkräfte",
        staff: "Lehrkräfte",
        material: "Material",
        staff_cost: "Kosten Lehrkräfte",
        material_cost: "Kosten Material"
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(columns, {
        skipHeader: true
    });
    autoFitColumns(worksheet);

    XLSX.utils.book_append_sheet(workbook, worksheet);
    const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-disposition': 'attachment;filename=Löwenstark.xlsx',
        'Content-Length': output.length,
    });
    res.end(output);
});

export default router;
