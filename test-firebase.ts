import fs from "fs";
import path from "path";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { initializeApp as initWebApp } from "firebase/app";
import { getFirestore as getWebFirestore, doc as webDoc, getDoc as getWebDoc } from "firebase/firestore";

async function runTests() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found!");
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.log("Config loaded:", {
    projectId: config.projectId,
    firestoreDatabaseId: config.firestoreDatabaseId
  });

  // Test 1: Admin SDK Custom DB (Firebase Project)
  console.log("\n--- Testing Admin SDK Custom DB (Firebase Project) ---");
  try {
    // Delete existing apps to reinitialize
    const { deleteApp } = await import("firebase-admin/app");
    for (const app of getAdminApps()) {
      await deleteApp(app);
    }
    
    initAdminApp({ projectId: config.projectId });
    const adminDb = getAdminFirestore(config.firestoreDatabaseId);
    console.log("Admin SDK Custom DB (Firebase Project) Initialized. Querying...");
    const snap = await adminDb.collection("kel_app_store").doc("products").get();
    console.log("Admin SDK Custom DB (Firebase Project) Success! Document exists:", snap.exists);
  } catch (err: any) {
    console.error("Admin SDK Custom DB (Firebase Project) Failed:", err.message || err);
  }

  // Test 1b: Admin SDK Default DB (Hosting Project)
  console.log("\n--- Testing Admin SDK Default DB (Hosting Project) ---");
  try {
    const adminDbDefault = getAdminFirestore();
    console.log("Admin SDK Default DB (Hosting Project) Initialized. Querying...");
    const snap = await adminDbDefault.collection("kel_app_store").doc("products").get();
    console.log("Admin SDK Default DB (Hosting Project) Success! Document exists:", snap.exists);
  } catch (err: any) {
    console.error("Admin SDK Default DB (Hosting Project) Failed:", err.message || err);
  }

  // Test 2: Web SDK
  console.log("\n--- Testing Web SDK ---");
  try {
    const webApp = initWebApp(config);
    const webDb = getWebFirestore(webApp, config.firestoreDatabaseId);
    console.log("Web SDK Initialized. Querying...");
    const docRef = webDoc(webDb, "kel_app_store", "products");
    const snap = await getWebDoc(docRef);
    console.log("Web SDK Success! Document exists:", snap.exists());
  } catch (err: any) {
    console.error("Web SDK Failed:", err.message || err);
  }
}

runTests();
