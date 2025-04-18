# Realtime Notifications: Elearning Website Backend

## WebSocket Server
- **Library**: Socket.IO
- **Initialization File**: `socketServer.ts`
- **Integration**:
  - The WebSocket server is initialized and attached to the HTTP server in `server.ts`.
  - Listens for client connections and handles events.

## Key Events
1. **Connection**:
   - Logs when a user connects.
2. **Notification**:
   - Listens for `notification` events from clients.
   - Broadcasts the received data to all connected clients using the `newNotification` event.
3. **Disconnection**:
   - Logs when a user disconnects.

## Use Case
- Enables real-time communication for features like notifications, likely for an admin dashboard or user interface.

### Related Files
- `socketServer.ts`: Contains the WebSocket server logic.
- `server.ts`: Integrates the WebSocket server with the main HTTP server.
