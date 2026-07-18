const http = require('http');
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    console.log(body);
    res.end('ok');
    process.exit(0);
  });
});
server.listen(3001, () => console.log('Listening on 3001'));
