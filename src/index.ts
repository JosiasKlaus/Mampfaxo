import { Db, MongoClient } from 'mongodb';
import express, { Express, Router } from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import excel from './routes/excel';
import form from './routes/form';
import nodemailer from 'nodemailer';
import school from './routes/school';

dotenv.config();

const app: Express = express();
const router: Router = express.Router();
app.use(express.json());
app.use(cors());

export let database: Db;
new MongoClient(process.env.MONGODB_URL || "mongodb://localhost:27017/loewenstark").connect().then((client) => database = client.db()).catch((err) => { throw err; });

export let mail_transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 25,
  secure: process.env.SMTP_TLS === 'yes' ? true : false || false,
  auth: {
    user: process.env.SMTP_USERNAME || 'user',
    pass: process.env.SMTP_PASSWORD || 'password',
  },
});

mail_transporter.verify().then(() => {
  console.log('Mampfaxo » Mailer is ready to take our messages');
}).catch((err) => {
  console.error('Mampfaxo » Mailer is not ready to take our messages');
  console.error(err);
});
5

router.use('/school', school);
router.use('/submit', form);
router.use('/excel', excel);
app.use('/api', router);

const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`Mampfaxo » Server is running at http://localhost:${process.env.PORT || 8080}`);
});

process.on('SIGTERM', () => {
  server.close();
});