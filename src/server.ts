import { createServer } from "node:http";
import next from "next";
import { State } from "./state";

function initState() {
    // state is initialized in state.ts when first imported
}

import { loadEnvConfig } from "@next/env";
import { loadEnvFile } from "node:process";
loadEnvFile(".env.local")
loadEnvConfig(process.cwd());


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