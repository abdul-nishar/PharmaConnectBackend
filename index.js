import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import router from "./routes/index.js";
import handleSocket from "./sockets/chatSockets.js";
import cookieParser from "cookie-parser";


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://pharmaproject.netlify.app",
            "http://localhost:5173",
            "https://reimagined-barnacle-9g5w9p956x6276g9-5173.app.github.dev"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
//allow port 5173 for Vite development server
app.use(
    cors({
        origin: [
            "https://pharmaproject.netlify.app",
            "http://localhost:5173",
            "https://reimagined-barnacle-9g5w9p956x6276g9-5173.app.github.dev"
        ],
        methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);


handleSocket(io);

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
    console.log("GET /");
    res.send("Welcome to the Chat API");
});

server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
