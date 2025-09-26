import dotenv from "dotenv";
dotenv.config();
import express from "express";
import pgClient from "../db"
import { Request, Response } from "express";
import { Router } from "express";
const userRouter: Router = Router();
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";
import { z } from "zod";


type jwtsecretType = string | undefined;
const jsonTokenSecret: jwtsecretType = process.env.JWT_SECRET;


type User = {
    fullName: string;
    email: string;
    password: string;
};




userRouter.post("/signup", async function (req: Request, res: Response) {
    const reqBody = z.object({
        fullName: z.string(),
        email: z.email(),
        password: z.string().min(8)
    })

    const parsedBody = reqBody.safeParse(req.body);
    if (!parsedBody.success) {
        res.status(403).json({
            message: parsedBody.error.issues
        });
    }

    const existingUserCheckQuery = `SELECT * FROM "users" WHERE email=$1`;
    const existingUserCheckQueryValue = await pgClient.query(existingUserCheckQuery, [req.body.email]);

    if (existingUserCheckQueryValue.rows.length > 0) {
        res.status(411).json({
            message: "User already exists"
        });
        return;
    }

    if (parsedBody?.data) {

        const { fullName, email, password }: User = parsedBody.data;
        const hashedPassword = await bcrypt.hash(password, 7);
        try {
            const newUserCreation = `INSERT INTO "users" (fullName, email, password) VALUES ($1, $2, $3);`
            const newUserValues = pgClient.query(newUserCreation, [fullName, email, hashedPassword]);
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "An error occurred while creating the user"
            })
            return
        }
    }


    res.json({
        message: "User created successfully"
    })



})

userRouter.post("/signin", async function (req: Request, res: Response) {
    const { email, password } = req.body;

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

    const matchUserPassword = bcrypt.compare(password, userPassword);

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