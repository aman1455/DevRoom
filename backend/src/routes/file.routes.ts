import { Router } from "express"
import multer from "multer"
import cloudinary from "../lib/cloudinary"
import { protectRoute } from "../middleware/auth"
import { uploadFile, deleteFile } from "../controllers/file.controller"

// Configure multer for memory storage (we'll upload manually to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all files; optionally whitelist extensions
    cb(null, true)
  },
})

const fileRouter = Router()

// Single file upload
fileRouter.post(
  "/upload",
  protectRoute,
  upload.single("file"),
  uploadFile,
)

// Multiple files upload (optional endpoint)
fileRouter.post(
  "/upload/multiple",
  protectRoute,
  upload.array("files", 10), // Max 10 files
  uploadFile,
)

// Delete file by publicId
fileRouter.delete("/:publicId", protectRoute, deleteFile)

export default fileRouter
