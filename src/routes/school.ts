import { Router } from 'express';
import {database} from '../index';

const router = Router();

router.get("/:id", async (req, res) => {
    let collection = await database.collection("schools");
    let query = { id: req.params.id };
    let result = await collection?.findOne(query);

    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

export default router;