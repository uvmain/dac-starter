import fs from 'node:fs'

const src = 'frontend/dist'
const dest = 'backend/dist/dist'

fs.cp(src, dest, { recursive: true }, (err) => {
  if (err) {
    console.error(`Error copying frontend dist: ${err}`)
  }
  console.log('Frontend dist copied to backend dist')
})
