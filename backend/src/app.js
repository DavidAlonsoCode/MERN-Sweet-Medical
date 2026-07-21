//import './extensions.js';
import cors from "cors";
import express from "express";
import router from "./routes/router.js";
import { createRequire } from "module";

import swaggerUi from "swagger-ui-express";

import errorHandler from "./middlewares/error.handler.middleware.js";
import pageNotFoundHandler from "./middlewares/page.not.found.middleware.js";

const require = createRequire(import.meta.url)
const swaggerSpec = require("./docs/swaggerSpec.json")

const app = express();
/*
 * app.use() hace un middleware, cada vez que llega una request le pregunta a
 * lo de adentro del parentesis si sabe que hacer con lo recibido
 *
 * Los app use ejecutan en orden!
 * */
app.use(express.json());
app.use(cors());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/healthcheck", (req, res) => {
  res.json({
    status: "App ejecutando correctamente :)",
  });
});
app.use(router);
app.use(pageNotFoundHandler); //tiene que ser el anteultimo
app.use(errorHandler); //tiene que ser el ultimo

export default app;
