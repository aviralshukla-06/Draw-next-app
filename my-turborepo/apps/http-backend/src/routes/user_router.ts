import dotenv from "dotenv";
dotenv.config();
// import express from "express";
// import pgClient from "../db"
import { Request, Response } from "express";
import { Router } from "express";
const userRouter: Router = Router();
import { createUserSchema, signInSchema, roomSchema } from "@repo/common-zod/zodtypes"
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/client"
import bcrypt from "bcrypt";
import { userMiddleware } from "../middlewares/usermiddleware";
import { AuthRequest } from "../type";
// import { email } from "zod";



type jwtsecretType = string | undefined;
const jsonTokenSecret: jwtsecretType = process.env.JWT_SECRET;




userRouter.post("/signup", async (req: Request, res: Response) => {
    const parsedBody = createUserSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: parsedBody.error.issues,
        });
    }

    const { fullName, email, password } = parsedBody.data;

    try {
        // check if user already exists
        const existingUser = await prismaClient.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const createdUser = await prismaClient.user.create({
            data: {
                // ✅ only include fullName if it's in Prisma schema
                fullName,
                email,
                password: hashedPassword,

            },
        });

        return res.json({
            userId: createdUser.id,
            message: "User created successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "An error occurred while creating the user",
        });
    }
});


userRouter.post("/signin", async function (req: Request, res: Response) {

    const parsedSigninBody = signInSchema.safeParse(req.body);

    if (!parsedSigninBody.success) {
        return res.status(403).json({
            message: parsedSigninBody.error.issues
        });
    }


    const { email, password } = parsedSigninBody.data;

    try {

        const signingUser = await prismaClient.user.findFirst({
            where: { email }
        });

        if (!signingUser) {
            return res.status(403).json({
                message: "User does not exist"
            });
        }
        const matchUserPassword = await bcrypt.compare(password, signingUser.password);

        if (!matchUserPassword) {
            res.status(403).json({
                message: "Please provide correct password"
            })
        }

        if (!jsonTokenSecret) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const token = jwt.sign({
            email: signingUser.email
        }, jsonTokenSecret);


        return res.status(200).json({
            message: "Sign-in successful",
            token,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "An error occurred during sign-in",
        });
    }
});

userRouter.post("/room", userMiddleware, async function (req: AuthRequest, res: Response) {
    const roomCreation = roomSchema.safeParse(req.body);

    if (!roomCreation.success) {
        return res.status(403).json({
            message: "Incorrect inputs"
        })
    }

    console.log("reached here");
    const email = req.email
    const userForRoom = await prismaClient.user.findFirst({
        where: {
            email: email
        },
        select: {
            id: true
        }
    })

    const userId = userForRoom?.id;
    console.log(email);
    console.log(userId);

    if (!userId) {
        return res.status(403).json({
            message: "User not authenticated"
        });
    }

    const createdRoom = await prismaClient.room.create({
        data: {
            slug: roomCreation.data.name,
            adminId: userId
        }
    })

    res.status(200).json({
        roomId: createdRoom.id,
        message: "Room created successfully"
    })
})


export default userRouter;