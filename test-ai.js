const http = require('http');

async function runTest() {
  console.log("🚀 Starting AI Feature Test...");
  
  const payload = {
    patientName: "AI Test Patient",
    serviceType: "RENEWAL",
    conditionKey: "Lisinopril",
    structuredData: {
      medicationName: "Lisinopril",
      currentDosage: "10mg",
      frequency: "Once daily",
      requestingDosageChange: false
    },
    freeText: "I've been feeling generally okay, but sometimes I get a bit dizzy when I stand up too quickly. It usually passes after a few seconds, but I thought I should mention it just in case it's related to the medication.",
    redFlagChecks: {
      shortnessOfBreath: false,
      chestPain: false,
      suddenVisionChanges: false,
      severeHeadache: false,
      suicidalThoughts: false,
      seizureOrFainting: false
    },
    vitals: {
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 72
    }
  };

  try {
    console.log("1. Submitting new case with long free-text notes...");
    const submitRes = await fetch("http://localhost:3000/api/submit-case", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!submitRes.ok) {
      throw new Error(`Submit failed: ${submitRes.status} ${submitRes.statusText}`);
    }

    const submitData = await submitRes.json();
    const caseId = submitData.case.id;
    console.log(`✅ Case created successfully! Case ID: ${caseId}`);
    
    console.log("\n2. Triggering AI summary generation via /api/process-case...");
    const processRes = await fetch("http://localhost:3000/api/process-case", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId })
    });

    if (!processRes.ok) {
      throw new Error(`Process failed: ${processRes.status} ${processRes.statusText}`);
    }

    const processData = await processRes.json();
    
    if (processData.success) {
      console.log(`✅ AI successfully generated a summary!`);
      console.log(`\nOriginal Text: "${payload.freeText}"`);
      console.log(`AI Summary (Under 15 words): "${processData.summary}"`);
      
      if (processData.fallback) {
        console.warn("\n⚠️ WARNING: The AI feature used the fallback method (truncation). This usually means the Google API key is missing or invalid.");
      } else {
        console.log("\n🎉 The Gemini 2.0 Flash integration is completely ONLINE and working correctly.");
      }
    } else {
      console.error("❌ AI processing returned success: false", processData);
    }
    
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  }
}

runTest();
