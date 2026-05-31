"use server"

import { getState } from "@/state";
import { Patient } from "@/types";
import { NextApiRequest, NextApiResponse } from "next";
import {randomUUID} from "node:crypto";

const COOKIE_NAME = "patientID";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const state = getState();
    const patientID = randomUUID();

    const patient: Patient = {
        id: patientID,
        createdAt: new Date().toISOString(),
    };

    state.patients.set(patientID, patient);

    res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${encodeURIComponent(patient.id)}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`
    );

    return res.status(201).json({ patient });
}