import { spawn } from 'child_process'

export interface ClaudeRunnerResult {
  success: boolean
  data?: unknown
  rawOutput?: string
  error?: string
}

/**
 * Runs a prompt against the Claude Code CLI and returns parsed JSON.
 * Uses child_process.spawn — never the Anthropic API.
 */
export function runClaudePrompt(
  claudeBin: string,
  prompt: string,
  timeoutMs = 90_000,
  maxRetries = 2,
): Promise<ClaudeRunnerResult> {
  return attemptRun(claudeBin, prompt, timeoutMs, 0, maxRetries)
}

async function attemptRun(
  claudeBin: string,
  prompt: string,
  timeoutMs: number,
  attempt: number,
  maxRetries: number,
): Promise<ClaudeRunnerResult> {
  const result = await spawnOnce(claudeBin, prompt, timeoutMs)

  if (result.success) return result

  if (attempt < maxRetries) {
    // Linear backoff: wait attempt * 2s before retrying
    await new Promise((r) => setTimeout(r, (attempt + 1) * 2000))
    return attemptRun(claudeBin, prompt, timeoutMs, attempt + 1, maxRetries)
  }

  return result
}

function spawnOnce(
  claudeBin: string,
  prompt: string,
  timeoutMs: number,
): Promise<ClaudeRunnerResult> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let settled = false

    console.log(`[ClaudeRunner] spawn: ${claudeBin} -p "<prompt>"`)

    const proc = spawn(claudeBin, ['-p', prompt], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'], // fecha stdin explicitamente
    })

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      proc.kill()
      resolve({ success: false, error: `Timeout após ${timeoutMs / 1000}s` })
    }, timeoutMs)

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (settled) return
      settled = true

      console.log(`[ClaudeRunner] close code=${code} stdout=${stdout.length}chars stderr=${stderr.slice(0,100)}`)

      if (code !== 0) {
        resolve({
          success: false,
          error: stderr.trim() || `Processo encerrou com código ${code}`,
          rawOutput: stdout,
        })
        return
      }

      resolve(parseOutput(stdout))
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      resolve({ success: false, error: err.message })
    })
  })
}

function parseOutput(raw: string): ClaudeRunnerResult {
  const text = raw.trim()

  // 1. Direct JSON parse
  try {
    const data = JSON.parse(text)
    return { success: true, data, rawOutput: text }
  } catch { /* try next */ }

  // 2. Extract JSON from markdown code fence ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]+?)\n```/)
  if (fenceMatch) {
    try {
      const data = JSON.parse(fenceMatch[1].trim())
      return { success: true, data, rawOutput: text }
    } catch { /* fall through */ }
  }

  // 3. Find first { ... } block
  const braceMatch = text.match(/\{[\s\S]+\}/)
  if (braceMatch) {
    try {
      const data = JSON.parse(braceMatch[0])
      return { success: true, data, rawOutput: text }
    } catch { /* fall through */ }
  }

  return {
    success: false,
    error: 'Resposta não é JSON válido',
    rawOutput: text,
  }
}
