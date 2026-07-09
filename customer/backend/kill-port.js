/**
 * kill-port.js
 * Run before starting the dev server to ensure port 5000 is free.
 * Works on Windows, Mac, and Linux.
 * Usage: node kill-port.js
 */
const { execSync } = require("child_process");
const PORT = parseInt(process.env.PORT || "5000", 10);

function killPort(port) {
  try {
    if (process.platform === "win32") {
      // Find the PID using netstat, then kill it
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const lines = output.trim().split("\n");
      const pids = new Set();
      for (const line of lines) {
        // Only match LISTENING state to avoid killing TIME_WAIT connections
        if (line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0") pids.add(pid);
        }
      }
      if (pids.size === 0) {
        console.log(`✅  Port ${port} is free.`);
        return;
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "inherit" });
          console.log(`✅  Killed process ${pid} on port ${port}.`);
        } catch {
          // Already dead — that's fine
        }
      }
    } else {
      // Mac / Linux
      try {
        const pid = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
        if (pid) {
          execSync(`kill -9 ${pid}`, { stdio: "inherit" });
          console.log(`✅  Killed process ${pid} on port ${port}.`);
        } else {
          console.log(`✅  Port ${port} is free.`);
        }
      } catch {
        console.log(`✅  Port ${port} is free.`);
      }
    }
  } catch (err) {
    // Port was not in use — this is fine
    console.log(`✅  Port ${port} is free.`);
  }
}

killPort(PORT);
