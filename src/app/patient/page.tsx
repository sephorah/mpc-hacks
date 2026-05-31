"use client";

import React, { useEffect, useRef } from "react";
import { Patient } from "@/types";

export default function PatientPage() {
  const formRef = useRef<HTMLFormElement>(null);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("submit!");

    const formData = new FormData(formRef.current as HTMLFormElement);
    const formObject = Object.fromEntries(formData.entries());
    const jsonBody = JSON.stringify(formObject);

    const response = await fetch('/api/intake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Tell the API to expect JSON
      },
      body: jsonBody
    });

  }

  // Initialize patient
  useEffect(() => {
    (async () => {
      const patient: Patient = await (await fetch('/api/init_patient')).json();
      console.log("patient:", patient);
    })();
  }, []);
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form ref={formRef} onSubmit={handleSubmit}>
        <label htmlFor="whatswrong">What's Wrong?</label>
        <br />
        <input id="whatswrong" name="whatswrong" type="text" />
        <br />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}
