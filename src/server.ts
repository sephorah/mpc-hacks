import { createServer } from "node:http";
import next from "next";
import { State } from "./state";

declare global {
    var state: State;
}

function initState() {
    global.state = new State();
}

initState();

export function getState() {
    return global.state;
}

process.env.NEXT_RUNTIME = 'nodejs';

const app = next({ dev: process.env.NODE_ENV !== 'production' });

app.prepare().then(() => {
    const handler = app.getRequestHandler();
    const server = createServer(async (req, res) => {
        await handler(req, res);
    });

    server.listen(3000, () => {
        console.log('Server running on port 3000.');
    });
});