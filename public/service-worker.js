var CACHE_NAME = "yt-appshell-cache-v01";
var URLS_TO_CACHE = [
    "/",
    "/css/styles.css",
    "/app.js"
];

// install event

  self.addEventListener('install', e => {
      e.waitUntil(
          caches.open(CACHE_NAME)
                  .then(cache => {
                      return cache.addAll(urlsToCache)
                                  .then(() =>{
                                      self.skipWaiting();
                                  });

                  })
                  .catch(err => {
                      console.log('Cache check', err);
                  })
      );
  });

  // activate event

  self.addEventListener('activate', e => {
      const cacheWhiteList = [CACHE_NAME];

      e.waitUntil(
          caches.keys()
                  .then(cacheNames => {
                      return Promise.all(
                          cacheNames.map(cacheName => {

                              if(cacheWhiteList.indexOf(cacheName) === -1){
                                  // Borrar elementos que no se necesitan
                                  return caches.delete(cacheName);

                              }
                          })

                      );
                  })
                  .then(() => {
                      //Activar cache
                      self.clients.claim();
                  })

      );
  });


  // fetch event

  self.addEventListener('fetch', function(event) {
      event.respondWith(
        caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
        })
      );
    });
