import { Router } from "express";
import { authMiddleware } from "../middleware";

const router=Router();


router.post("/",authMiddleware,async(req,res)=>{
    console.log("create a zap");
})

router.get("/",authMiddleware,async(req,res)=>{
    console.log("signin handler")
})

router.get("/:zapId",authMiddleware,async(req,res)=>{
    console.log("get zap info")
})

export const zapRouter=router;