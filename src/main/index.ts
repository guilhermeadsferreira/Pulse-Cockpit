import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { SettingsManager } from './registry/SettingsManager'
import { PersonRegistry } from './registry/PersonRegistry'
import { DetectedRegistry } from './registry/DetectedRegistry'
import { setupWorkspace } from './workspace/WorkspaceSetup'
import { runClaudePrompt } from './ingestion/ClaudeRunner'
import { FileWatcher } from './ingestion/FileWatcher'

let mainWindow: BrowserWindow | null = null
let fileWatcher:  FileWatcher  | null = null

function getRegistry(): PersonRegistry {
  const { workspacePath } = SettingsManager.load()
  return new PersonRegistry(workspacePath)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0B0D11',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env['VITE_DEV_SERVER_URL']) {
    mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  // ── Debug ─────────────────────────────────────────────────
  ipcMain.handle('ipc:ping', () => ({ ok: true, ts: Date.now() }))

  // ── Settings ──────────────────────────────────────────────
  ipcMain.handle('settings:load', () => SettingsManager.load())

  ipcMain.handle('settings:save', (_event, settings) => {
    SettingsManager.save(settings)
  })

  ipcMain.handle('settings:detect-claude', () => SettingsManager.detectClaudeBin())

  ipcMain.handle('settings:setup-workspace', async (_event, workspacePath: string) => {
    await setupWorkspace(workspacePath)
  })

  ipcMain.handle('settings:select-folder', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Selecionar pasta do workspace',
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // ── People ────────────────────────────────────────────────
  ipcMain.handle('people:list', () => {
    return getRegistry().list()
  })

  ipcMain.handle('people:get', (_event, slug: string) => {
    return getRegistry().get(slug)
  })

  ipcMain.handle('people:save', async (_event, config) => {
    const isNew = !getRegistry().get(config.slug)
    getRegistry().save(config)
    // If this is a newly registered person, reprocess any pending inbox items
    if (isNew && fileWatcher) {
      const count = await fileWatcher.reprocessPending(config.slug)
      if (count > 0) console.log(`[people:save] triggered reprocess of ${count} pending item(s) for "${config.slug}"`)
    }
  })

  ipcMain.handle('people:delete', (_event, slug: string) => {
    getRegistry().delete(slug)
  })

  // ── Artifacts ─────────────────────────────────────────────
  ipcMain.handle('artifacts:list', (_event, slug: string) => {
    return getRegistry().listArtifacts(slug)
  })

  // ── People: Perfil vivo ───────────────────────────────────
  ipcMain.handle('people:get-perfil', (_event, slug: string) => {
    return getRegistry().getPerfil(slug)
  })

  // ── Detected people ───────────────────────────────────────
  ipcMain.handle('detected:list', () => {
    const { workspacePath } = SettingsManager.load()
    return new DetectedRegistry(workspacePath).list()
  })

  ipcMain.handle('detected:dismiss', (_event, slug: string) => {
    const { workspacePath } = SettingsManager.load()
    new DetectedRegistry(workspacePath).dismiss(slug)
  })

  // ── Ingestion ─────────────────────────────────────────────
  ipcMain.handle('ingestion:queue', () => {
    return fileWatcher ? fileWatcher.getQueue() : []
  })

  ipcMain.handle('ingestion:enqueue', (_event, filePath: string) => {
    if (fileWatcher) fileWatcher.enqueue(filePath)
  })

  // ── AI ────────────────────────────────────────────────────
  ipcMain.handle('ai:test', async () => {
    console.log('[ai:test] handler chamado')
    const settings = SettingsManager.load()
    console.log('[ai:test] claudeBinPath:', settings.claudeBinPath)
    if (!settings.claudeBinPath) {
      return { success: false, error: 'Claude CLI não configurado. Configure o caminho em Settings.' }
    }
    const prompt = 'Respond with ONLY this exact JSON and nothing else: {"status":"ok","message":"Claude Code CLI funcionando!"}'
    return runClaudePrompt(settings.claudeBinPath, prompt, 30_000)
  })

  ipcMain.handle('ai:generate-agenda', () => ({ error: 'Not implemented — Fase 3' }))
  ipcMain.handle('ai:cycle-report',    () => ({ error: 'Not implemented — Fase 3' }))

  // ── Shell ─────────────────────────────────────────────────
  ipcMain.handle('shell:open', (_event, filePath: string) => {
    return shell.openPath(filePath)
  })
}

app.whenReady().then(async () => {
  const settings = SettingsManager.load()
  await setupWorkspace(settings.workspacePath)
  registerIpcHandlers()
  createWindow()

  // Start FileWatcher after window is created
  fileWatcher = new FileWatcher(settings.workspacePath)
  fileWatcher.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  fileWatcher?.stop()
  if (process.platform !== 'darwin') app.quit()
})
