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
    let staff_columns: any[] = [];
    let material_columns: any[] = [];

    data.forEach((entry: any) => {
        Object.values(entry.entries).forEach((value: any) => {
            let staff_cost: any[] = [];
            Object.values(value.staff).forEach((cost: any) => {
                if (cost.type == "Beschäftigung Befristeter TV-H Kräfte") {
                    staff_cost.push(`${cost.type} (${cost.percentage} | ${cost.months} | ${currencyFormatter.format(cost.cost)})`);
                } else {
                    staff_cost.push(`${cost.type} (${cost.hours} Stunden | ${currencyFormatter.format(cost.cost)})`);
                }
                
                if(cost.type && cost.type != "kein Personal") {
                    staff_columns.push({
                        number: entry.school.id,
                        type: cost.type,
                        hours: cost.hours,
                        percentage: cost.percentage,
                        months: (cost.months || []).join(", "),
                        cost: cost.cost
                    });
                }
            });
            const staff_string = staff_cost.join("\r\n");

            let material_cost: any[] = [];
            Object.values(value.material).forEach((cost: any) => {
                material_cost.push(`${cost.type} (${currencyFormatter.format(cost.cost)})`);

                if(cost.type && cost.type != "kein Material") {
                    material_columns.push({
                        number: entry.school.id,
                        type: cost.type,
                        cost: cost.cost
                    });
                }
            });
            const material_string = material_cost.join("\\\n");

            columns.push({
                number: entry.school.id,
                supervisor: entry.school.supervisor,
                name: entry.school.name,
                principal_name: entry.principal.name,
                principal_email: entry.principal.email,
                year: value.year,
                students: value.students,
                staff_count: value.staff.filter((staff: any) => staff.type && staff.type != "kein Personal").length,
                staff: staff_string,
                material: material_string,
                staff_cost: value.staff.reduce((acc: any, staff: any) => acc + (staff.cost || 0), 0),
                material_cost: value.material.reduce((acc: any, material: any) => acc + (material.cost || 0), 0)
            });
        });
    });

    columns.unshift({
        number: "Schulnummer",
        supervisor: "Schulaufsicht",
        name: "Name der Schule",
        principal_name: "Schulleiter",
        principal_email: "Schulleiter E-Mail",
        year: "Jahr",
        students: "Anzahl der SuS",
        staff_count: "Anzahl der Lehrkräfte",
        staff: "Lehrkräfte",
        material: "Material",
        staff_cost: "Kosten Lehrkräfte",
        material_cost: "Kosten Material"
    });

    staff_columns.unshift({
        number: "Schulnummer",
        type: "Art",
        hours: "Stunden",
        percentage: "Umfang",
        months: "Monate",
        cost: "Kosten"
    });

    material_columns.unshift({
        number: "Schulnummer",
        type: "Art",
        cost: "Kosten"
    });

    const staff_worksheet = XLSX.utils.json_to_sheet(staff_columns, {
        skipHeader: true
    });

    const material_worksheet = XLSX.utils.json_to_sheet(material_columns, {
        skipHeader: true
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(columns, {
        skipHeader: true
    });

    autoFitColumns(worksheet);
    autoFitColumns(staff_worksheet);
    autoFitColumns(material_worksheet);

    XLSX.utils.book_append_sheet(workbook, worksheet);
    XLSX.utils.book_append_sheet(workbook, staff_worksheet, "Personalkosten");
    XLSX.utils.book_append_sheet(workbook, material_worksheet, "Sachkosten");
    const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-disposition': 'attachment;filename=Löwenstark.xlsx',
        'Content-Length': output.length,
    });
    res.end(output);
});

export default router;
