import http from "http";

function getMetadata(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "metadata.google.internal",
      path: path,
      headers: {
        "Metadata-Flavor": "Google"
      }
    };
    http.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", (err) => reject(err));
  });
}

async function run() {
  try {
    const project = await getMetadata("/computeMetadata/v1/project/project-id");
    console.log("Metadata Project ID:", project);
    const sa = await getMetadata("/computeMetadata/v1/instance/service-accounts/default/email");
    console.log("Metadata Service Account:", sa);
  } catch (err: any) {
    console.error("Failed to get metadata:", err.message || err);
  }
}

run();
