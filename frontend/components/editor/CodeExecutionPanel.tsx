"use client"

import React, { useState } from "react"
import Editor from "@monaco-editor/react"
import { useRoom } from "@/app/RoomContext"
import { Play, StopCircle, X } from "lucide-react"
import { toast } from "sonner"

interface CodeExecutionPanelProps {
  initialCode?: string
  initialLanguage?: string
  onClose?: () => void
  onSubmit?: (code: string, language: string) => void // For interview submission
  submitLabel?: string
}

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", version: "18.15.0" },
  { id: "python", label: "Python", version: "3.9.0" },
  { id: "java", label: "Java", version: "17.0.0" },
  { id: "cpp", label: "C++", version: "10.2.0" },
  { id: "c", label: "C", version: "10.2.0" },
  { id: "go", label: "Go", version: "1.19.0" },
  { id: "rust", label: "Rust", version: "1.68.0" },
  { id: "typescript", label: "TypeScript", version: "5.1.0" },
  { id: "ruby", label: "Ruby", version: "3.1.0" },
  { id: "php", label: "PHP", version: "8.2.0" },
]

export default function CodeExecutionPanel({
  initialCode = "",
  initialLanguage = "javascript",
  onClose,
  onSubmit,
  submitLabel = "Submit",
}: CodeExecutionPanelProps) {
  const { executeCode } = useRoom()
  const [code, setCode] = useState(initialCode)
  const [language, setLanguage] = useState(initialLanguage)
  const [stdin, setStdin] = useState("")
  const [output, setOutput] = useState<{
    stdout: string
    stderr: string
    exitCode: number
    status: string
    time: number
    memory: number
  } | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showStdin, setShowStdin] = useState(false)

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code")
      return
    }
    setIsRunning(true)
    setOutput(null)
    try {
      const result = await executeCode(language, code, stdin)
      setOutput(result.run)
      if (result.run.exitCode === 0) {
        toast.success("Execution completed!")
      } else {
        toast.warning("Execution finished with errors")
      }
    } catch (err) {
      toast.error("Failed to execute code")
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit(code, language)
    }
  }

  const editorOptions = {
    minimap: { enabled: false } as const,
    fontSize: 14,
    lineNumbers: "on" as const,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    tabSize: 2,
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border-2 border-sidebar-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-sidebar-border bg-[#f3e8ff]">
        <h3 className="font-extrabold text-black">Code Execution</h3>
        <div className="flex items-center gap-2">
          {onSubmit && (
            <button
              onClick={handleSubmit}
              className="px-3 py-1 bg-[#39ff14] border-2 border-sidebar-border rounded font-bold text-sm hover:bg-[#b39ddb]"
            >
              {submitLabel}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-300"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-[#f3e8ff]">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 border-2 border-sidebar-border rounded bg-white font-bold text-sm"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowStdin(!showStdin)}
          className={`text-xs px-2 py-1 border-2 border-sidebar-border rounded ${
            showStdin ? "bg-[#b39ddb]" : "bg-white"
          }`}
        >
          {showStdin ? "Hide stdin" : "Show stdin"}
        </button>
        <div className="flex-1" />
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1 bg-[#39ff14] border-2 border-sidebar-border rounded font-bold hover:bg-[#b39ddb] disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <StopCircle className="w-4 h-4" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run
            </>
          )}
        </button>
      </div>

      {/* Stdin input */}
      {showStdin && (
        <div className="p-2 border-b-2 border-sidebar-border bg-[#f3e8ff]">
          <label className="text-xs font-bold mb-1 block">Standard Input:</label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for the program..."
            className="w-full h-20 px-2 py-1 border border-gray-300 rounded font-mono text-sm"
          />
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={editorOptions}
        />
      </div>

      {/* Output Panel */}
      {(output || isRunning) && (
        <div className="h-1/3 border-t-2 border-sidebar-border bg-black flex flex-col">
          <div className="px-4 py-2 bg-gray-900 text-white text-sm font-bold flex justify-between">
            <span>Output</span>
            {output && (
              <span className="text-xs">
                Exit: {output.exitCode} | Time: {(output.time / 1000000).toFixed(2)}ms | Memory: {(output.memory / 1024).toFixed(1)}KB
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            {isRunning ? (
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                Running...
              </div>
            ) : (
              <>
                {output.stdout && (
                  <pre className="text-green-400 whitespace-pre-wrap">{output.stdout}</pre>
                )}
                {output.stderr && (
                  <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>
                )}
                {!output.stdout && !output.stderr && (
                  <span className="text-gray-500">(No output)</span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
