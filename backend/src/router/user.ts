import { Router } from "express";
import { authMiddleware } from "../middleware";
import { SigninSchema, SignupSchema } from "../types/type";
import { prismaClient } from "../db/db";
import  jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";

const router=Router();

router.post("/signup",async (req,res)=> {
    const body=req.body;
    const parsedData=SignupSchema.safeParse(body)

    if(!parsedData.success){
        return res.status(411).json({
            message:"Incorrect inputs"
        })
    }

    const userExists=await prismaClient.user.findFirst({
        where:{
            email:parsedData.data.username
        }
    });
    if(userExists){
        return res.status(403).json({
            message:"User already exists"
        })
    }
    await prismaClient.user.create({
        data:{
            email:parsedData.data.username,
            //encrypt password and then store
            password:parsedData.data.password,
            name:parsedData.data.name
        }
    })
    //await send emails to verify
    return res.json({
        message:"please verify your account"
    })
})

router.post("/signin",async(req,res)=>{
     const body =req.body;
     const parsedData=SigninSchema.safeParse(body);

     if(!parsedData.success){
        return res.status(411).json({
            message:"Incorrect inputs"
        })
     }
     const user=await prismaClient.user.findFirst({
        where:{
            email:parsedData.data.username,
            password:parsedData.data.password
        }
     })
     if(!user){
        return res.status(403).json({
            message:"sorry credentials are incorrect"
        })
     }
     const token=jwt.sign({
        id:user.id,
     },JWT_PASSWORD)
     res.json({
        token:token
     })
})

router.get("/user",authMiddleware,async(req,res)=>{
    //Todo:fix the type
    //@ts-ignore
    const id=req.id ;
    const user=await prismaClient.user.findFirst({
        where:{
            id
        },
        select:{
            name:true,
            email:true
        }
    })
    return res.json({
        user
    })
})


export const userRouter =router