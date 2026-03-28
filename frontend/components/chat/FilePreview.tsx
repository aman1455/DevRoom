"use client"

import React, { useState } from "react"
import {
  FileText,
  File,
  Image as ImageIcon,
  FileCode,
  ExternalLink,
  Download,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FilePreviewProps {
  url: string
  fileName?: string
  fileType?: string
  compact?: boolean
}

// Detect file type from MIME or extension
function getFileCategory(type?: string, name?: string): "image" | "pdf" | "code" | "text" | "video" | "other" {
  if (!type && !name) return "other"

  const mime = type?.toLowerCase() || ""
  const ext = name?.toLowerCase().split(".").pop() || ""

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"]
  const videoExts = ["mp4", "mov", "avi", "wmv", "flv", "webm"]
  const codeExts = ["js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "h", "hpp", "cs", "go", "rs", "rb", "php", "swift", "kt", "m", "json", "xml", "html", "css", "scss"]
  const textExts = ["txt", "md", "csv", "log", "ini", "yaml", "yml", "toml"]

  if (mime.startsWith("image/")) return "image"
  if (mime === "application/pdf") return "pdf"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("xml")) return "text"

  if (codeExts.includes(ext)) return "code"
  if (textExts.includes(ext)) return "text"
  if (imageExts.includes(ext)) return "image"
  if (videoExts.includes(ext)) return "video"

  return "other"
}

export default function FilePreview({ url, fileName, fileType, compact = false }: FilePreviewProps) {
  const [showFullImage, setShowFullImage] = useState(false)
  const category = getFileCategory(fileType, fileName)

  if (category === "image") {
    if (compact) {
      return (
        <div className="relative w-12 h-12 overflow-hidden rounded border-2 border-sidebar-border">
          <img
            src={url}
            alt={fileName || "Image"}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setShowFullImage(true)}
          />
        </div>
      )
    }

    return (
      <>
        <div
          className="relative rounded-xl overflow-hidden cursor-pointer group border-2 border-sidebar-border"
          onClick={() => setShowFullImage(true)}
        >
          <img
            src={url}
            alt={fileName || "Image"}
            className="w-full max-h-60 object-contain bg-gray-100"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span className="text-white font-bold">Click to enlarge</span>
          </div>
        </div>

        {/* Enlarged Modal */}
        {showFullImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-[90vw] max-h-[80vh]">
              <img
                src={url}
                alt={fileName || "Image"}
                className="max-w-full max-h-[80vh] object-contain rounded-lg border-4 border-white"
              />
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute -top-3 -right-3 bg-white border-2 border-black rounded-full w-8 h-8 flex items-center justify-center font-bold"
              >
                ×
              </button>
              <a
                href={url}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 bg-white border border-black rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1 hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}
      </>
    )
  }

  if (category === "pdf") {
    if (compact) {
      return (
        <div className="w-12 h-12 border-2 border-red-600 rounded flex items-center justify-center bg-red-50">
          <FileText className="w-6 h-6 text-red-600" />
        </div>
      )
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 border-2 border-red-600 rounded-lg bg-red-50 hover:bg-red-100 transition group"
      >
        <div className="w-12 h-12 border-2 border-red-600 rounded flex items-center justify-center bg-white">
          <FileText className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-black truncate">{fileName || "PDF Document"}</div>
          <div className="text-xs text-gray-500">PDF • Click to open</div>
        </div>
        <ExternalLink className="w-5 h-5 text-red-600 group-hover:scale-110" />
      </a>
    )
  }

  if (category === "code") {
    if (compact) {
      return (
        <div className="w-12 h-12 border-2 border-gray-800 rounded flex items-center justify-center bg-gray-100">
          <FileCode className="w-6 h-6 text-gray-800" />
        </div>
      )
    }

    // For code files, try to fetch and display preview?
    // For now, just show as downloadable file
    return (
      <div className="flex items-center gap-3 p-4 border-2 border-gray-800 rounded-lg bg-gray-50">
        <div className="w-12 h-12 border-2 border-gray-800 rounded flex items-center justify-center bg-white">
          <FileCode className="w-6 h-6 text-gray-800" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-black truncate">{fileName || "Code File"}</div>
          <div className="text-xs text-gray-500">
            Code ({fileType || "unknown"})
          </div>
        </div>
        <a
          href={url}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 border-2 border-sidebar-border rounded bg-white hover:bg-gray-100 font-bold text-sm"
        >
          Download
        </a>
      </div>
    )
  }

  // Default file preview
  if (compact) {
    return (
      <div className="w-12 h-12 border-2 border-gray-400 rounded flex items-center justify-center bg-gray-100">
        <File className="w-6 h-6 text-gray-500" />
      </div>
    )
  }

  return (
    <a
      href={url}
      download={fileName}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 border-2 border-sidebar-border rounded-lg bg-[#f3e8ff] hover:bg-[#e9d5ff] transition group"
    >
      <div className="w-12 h-12 border-2 border-sidebar-border rounded flex items-center justify-center bg-white">
        <File className="w-6 h-6 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-black truncate">{fileName || "File"}</div>
        <div className="text-xs text-gray-500">{fileType || "Unknown type"}</div>
      </div>
      <Download className="w-5 h-5 text-gray-500 group-hover:scale-110" />
    </a>
  )
}
