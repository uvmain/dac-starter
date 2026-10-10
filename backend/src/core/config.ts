import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { colourLog } from './logger'

export const Config = {
  BEARER_TOKEN: 'temporary-token',
  DB_PATH: '../data/sqlite.db',
}

export async function loadEnvironmentVariables(): Promise<void> {
  await loadDotEnv()
  loadConfig()
  if (Config.BEARER_TOKEN === 'temporary-token') {
    colourLog('yellow', 'Using temporary bearer token')
  }
}

function loadConfig() {
  Config.BEARER_TOKEN = process.env.BEARER_TOKEN || Config.BEARER_TOKEN
  Config.DB_PATH = process.env.DB_PATH || Config.DB_PATH
  colourLog('green', `DB_PATH: ${Config.DB_PATH}`)
}

function loadDotEnv(): boolean {
  const __dirname = process.cwd()
  const dotEnvPath = path.join(__dirname, '.env')
  if (fs.existsSync(dotEnvPath)) {
    colourLog('green', `Loading environment variables from ${dotEnvPath}`)
    const fileContent = fs.readFileSync(dotEnvPath, 'utf-8')
    const envVars = fileContent.split('\n')
    envVars.forEach((envVar) => {
      // only split at first instance of = to allow for values containing = character
      const [key, ...valueParts] = envVar.split('=')
      const value = valueParts.join('=').trim()
      if (key && value) {
        // load .env variables into process.env without overwriting existing environment variables set by cross-env
        process.env[key] = process.env[key] ? process.env[key] : value
      }
    })
    return true
  }
  colourLog('yellow', `.env not found at ${dotEnvPath}`)
  return false
}
