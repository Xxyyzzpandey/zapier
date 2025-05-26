import {Kafka} from "kafkajs"
import { PrismaClient } from "@prisma/client";
import { parse } from "./parser";
import { sendEmail } from "./email";
import { sendSol } from "./solana";
import { JsonObject } from "@prisma/client/runtime/library";

const prismaClient=new PrismaClient();

const TOPIC_NAME="zap-events"

const kafka =new Kafka({
    clientId:'outbox-processor',
    brokers:['localhost:9092']
})

async function main(){
    const consumer =kafka.consumer({groupId:'main-worker'});
    await consumer.connect();
    const producer=kafka.producer();
    await producer.connect();

    await consumer.subscribe({topic:TOPIC_NAME,fromBeginning:true});

    await consumer.run({
        autoCommit:false,
        eachMessage:async ({topic,partition,message})=>{
            console.log({
                partition,
                offset:message.offset,
                value:message.value?.toString(),
            })
             if(!message.value?.toString()){
                return;
             }

             const parsedValue=JSON.parse(message.value?.toString());
             const zapRunId=parsedValue.zapRunId;
             const stage=parsedValue.stage;

             const zapRunDetails=await prismaClient.zapRun.findFirst({
                where:{
                    id:zapRunId
                },
                include:{
                    zap:{
                        include:{
                            actions:{
                                include:{
                                    type:true
                                }
                            }
                        }
                    }
                }
             })
             //instead of using this nested query we also do
             //send a querry to get back zap id
             //send a query to get back the actions associated to this zap id
             //find the available actions 

            const zapRunMetadata=zapRunDetails?.metadata

            const currentAction=zapRunDetails?.zap.actions.find(x=>x.sortingOrder===stage);
             if(!currentAction){
                console.log("current action not found")
                return
             }

            if (currentAction.type.id === "email") {
            const body = parse((currentAction.metadata as JsonObject)?.body as string, zapRunMetadata);
            const to = parse((currentAction.metadata as JsonObject)?.email as string, zapRunMetadata);
            console.log(`Sending out email to ${to} body is ${body}`)
            await sendEmail(to, body);
            }

            if (currentAction.type.id === "send-sol") {
            const amount = parse((currentAction.metadata as JsonObject)?.amount as string, zapRunMetadata);
            const address = parse((currentAction.metadata as JsonObject)?.address as string, zapRunMetadata);
            console.log(`Sending out SOL of ${amount} to address ${address}`);
            await sendSol(address, amount);
            }
             
            // if (currentAction.type.id === "notiondoc") {
            //    //steps to write entry in notion docs
            // }

            const zapId=message.value?.toString();
            const lastStage=(zapRunDetails?.zap.actions?.length || 1)-1;
            if(lastStage !==stage){
                await producer.send({
                   topic:TOPIC_NAME,
                   messages:[{
                    value:JSON.stringify({
                         stage:stage+1,
                        zapRunId
                     })
                  }]
                })
            }
            //how we do if we have multiple actions like sendemail,sendmoney ,zoom ,ect
            //for this we parse message and see the type and according to that we just call out functons sendEmail() ,sendMoney() 
            //this function are present in other folder we just call it here according to job

            await consumer.commitOffsets([{
                topic:TOPIC_NAME,
                partition:partition,
                offset:(parseInt(message.offset)+1).toString()  //5
            }])
        }
    })
}

main()