import { Router } from "express";
import { authMiddleware } from "../middleware";
import { ZapCreateSchema } from "../types/type";
import { prismaClient } from "../db/db";

const router=Router();

//@ts-ignore
router.post("/", authMiddleware, async (req, res) => {
  const body = req.body;
  //@ts-ignore
  const userId = req.id;

  // Validate request body
  const parsedData = ZapCreateSchema.safeParse(body);
  if (!parsedData.success) {
    return res.status(411).json({
      message: "incorrect inputs",
    });
  }

  try {
    // Start transaction with sensible timeout configs
    const zapId = await prismaClient.$transaction(
      async (tx) => {
        // Create Zap
        const zap = await tx.zap.create({
          data: {
            userId: userId,
            triggerId: "", // Temporary, will update after trigger creation
            actions: {
              create: parsedData.data.actions.map((x, index) => ({
                actionId: x.availableActionId,
                sortingOrder: index,
              })),
            },
          },
        });

        // Create Trigger and link to Zap
        const trigger = await tx.trigger.create({
          data: {
            triggerId: parsedData.data.availableTriggerId,
            zapId: zap.id,
          },
        });

        // Update Zap with triggerId
        await tx.zap.update({
          where: { id: zap.id },
          data: { triggerId: trigger.id },
        });

        return zap.id;
      },
      {
        maxWait: 5000, // 5 seconds max wait for transaction lock
        timeout: 10000, // 10 seconds total timeout for transaction
      }
    );

    // Respond with the new zapId
    return res.json({ zapId });
  } catch (err) {
    console.error("Transaction failed: ", err);
    return res.status(500).json({
      message: "Something went wrong while creating zap",
    });
  }
});
//@ts-ignore
router.get("/",authMiddleware,async(req,res)=>{
    //@ts-ignore
    const id=req.id;
    const zaps=await prismaClient.zap.findMany({
        where:{
            userId:id
        },
        include:{
            actions:{
                include:{
                    type:true
                }
            },
            trigger:{
                include:{
                    type:true
                }
            }
        }
    })
    return res.json({
        zaps
    })
})

//@ts-ignore
router.get("/:zapId",authMiddleware,async(req,res)=>{
    //@ts-ignore
    const id=req.id ;
    const zapId=req.params.zapId;
    const zap=await prismaClient.zap.findMany({
        where:{
            id:zapId,
            userId:id
        },
        include:{
            actions:{
                include:{
                    type:true
                }
            },
            trigger:{
                include:{
                    type:true,
                }
            }
        }
    })
    return res.json({
        zap
    })
})

export const zapRouter=router;