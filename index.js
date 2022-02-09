const http = require("http");
const fs = require("fs");
const url = require("url");
const {
  consultarUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  transferirSaldo,
  consultarTransferencias,
} = require("./db");

const server = http.createServer(async (req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.setHeader("content-type", "text/html");
    const html = fs.readFileSync("index.html", "utf8");
    res.end(html);
  }

  if (req.url.includes("/usuarios") && req.method === "GET") {
    const result = await consultarUsuarios();
    if (!result.ok) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify(result.data));
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result.data));
  }

  if (req.url.includes("/usuario") && req.method === "POST") {
    let body;
    req.on("data", (data) => {
      body = data;
    });
    req.on("end", async () => {
      const { nombre, balance } = JSON.parse(body);
      const result = await crearUsuario([nombre, balance]);

      if (!result.ok) {
        res.writeHead(500, { "content-type": "application/json" });
        return res.end(JSON.stringify(result.data));
      }

      res.writeHead(201, { "content-type": "application/json" });
      res.end(JSON.stringify(result.data));
    });
  }

  if (req.url.includes("/usuario") && req.method === "PUT") {
    const { id } = url.parse(req.url, true).query;
    let body;
    req.on("data", (data) => {
      body = data;
    });
    req.on("end", async () => {
      const { name, balance } = JSON.parse(body);
      const result = await editarUsuario([id, name, balance]);

      if (!result.ok) {
        res.writeHead(500, { "content-type": "application/json" });
        return res.end(JSON.stringify(result.data));
      }

      if (result.data.length === 0) {
        res.writeHead(403, { "content-type": "application/json" });
        return res.end(
          JSON.stringify({
            error: "No se encuentra el id en la base de datos.",
          })
        );
      }

      res.writeHead(201, { "content-type": "application/json" });
      res.end(JSON.stringify(result.data));
    });
  }

  if (req.url.includes("/usuario") && req.method === "DELETE") {
    const { id } = url.parse(req.url, true).query;
    const result = await eliminarUsuario(id);
    if (!result.ok) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify(result.data));
    }

    if (result.data.length === 0) {
      res.writeHead(403, { "content-type": "application/json" });
      return res.end(
        JSON.stringify({ error: "No se encuentra el id en la base de datos." })
      );
    }

    res.writeHead(201, { "content-type": "application/json" });
    res.end(JSON.stringify(result.data));
  }

  if (req.url.includes("/transferencia") && req.method === "POST") {
    let body;
    req.on("data", (data) => {
      body = data;
    });
    req.on("end", async () => {
      const { emisor, receptor, monto } = JSON.parse(body);
      const result = await transferirSaldo(emisor, receptor, monto);

      if (!result.ok) {
        res.writeHead(500, { "content-type": "application/json" });
        return res.end(JSON.stringify(result.data));
      }

      res.writeHead(201, { "content-type": "application/json" });
      res.end(JSON.stringify(result.data));
    });
  }

  if (req.url.includes("/transferencias") && req.method === "GET") {
    const result = await consultarTransferencias();
    if (!result.ok) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify(result.data));
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result.data));
  }
});

server.listen(3000, () => console.log("Server ON"));
