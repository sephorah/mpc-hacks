import { Patient } from "./types";

export type Patient {
    id: string;
    createdAt: string;
};

export class State {
    patients: Map<string, Patient> 
    constructor() {
        this.patients = new Map();
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