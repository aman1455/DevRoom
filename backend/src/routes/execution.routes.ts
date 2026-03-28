import { Router } from "express"
import {
  executeCode,
  getAvailableLanguages,
  healthCheck,
} from "../controllers/execution.controller"

const executionRouter = Router()

// All execution routes should be protected (requires auth)
executionRouter.post("/", executeCode)
executionRouter.get("/languages", getAvailableLanguages)
executionRouter.get("/health", healthCheck)

export default executionRouter
