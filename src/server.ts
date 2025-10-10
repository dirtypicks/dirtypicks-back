import app from "./app.js";
import { ENV } from "./utils/env"

app.listen(ENV.APP_PORT, () => console.log(`Servidor iniciado en ${ENV.APP_HOST}:${ENV.APP_PORT}`));