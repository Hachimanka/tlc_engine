import net from "node:net";

const port = Number(process.env.PORT ?? 3000);
const host = "127.0.0.1";
const url = `http://localhost:${port}`;

if (process.env.SKIP_PREDEV_CHECK === "1") {
  process.exit(0);
}

function canBindPort() {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function probeServer() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    return response.status;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const isPortFree = await canBindPort();

if (isPortFree) {
  process.exit(0);
}

const status = await probeServer();

if (status) {
  console.error(
    [
      `Dev server validation failed: ${url} is already in use and responding with HTTP ${status}.`,
      "Use the existing server instead of starting another one.",
      "",
      "To inspect the process on Windows:",
      `  Get-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess`,
      "",
      "To stop it after confirming the PID:",
      "  taskkill /PID <PID> /F",
      "",
      "To bypass this guard intentionally:",
      "  $env:SKIP_PREDEV_CHECK='1'; npm run dev",
    ].join("\n"),
  );
  process.exit(1);
}

console.error(
  [
    `Dev server validation failed: port ${port} is occupied, but ${url} did not respond.`,
    "This usually means a stale or stuck Next.js process is holding the port.",
    "",
    "To inspect the process on Windows:",
    `  Get-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess`,
    "",
    "To stop it after confirming the PID:",
    "  taskkill /PID <PID> /F",
    "",
    "Then run:",
    "  npm run dev",
  ].join("\n"),
);

process.exit(1);
