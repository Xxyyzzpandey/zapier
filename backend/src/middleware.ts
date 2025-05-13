import { NextFunction,Request,Response } from "express";
import jwt from "jsonwebtoken"
import { JWT_PASSWORD } from "./config";

export function authMiddleware(req:Request,res:Response,next:NextFunction){
     const token:any=req.headers.authorization;
     
     try{
        const payload=jwt.verify(token,JWT_PASSWORD);
        //@ts-ignore
        req.id=payload.id 
        next()
     }catch(e){
        return res.status(403).json({
            message:"you are not logged in"
        })
     }
}