import express, { Express, Request, Response } from 'express';
import { renderContractPDF } from './utils/renderer';
import { configure } from 'nunjucks';
import dotenv from 'dotenv';
import school from './routes/school';
import form from './routes/form';
import { Db, MongoClient } from 'mongodb';
import cors from 'cors';
dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(cors());

export let database: Db;
new MongoClient('mongodb://root:password@192.168.1.250:27017/').connect().then((client) => database = client.db('loewenstark')).catch((err) => { throw err; });


const euroFormater = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
const nunjucks = configure('', { autoescape: true });
nunjucks.addFilter('euroFormater', function(val, cb) { return euroFormater.format(val).replace('€', '').trim(); }, false);

app.post('/contract', async (req: Request, res: Response) => {
  const pdf = await renderContractPDF(req.body);
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-disposition': 'attachment;filename=Vertrag.pdf',
    'Content-Length': pdf.length
  });
  res.end(pdf);
});

app.use('/school', school);
app.use('/form', form);

app.listen(process.env.PORT || 8080, () => {
  console.log(`🔥 [Flamara]: Server is running at https://localhost:${process.env.PORT || 8080}`);
});
