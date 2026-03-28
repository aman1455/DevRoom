import express from "express"
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db"
import userRouter from "./routes/user.routes"
import messageRouter from "./routes/message.routes"
import roomRouter from "./routes/room.routes"
import executionRouter from "./routes/execution.routes"
import fileRouter from "./routes/file.routes"
import { Server, Socket } from "socket.io"
import { Request, Response, NextFunction } from "express"
import { Types } from "mongoose"

const app = express()
const server = http.createServer(app)

const { CLIENT_URL, NODE_ENV, PORT } = process.env

// 1. Configure Allowed Origins
const allowedOrigins: string[] = [
  CLIENT_URL,
  // Add localhost for local development
  "http://localhost:3000",
  "http://localhost:5173",
].filter((origin): origin is string => Boolean(origin))

if (!CLIENT_URL && NODE_ENV === "production") {
  console.error(
    "ERROR: CLIENT_URL is not set. Set it to your frontend URL (e.g. https://your-frontend.example).",
  )
}

// 2. Configure CORS
const corsOptions = {
  origin(origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))

// 3. Socket.IO Setup
// NOTE: This works locally. On Vercel, WebSocket connections often fail
// because Vercel functions are serverless and do not keep connections open.
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
})

export const userSocketMap: Record<string, string[]> = {} // { userId: [socketId, ...] }
export const roomSocketMap: Record<string, string[]> = {} // { roomId: [socketId, ...] }
export const userRoomMap: Record<string, Set<string>> = {} // { userId: Set(roomId, ...) }

io.on("connection", (socket: Socket) => {
  const userId = socket.handshake.query.userId as string | undefined

  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = []
    }
    userSocketMap[userId].push(socket.id)

    // Rejoin rooms on reconnect
    if (!userRoomMap[userId]) {
      userRoomMap[userId] = new Set()
    }

    console.log(`User connected: ${userId}`)
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap))

  // Room events
  socket.on("join-room", (roomId: string) => {
    if (!userId) return
    socket.join(roomId)

    if (!roomSocketMap[roomId]) {
      roomSocketMap[roomId] = []
    }
    roomSocketMap[roomId].push(socket.id)

    // Track user's rooms
    if (!userRoomMap[userId]) {
      userRoomMap[userId] = new Set()
    }
    userRoomMap[userId].add(roomId)

    console.log(`User ${userId} joined room ${roomId}`)
  })

  socket.on("leave-room", (roomId: string) => {
    if (!userId) return
    socket.leave(roomId)

    // Remove from roomSocketMap
    if (roomSocketMap[roomId]) {
      roomSocketMap[roomId] = roomSocketMap[roomId].filter(id => id !== socket.id)
      if (roomSocketMap[roomId].length === 0) {
        delete roomSocketMap[roomId]
      }
    }

    // Remove from userRoomMap
    if (userRoomMap[userId]) {
      userRoomMap[userId].delete(roomId)
    }

    console.log(`User ${userId} left room ${roomId}`)
  })

  socket.on("typing", (data: { roomId: string; isTyping: boolean }) => {
    const { roomId, isTyping } = data
    if (!userId) return
    // Broadcast typing status to room
    socket.to(roomId).emit("userTyping", {
      userId,
      isTyping,
    })
  })

  socket.on("code-change", (data: { roomId: string; code: string; language: string }) => {
    const { roomId, code, language } = data
    if (!userId) return
    // Broadcast code changes to other room members
    socket.to(roomId).emit("codeUpdated", {
      userId,
      code,
      language,
    })
  })

  socket.on("disconnect", () => {
    if (userId) {
      // Remove socket from all rooms
      const userRooms = userRoomMap[userId]
      if (userRooms) {
        userRooms.forEach((roomId) => {
          if (roomSocketMap[roomId]) {
            roomSocketMap[roomId] = roomSocketMap[roomId].filter(id => id !== socket.id)
            if (roomSocketMap[roomId].length === 0) {
              delete roomSocketMap[roomId]
            }
          }
        })
      }

      userSocketMap[userId] =
        userSocketMap[userId].filter(id => id !== socket.id)

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId]
        if (userRoomMap[userId]) {
          delete userRoomMap[userId]
        }
        console.log(`User disconnected: ${userId}`)
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap))
  })
})

app.use(express.json({ limit: "4mb" }))

// 4. Routes
app.use("/api/status", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" })
})
app.use("/api/v1/auth", userRouter)
app.use("/api/v1/messages", messageRouter)
app.use("/api/v1/rooms", roomRouter)
app.use("/api/v1/execution", executionRouter)
app.use("/api/v1/files", fileRouter)
app.use("/", (req: Request, res: Response) => {
  res.send("DevRoom API is running")
})

// 5. Database Connection
// We wrap this so it doesn't crash the export if it takes time
connectDB().then(() => {
    console.log("Connected to DB");
}).catch(err => {
    console.error("DB Connection Failed", err);
});

// --- CRITICAL FIX FOR VERCEL ---

// Only run server.listen if we are LOCALLY developing.
// Vercel handles the server start automatically, so calling listen() there causes a timeout/crash.
if (NODE_ENV !== "production") {
  const port = PORT ? parseInt(PORT) : 8080
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

// Export the Express 'app' so Vercel can turn it into a Serverless Function
export default app
