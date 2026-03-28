import { Request, Response } from "express"
import User from "../models/User"
import { generateToken } from "../lib/utils"
import cloudinary from "../lib/cloudinary"
import bcrypt from "bcryptjs"
import { Types } from "mongoose"

// Define request body types
interface SignupRequestBody {
  email: string
  password: string
  name: string
  profilPic?: string
  bio?: string
}

interface UpdateProfileRequestBody {
  name?: string
  avatarUrl?: string
  bio?: string
}

// Cast cloudinary to any to bypass type issues
const cl = cloudinary as any

export const signup = async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
  const { email, password, name, profilPic, bio } = req.body

  try {
    // Validate input
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Email, password, and name are required." })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." })
    }

    const salt = await bcrypt.genSalt(10)
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      profilPic: profilPic || "", // Default to empty string if not provided
      bio: bio || "", // Default to empty string if not provided
    })

    await newUser.save()

    // Generate token
    const token = generateToken(newUser._id)

    res.status(201).json({
      message: "User created successfully.",
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        bio: newUser.bio,
      },
      token,
    })
  } catch (error) {
    console.error("Error during signup:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

export const login = async (req: Request<{}, {}, { email: string; password: string }>, res: Response) => {
  const { email, password } = req.body

  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." })
    }

    // Generate token
    const token = generateToken(user._id)

    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
      token,
    })
  } catch (error) {
    console.error("Error during login:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

export const checkAuth = (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized." })
    }

    res.status(200).json({
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl,
        bio: req.user.bio,
      },
    })
  } catch (error) {
    console.error("Error checking authentication:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

export const GetAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password")
    res.status(200).json({
      users: users.map(user => ({
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      }))
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}

// Controller to update user profile
export const updateProfile = async (req: Request<{}, {}, UpdateProfileRequestBody>, res: Response) => {
  const { name, avatarUrl, bio } = req.body
  const userId = req.user!._id
  let updatedData

  try {
    if (!avatarUrl) {
      updatedData = await User.findByIdAndUpdate(
        userId,
        { name, bio },
        { new: true }
      ).select("-password")
    } else {
      const uploadedImage = await cl.uploader.upload(avatarUrl)

      updatedData = await User.findByIdAndUpdate(
        userId,
        { name, avatarUrl: uploadedImage.secure_url, bio },
        { new: true }
      ).select("-password")
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: updatedData!._id.toString(),
        email: updatedData!.email,
        name: updatedData!.name,
        avatarUrl: updatedData!.avatarUrl,
        bio: updatedData!.bio,
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Internal server error." })
  }
}
