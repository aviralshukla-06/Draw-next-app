import dotenv from "dotenv";
dotenv.config();
// import express from "express";
import pgClient from "../db"
import { Request, Response } from "express";
import { Router } from "express";
const userRouter: Router = Router();
import { createUserSchema, signInSchema, roomSchema } from "@repo/common-zod/zodtypes"
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/client"
import bcrypt from "bcrypt";
import { email } from "zod";



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
        res.status(403).json({
            message: parsedSigninBody.error.issues
        });
    }


    const loggingUser = `SELECT password FROM users WHERE email=$1; `
    const loggingUserInsertVal = pgClient.query(loggingUser, [req.body.email]);

    if ((await loggingUserInsertVal).rows.length === 0) {
        res.status(403).json({
            message: "User does Not exist."
        });
        return
    }

    const userRow = (await loggingUserInsertVal).rows[0];
    const userPassword = userRow.password;

    if (!parsedSigninBody.success) {
        // handle validation error
        throw new Error("Invalid input");
    }

    const matchUserPassword = bcrypt.compare(parsedSigninBody.data?.password, userPassword);

    if (!matchUserPassword) {
        res.status(403).json({
            message: "Please provide correct password"
        })
    }

    let token: string | undefined

    if (!jsonTokenSecret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    if (await matchUserPassword) {
        token = jwt.sign({
            email: email
        }, jsonTokenSecret)
    } else {
        res.status(403).json({
            message: "Incorrect details"
        });
        return
    }

    res.status(200).json({
        message: "Sign-in successful",
        token
    });
})

export default userRouter;