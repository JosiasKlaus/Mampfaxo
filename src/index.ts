import express, { Express, Router } from 'express';
import dotenv from 'dotenv';
import school from './routes/school';
import form from './routes/form';
import { Db, MongoClient } from 'mongodb';
import cors from 'cors';
dotenv.config();

const app: Express = express();
const router: Router = express.Router();
app.use(express.json());
app.use(cors());

export let database: Db;
new MongoClient(process.env.MONGODB_URL || "mongodb://localhost:27017/loewenstark").connect().then((client) => database = client.db()).catch((err) => { throw err; });

router.use('/school', school);
router.use('/submit', form);
app.use('/api', router);

const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`Mampfaxo » Server is running at http://localhost:${process.env.PORT || 8080}`);
});

process.on('SIGTERM', () => {
  server.close();
});