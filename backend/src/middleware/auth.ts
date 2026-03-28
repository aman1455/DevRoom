import jwt from "jsonwebtoken"
import User from "../models/User"
import { Request, Response, NextFunction } from "express"

export const protectRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as { id: string }
    const user = await User.findById(decoded.id).select("-password")
    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" })
      return
    }
    req.user = user as any // Cast to augmented type
    next()
  } catch (error) {
    console.error("Token verification failed:", error)
    res.status(401).json({ message: "Not authorized, token failed" })
  }
}
