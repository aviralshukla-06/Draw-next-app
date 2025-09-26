import dotenv from "dotenv"
dotenv.config()
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws, req) {
    const url = req.url;

    if (url) {
        return;
    }

    const queryParameter = new URLSearchParams(url?.split('?')[1]);
    const token = queryParameter.get('token')
    if (!token || !JWT_SECRET) {
        throw "Either token or secret not found";
    }
    const decodedToken = jwt.verify(token, JWT_SECRET) as { email?: string }

    if (!decodedToken || !decodedToken.email) {
        ws.close();
        return;
    }

    ws.on('message', function message(data) {
        ws.send('pong')
    });
})