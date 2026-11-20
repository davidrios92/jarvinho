// Service worker mínimo de Jarvinho.
// Hace la app instalable. No cachea nada todavía: todas las peticiones van a la red,
// así nunca se sirve una respuesta vieja de /api ni de páginas autenticadas.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Passthrough: el navegador resuelve la petición normalmente.
});
