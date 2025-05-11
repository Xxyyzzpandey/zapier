import express from "express"
import {PrismaClient}  from "@prisma/client"

const app=express();

const client=new PrismaClient();

//https://hooks.zapier.com/hooks/catch/223345/848489/
//pasword logic

app.post("hooks/catch/:userId/:zapId", async(req,res)=>{
    const userId=req.params.userId;
    const zapId=req.params.zapId;
    const body =req.body
    
    //store in db a new trigger
    await client.$transaction(async tx=>{
        const run=await tx.zapRun.create({
            data:{
                zapId:zapId,
                metadata:body
            }
        });

        await tx.zapRunOutbox.create({
            data:{
                zapRunId:run.id
            }
        })
    })
})


app.listen(3000,()=>{console.log("server is running at port 3000...")})