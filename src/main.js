const path = require('path');
const _ = require('lodash');

const jsonServer = require('json-server');
const server = jsonServer.create();
const dbFilePath = path.resolve(__dirname, '../db/db.json');
const router = jsonServer.router(dbFilePath);
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use(async (req, res, next) => {
  if (req.method === 'POST') {
    req.body.createdAt = Date.now();
  }

  /*
    Fake delay api
  */
  if (req.url.includes('/products') || req.url.includes('/departments')) {
    // fake delay
    await new Promise((res) => {
      setTimeout(() => {
        res();
      }, _.random(200, 600));
    });
  }

  // Continue to JSON Server router
  next();
});

// Use default router
const HOST_PORT = 9050;
server.use(router);
server.listen(HOST_PORT, () => {
  console.log(`JSON Server is running at: http://localhost:${HOST_PORT}`);
});
