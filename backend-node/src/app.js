const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const { securityHeaders, auditTrail } = require("./middlewares/security");
const openApiDocument = require("./config/openapi");
const env = require("./config/env");

const app = express();

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (env.corsOrigins.length === 0 && env.nodeEnv !== "production") {
      return callback(null, true);
    }

    if (env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin tidak diizinkan oleh CORS."));
  },
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
}
app.use(securityHeaders);
app.use(auditTrail);

if (env.apiDocsEnabled) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}
app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
