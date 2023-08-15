import express, { Express } from 'express';
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

app.use('/school', school);
app.use('/form', form);

app.listen(process.env.PORT || 8080, () => {
  console.log(`Mampfaxo » Server is running at https://localhost:${process.env.PORT || 8080}`);
});
