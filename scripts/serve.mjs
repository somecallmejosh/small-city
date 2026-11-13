import { createServer } from 'node:http'
import { stat, readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve(new URL('../dist', import.meta.url).pathname)
const port = Number(process.env.PORT || 8800)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}
createServer(async (req, res) => {
  try {
    let pathname
    try {
      pathname = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname,
      )
    } catch {
      res.writeHead(400).end()
      return
    }
    let file = resolve(root, '.' + pathname)
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end()
      return
    }
    let code = 200
    try {
      const info = await stat(file)
      if (info.isDirectory()) file = resolve(file, 'index.html')
    } catch {
      file = resolve(root, '404.html')
      code = 404
    }
    const content = await readFile(file)
    res.writeHead(code, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(content)
  } catch {
    res.writeHead(500).end('Unable to serve this page.')
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`Local: http://localhost:${port}`),
)
