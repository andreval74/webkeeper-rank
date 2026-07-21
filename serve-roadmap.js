const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const filePath = path.join(__dirname, 'docs', 'roadmap.html');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading roadmap.html: ${err.message}`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Roadmap server running at http://localhost:${PORT}/`);
});
