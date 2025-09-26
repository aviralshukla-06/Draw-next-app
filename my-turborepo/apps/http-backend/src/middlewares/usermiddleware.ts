
import dotenv from "dotenv"
dotenv.config();
import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"
const JWT_SECRET = process.env.JWT_SECRET as string;
import { AuthRequest } from "../type";


export function userMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers["authorization"];

    if (!JWT_SECRET) {
        res.status(403).json({
            message: "Either token or secret not provided"
        })
    }

    if (!token) {
        res.status(403).json({ message: "Malformed token" });
        return;
    }


    try {

        const decodeToken = jwt.verify(token, JWT_SECRET) as { email?: string };
        if (decodeToken) {
            req.email = decodeToken.email;
            next();
        }
    } catch (error) {
        res.status(403).json({
            message: "Invalid or Expired Token"
        });
        return
    }

}