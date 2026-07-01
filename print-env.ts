console.log("Environment Variables:");
for (const key of Object.keys(process.env)) {
  if (key.includes("FIREBASE") || key.includes("GOOGLE") || key.includes("CREDENTIALS") || key.includes("PROJECT")) {
    console.log(`${key}: ${process.env[key] ? "[SET]" : "[EMPTY]"}`);
  }
}
