import { Router } from "express";
import { prismaClient } from "../db/db";

const router=Router();

router.get("/available",async(req ,res)=>{
     const availableTriggers=prismaClient.availableTrigger.findMany({});
     res.json({
        availableTriggers
     })
})

export const triggerRouter=router;