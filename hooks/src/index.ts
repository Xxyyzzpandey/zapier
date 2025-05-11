import express from "express"

const app=express();

//https://hooks.zapier.com/hooks/catch/223345/848489/
//pasword logic

app.post("hooks/catch/:userId/:zapId",(req,res)=>{
    const userId=req.params.userId;
    const zapId=req.params.zapId;
    
})