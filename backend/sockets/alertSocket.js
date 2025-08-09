// sockets/alertSocket.js
let io = null;

function initSocket(server) {
  try {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
  } catch (err) {
    console.error("Failed to init socket:", err);
  }
}

async function emitAlert(incident) {
  if (!io) return;
  io.emit("incident", incident);
}

async function emitForceLogout(ip) {
  if (!io) return;
  // Admin dashboards / frontends should be listening for 'forceLogout' and check payload.ip
  io.emit("forceLogout", { ip, message: "IP blocked by admin. Please log out." });
}

module.exports = { initSocket, emitAlert, emitForceLogout };
