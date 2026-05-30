import { createServer } from "node:http";
import next from "next";
import { initState } from "./state";
import { loadEnvFile } from 'node:process';

loadEnvFile(".env.local"); // Automatically reads './.env'

process.env.NEXT_RUNTIME = 'nodejs';

const app = next({ dev: process.env.NODE_ENV !== 'production' });

app.prepare().then(() => {
    const handler = app.getRequestHandler();
    const server = createServer(async (req, res) => {
        await handler(req, res);
    });

    initState();

    server.listen(3000, () => {
        console.log('Server running on port 3000.');
    });
});