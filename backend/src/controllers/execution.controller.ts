import axios from "axios"
import { Request, Response } from "express"

// Piston API configuration
const PISTON_URL = process.env.PISTON_API_URL || "http://localhost:2000"

// Define supported languages and their default versions
export const SUPPORTED_LANGUAGES = {
  javascript: "18.15.0",
  python: "3.9.0",
  python3: "3.9.0",
  java: "17.0.0",
  c: "10.2.0",
  cpp: "10.2.0",
  csharp: "6.0.0",
  go: "1.19.0",
  rust: "1.68.0",
  ruby: "3.1.0",
  php: "8.2.0",
  swift: "5.8.0",
  kotlin: "1.8.0",
  typescript: "5.1.0",
  node: "18.15.0",
}

interface ExecuteRequestBody {
  language: string
  code: string
  stdin?: string
  args?: string[]
}

export const executeCode = async (req: Request<{}, {}, ExecuteRequestBody>, res: Response) => {
  try {
    const { language, code, stdin = "", args = [] } = req.body

    if (!language || !code) {
      return res.status(400).json({
        message: "Language and code are required.",
      })
    }

    // Validate language
    const normalizedLang = language.toLowerCase()
    if (!SUPPORTED_LANGUAGES[normalizedLang as keyof typeof SUPPORTED_LANGUAGES]) {
      return res.status(400).json({
        message: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}`,
      })
    }

    const version = SUPPORTED_LANGUAGES[normalizedLang as keyof typeof SUPPORTED_LANGUAGES]

    // Prepare payload for Piston
    const payload = {
      language: normalizedLang,
      version,
      files: [
        {
          content: code,
        },
      ],
      stdin: stdin || "",
      args: Array.isArray(args) ? args : [],
      compileTimeout: 10000, // 10s compile timeout
      runTimeout: 5000, // 5s exec timeout
    }

    // Make request to Piston
    const response = await axios.post(`${PISTON_URL}/api/v2/execute`, payload, {
      timeout: 15000, // 15s total timeout
      headers: {
        "Content-Type": "application/json",
      },
    })

    const result = response.data

    res.status(200).json({
      success: true,
      language: normalizedLang,
      version,
      run: {
        stdout: result.run?.stdout || "",
        stderr: result.run?.stderr || "",
        exitCode: result.run?.exitCode ?? -1,
        status: result.run?.status || "unknown",
        time: result.run?.cpuTime || result.run?.time || 0,
        memory: result.run?.memoryUsage || 0,
      },
    })
  } catch (error: any) {
    console.error("Execution error:", error)

    if (error.response) {
      // Piston returned an error
      const status = error.response.status
      const data = error.response.data
      res.status(status).json({
        success: false,
        message: data?.message || "Execution failed",
        details: data,
      })
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      // Piston not reachable
      res.status(503).json({
        success: false,
        message: "Code execution service is unavailable. Please try again later.",
      })
    } else {
      // Generic error
      res.status(500).json({
        success: false,
        message: "Internal server error during code execution.",
        error: error.message,
      })
    }
  }
}

// Optional: endpoint to list available languages from Piston
export const getAvailableLanguages = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PISTON_URL}/api/v2/runtimes`, {
      timeout: 5000,
    })
    res.status(200).json({
      languages: response.data,
    })
  } catch (error) {
    console.error("Error fetching runtimes:", error)
    res.status(503).json({
      message: "Could not fetch available languages from execution service.",
    })
  }
}

// Optional: endpoint to test execution service health
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PISTON_URL}/api/v2/health`, {
      timeout: 2000,
    })
    res.status(200).json({
      status: "healthy",
      service: response.data,
    })
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      message: "Cannot connect to code execution service.",
    })
  }
}
