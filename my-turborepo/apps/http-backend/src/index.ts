import dotenv from "dotenv"
import express from "express";
import userRouter from "./routes/user_router";
const app = express();
dotenv.config();
const portNo = process.env.PORT
app.use(express.json())
console.log(portNo);


app.use("/api/v1/user", userRouter)

app.listen(portNo, () => {
    console.log("app running on port 3000");
})



// insta open kro!!!
