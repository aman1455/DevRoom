import { Request, Response } from "express"
import cloudinary from "../lib/cloudinary"
import { Types } from "mongoose"

// Cast cloudinary to any to bypass type issues
const cl = cloudinary as any

interface UploadedFile {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Multer parses the request: single file => req.file; multiple => req.files
    const files = req.file || req.files as UploadedFile | UploadedFile[] | undefined
    if (!files) {
      return res.status(400).json({ message: "No file provided." })
    }

    const fileArray = Array.isArray(files) ? files : [files]

    const results = await Promise.all(
      fileArray.map(async (file) => {
        // Validate file size (10MB limit) - multer already enforces but double-check
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          throw new Error("File size exceeds 10MB limit.")
        }

        // Determine resource type based on MIME
        let resourceType: "raw" | "image" | "video" = "raw"
        if (file.mimetype.startsWith("image/")) {
          resourceType = "image"
        } else if (file.mimetype.startsWith("video/")) {
          resourceType = "video"
        }

        // Upload buffer to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cl.uploader.upload_stream(
            {
              resource_type: resourceType,
              folder: "devroom/files",
            },
            (error: any, result: any) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
          uploadStream.end(file.buffer)
        })

        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          resourceType: uploadResult.resource_type,
        }
      }),
    )

    res.status(200).json({
      message: "File(s) uploaded successfully.",
      files: results.length === 1 ? results[0] : results,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    res.status(500).json({
      message: "Internal server error during file upload.",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const deleteFile = async (req: Request<{ publicId: string }>, res: Response) => {
  try {
    const { publicId } = req.params

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required." })
    }

    const result = await cl.uploader.destroy(publicId)

    res.status(200).json({
      message: "File deleted successfully.",
      result,
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    res.status(500).json({
      message: "Internal server error during file deletion.",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
