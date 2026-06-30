const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const binExt = process.platform === "win32" ? ".cmd" : "";
const tauriBin = path.join(root, "node_modules", ".bin", `tauri${binExt}`);
const viteBin = path.join(root, "node_modules", ".bin", `vite${binExt}`);

if (fs.existsSync(tauriBin) && fs.existsSync(viteBin)) {
  process.exit(0);
}

console.log("Dependencies are missing. Running npm install first...");

const npmExecPath = process.env.npm_execpath;
const result = npmExecPath
  ? spawnSync(process.execPath, [npmExecPath, "install"], {
      cwd: root,
      stdio: "inherit",
      shell: false,
    })
  : spawnSync("npm install", {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
