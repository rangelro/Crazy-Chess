import { readConfig } from './config/config.js'; import { createApplication } from './bootstrap/create-server.js';
const config=readConfig(); const app=await createApplication(config); app.server.listen(config.port,()=>console.log(`Servidor de Xadrez rodando na porta ${config.port}`));
async function shutdown(){app.server.close(async()=>{await app.close();process.exit(0);});} process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
