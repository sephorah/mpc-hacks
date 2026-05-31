import { NextApiRequest } from "next";
import { Case, Patient } from "./types";
import { Queue } from "./queue";

declare global {
    var state: State;
}

export function initState() {
    global.state = new State();
}

export function getState() {
    return global.state;
}

export class State {
    patients: Map<string, Patient>
    cases: Map<string, Case>
    queue: Queue
    constructor() {
        this.patients = new Map();
        this.cases = new Map();
        this.queue = new Queue();
    }
}

export function getPatientFromReq(req: NextApiRequest): Patient | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    const cookies = Object.fromEntries(
        cookieHeader
            .split(";")
            .map((part) => {
                const [key, ...value] = part.trim().split("=");
                return [key, decodeURIComponent(value.join("="))];
            })
    );

    const patientID = cookies["patientID"];
    if (!patientID) return undefined;

    return state.patients.get(patientID);
}
