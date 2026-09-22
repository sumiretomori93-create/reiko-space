import http from "node:http";
import fs from "node:fs/promises";

const port = Number(process.env.PORT || 4173);
const htmlPath = new URL("../dist/index.html", import.meta.url);

const server = http.createServer(async (request, response) => {
  if (request.url !== "/" && request.url !== "/index.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  const html = await fs.readFile(htmlPath);
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});
