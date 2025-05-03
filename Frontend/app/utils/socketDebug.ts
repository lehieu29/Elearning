export const socketDebugger = (socket: any) => {
  socket.on('connect', () => {
    console.log('%c[Socket] Connected', 'color: green', {
      id: socket.id,
      transport: socket.io.engine.transport.name
    });
  });

  socket.on('connect_error', (error: any) => {
    console.log('%c[Socket] Connection Error', 'color: red', error);
  });

  socket.io.on('upgrade', () => {
    console.log('%c[Socket] Upgraded', 'color: blue', {
      transport: socket.io.engine.transport.name
    });
  });

  // Log all events
  const originalEmit = socket.emit;
  socket.emit = function(event: string, ...args: any[]) {
    console.log('%c[Socket] Emit', 'color: orange', event, args);
    return originalEmit.apply(socket, [event, ...args]);
  };
};
