const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const openApiDocument = require("./config/openapi");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
