import {Kafka} from "kafkajs"

const TOPIC_NAME="zap-events"

const kafka =new Kafka({
    clientId:'outbox-processor',
    brokers:['localhost:9092']
})

async function main(){
    const consumer =kafka.consumer({groupId:'main-worker'});
    await consumer.connect();

    await consumer.subscribe({topic:TOPIC_NAME,fromBeginning:true});

    await consumer.run({
        autoCommit:false,
        eachMessage:async ({topic,partition,message})=>{
            console.log({
                partition,
                offset:message.offset,
                value:message.value?.toString(),
            })
            await new Promise(r=>setTimeout(r,1000));
             
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