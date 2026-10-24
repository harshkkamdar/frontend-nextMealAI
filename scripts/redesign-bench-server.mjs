/**
 * redesign-bench-server.mjs - serve docs/redesign/proto and collect benchmark reports.
 * Usage: node scripts/redesign-bench-server.mjs [port]   (default 3030)
 * The emulator reaches the host at http://10.0.2.2:<port>/tab-bar.html?bench=1
 * Each POST /report is appended to docs/redesign/proto/bench-results.jsonl.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('docs/redesign/proto')
const port = Number(process.argv[2] || 3030)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (req.method === 'POST' && url.pathname === '/report') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      fs.appendFileSync(path.join(root, 'bench-results.jsonl'), JSON.stringify({ at: new Date().toISOString(), query: req.headers.referer || '', ...JSON.parse(body) }) + '\n')
      console.log('report', body)
      res.end('ok')
    })
    return
  }
  const file = path.join(root, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''))
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('not found') }
  res.setHeader('content-type', types[path.extname(file)] || 'application/octet-stream')
  fs.createReadStream(file).pipe(res)
}).listen(port, () => console.log(`bench server on :${port}`))
