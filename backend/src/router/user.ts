import { Router } from "express";
import { authMiddleware } from "../middleware";

const router=Router();

router.post("/signup",async(req,res)=>{
    console.log("signup handler")
})

router.post("/signin",async(req,res)=>{
    console.log("sigin handler")
})

router.get("/user",authMiddleware,async(req,res)=>{
    console.log("sigin handler")
})


export const userRouter =router