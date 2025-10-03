
import dotenv from "dotenv"
dotenv.config();
import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"
const JWT_SECRET = process.env.JWT_SECRET as string;
import { AuthRequest } from "../type";


console.log(JWT_SECRET);

export function userMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers["authorization"] ?? " ";

    if (!JWT_SECRET) {
        res.status(403).json({
            message: "Either token or secret not provided"
        })
        return
    }

    if (!token) {
        res.status(403).json({ message: "Malformed token" });
        return;
    }

    console.log("I am logging");

    try {

        const decodeToken = jwt.verify(token, JWT_SECRET) as { email?: string };
        if (!decodeToken.email) {
            return res.status(403).json({ message: "Invalid token payload" });
        }

        console.log(decodeToken + "it is");
        req.email = decodeToken.email;
        console.log(`email from middleware ${req.email}`);

        next();

    } catch (error) {
        res.status(403).json({
            message: "Invalid or Expired Token"
        });
        return
    }

}