/* MusicApp light — copie de l'appli sur l'appareil, pour jouer sans réseau.
   La page est servie depuis la copie ; une version plus récente, s'il y en a une, est téléchargée en coulisse et servie
   au lancement SUIVANT : jamais de changement au milieu d'un morceau. */
const VERSION = '1.0.0';
const CACHE = 'musicapp-light-' + VERSION;
const FILES = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.indexOf('musicapp-light-') === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL('./', self.location).pathname;
  if (url.pathname.indexOf(scope) !== 0) return;                 // hors de son dossier : jamais touché (la version complète, d'autres pages)
  const key = req.mode === 'navigate' ? './' : req.url;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(key).then((hit) => {
    const fresh = fetch(req).then((res) => {
      if (res && res.ok && !res.redirected) cache.put(key, res.clone());
      return res;
    });
    if (hit){ event.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  })));
});
