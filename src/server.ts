import app from "./app";
import { ENV } from "./utils/env"

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Servidor iniciado en ${ENV.APP_HOST}:${ENV.APP_PORT}`));