
import dotenv from "dotenv";
dotenv.config();
import { Client } from "pg";
type connestionStrType = string | undefined;

const connectionStr: connestionStrType = process.env.PG_URL;

const pgClient = new Client({
    connectionString: connectionStr
})

pgClient.connect()
    .then(() => console.log("Established connection"))
    .catch(err => console.log("Connection err: ", err));

export default pgClient;