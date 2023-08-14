import { Router } from 'express';
import {database} from '../index';

const router = Router();

router.post("/", async (req, res) => {
    let collection = await database.collection("entries");
    let result = await collection?.insertOne(req.body);
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

export default router;