// Load environment variables before importing anything that reads them at
// module-evaluation time (e.g. app.js reads CORS_ORIGIN on import).
import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 8080;

// Bind the port immediately so the hosting platform's port scan succeeds even
// while MongoDB is still connecting. Previously the server only listened AFTER
// a successful DB connection, so any DB hiccup meant the port never opened and
// the deploy failed with "no open ports detected". Mongoose buffers queries
// until the connection is ready, so early requests are handled gracefully.
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running at port: ${port}`);
});

server.on("error", (err) => {
  console.error("HTTP server error:", err?.message || err);
});

// Connect to MongoDB in the background (with retry). A DB failure logs and
// retries instead of taking the whole process down.
void connectDB();

// Keep the process alive on unexpected async errors rather than crashing the
// deploy; log them so they remain visible.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
