"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zapRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../middleware");
const type_1 = require("../types/type");
const db_1 = require("../db/db");
const router = (0, express_1.Router)();
//@ts-ignore
router.post("/", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //@ts-ignore
    const userId = req.id;
    // Validate request body
    const parsedData = type_1.ZapCreateSchema.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "incorrect inputs",
        });
    }
    try {
        // Start transaction with sensible timeout configs
        const zapId = yield db_1.prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create Zap
            const zap = yield tx.zap.create({
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
            const trigger = yield tx.trigger.create({
                data: {
                    triggerId: parsedData.data.availableTriggerId,
                    zapId: zap.id,
                },
            });
            // Update Zap with triggerId
            yield tx.zap.update({
                where: { id: zap.id },
                data: { triggerId: trigger.id },
            });
            return zap.id;
        }), {
            maxWait: 5000, // 5 seconds max wait for transaction lock
            timeout: 10000, // 10 seconds total timeout for transaction
        });
        // Respond with the new zapId
        return res.json({ zapId });
    }
    catch (err) {
        console.error("Transaction failed: ", err);
        return res.status(500).json({
            message: "Something went wrong while creating zap",
        });
    }
}));
//@ts-ignore
router.get("/", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const id = req.id;
    const zaps = yield db_1.prismaClient.zap.findMany({
        where: {
            userId: id
        },
        include: {
            actions: {
                include: {
                    type: true
                }
            },
            trigger: {
                include: {
                    type: true
                }
            }
        }
    });
    return res.json({
        zaps
    });
}));
//@ts-ignore
router.get("/:zapId", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;
    const zap = yield db_1.prismaClient.zap.findMany({
        where: {
            id: zapId,
            userId: id
        },
        include: {
            actions: {
                include: {
                    type: true
                }
            },
            trigger: {
                include: {
                    type: true,
                }
            }
        }
    });
    return res.json({
        zap
    });
}));
exports.zapRouter = router;
