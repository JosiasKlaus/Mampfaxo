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
        Object.values(entry.entries).forEach((value: any) => {
            let staff_cost: any[] = [];
            Object.values(value.staff).forEach((cost: any) => {
                if (cost.type == "Beschäftigung Befristeter TV-H Kräfte") {
                    staff_cost.push(`${cost.type} (${cost.percentage} | ${cost.months} | ${currencyFormatter.format(cost.cost)})`);
                } else {
                    staff_cost.push(`${cost.type} (${cost.hours} Stunden | ${currencyFormatter.format(cost.cost)})`);
                }
            });
            const staff_string = staff_cost.join("\r\n");

            let material_cost: any[] = [];
            Object.values(value.material).forEach((cost: any) => {
                material_cost.push(`${cost.type} (${currencyFormatter.format(cost.cost)})`);
            });
            const material_string = material_cost.join("\\\n");


            columns.push({
                number: entry.school.id,
                principal_name: entry.principal.name,
                principal_email: entry.principal.email,
                year: value.year,
                staff_count: value.staff.filter((staff: any) => staff.type && staff.type != "kein Personal").length,
                staff: staff_string,
                material: material_string,
                staff_cost: currencyFormatter.format(value.staff.reduce((acc: any, staff: any) => acc + (staff.cost || 0), 0)),
                material_cost: currencyFormatter.format(value.material.reduce((acc: any, material: any) => acc + (material.cost || 0), 0))
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
