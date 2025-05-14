
import {Router} from "express"
import { prismaClient } from "../db/db"

const router=Router()

router.get("/available",async(req ,res)=>{
    const availableActions=prismaClient.availableActions.findMany({})
    res.send({availableActions})
})

export const actionRouter=router;