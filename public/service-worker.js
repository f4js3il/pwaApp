importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

workbox.routing.registerRoute(/.*(?:googleapis|gstatic)\.com.*$/,
new workbox.strategies.NetworkFirst({
    'cacheName':'google-fonts',
    'cacheExpiration':{
        'maxEntries':3,
        'maxAgeSeconds': 60*60*24*30
    }
}));

workbox.routing.registerRoute('https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
new workbox.strategies.NetworkFirst({
    'cacheName':'material-css'
}));

workbox.routing.registerRoute(/.*(?:firebasestorage\.googleapis)\.com.*$/,
new workbox.strategies.NetworkFirst({
    'cacheName':'post-images'
}));

workbox.routing.registerRoute('https://pwagramdb-default-rtdb.firebaseio.com/posts.json',
(args)=>{
    return  fetch(args.event.request).then(function (res) {
        var clonedRes = res.clone();
        clearAllData("posts")
          .then(() => clonedRes.json())
          .then(function (data) {
            for (var key in data) {
              writeData("posts", data[key]);
            }
          });
        return res;
      })
});

workbox.routing.registerRoute(routeData=>{ 
    return routeData.event.request.headers.get('accept').includes('text/html')
},
(args)=>{
    return   caches.match(args.event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(args.event.request)
            .then(function (res) {
              return caches.open('dynamic')
              .then(function (cache) {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(args.event.request.url, res.clone());
                return res;
              })
           ;
            })
            .catch(function (err) {
                return cache.match("/offline.html").then(
                    res=>{
                        return res;
                    }
                )
          })
 
        }
      })
});

workbox.precaching.precacheAndRoute([{"revision":"0a27a4163254fc8fce870c8cc3a3f94f","url":"404.html"},{"revision":"2cab47d9e04d664d93c8d91aec59e812","url":"favicon.ico"},{"revision":"fd48136656e4e3192e3a1e6214e6a965","url":"index.html"},{"revision":"d11c7965f5cfba711c8e74afa6c703d7","url":"manifest.json"},{"revision":"45352e71a80a5c75d25e226e7330871b","url":"offline.html"},{"revision":"6d09f74487baae2843eb6b8983064f6f","url":"src/css/app.css"},{"revision":"14e124dbca47102fd9161675ed8c2683","url":"src/css/feed.css"},{"revision":"1c6d81b27c9d423bece9869b07a7bd73","url":"src/css/help.css"},{"revision":"c32341addcc84547e558021ad5187dbb","url":"src/js/app.js"},{"revision":"e6301eac38da1b0f42880789e5a3914f","url":"src/js/feed.js"},{"revision":"6b82fbb55ae19be4935964ae8c338e92","url":"src/js/fetch.js"},{"revision":"017ced36d82bea1e08b08393361e354d","url":"src/js/idb.js"},{"revision":"713af0c6ce93dbbce2f00bf0a98d0541","url":"src/js/material.min.js"},{"revision":"10c2238dcd105eb23f703ee53067417f","url":"src/js/promise.js"},{"revision":"650fa16f6dbce11a11c05c0415d2e582","url":"src/js/utility.js"},{"revision":"1579769b4fb0a55f556d0c0cfd317e5d","url":"sw.js"},{"revision":"20fea39f1c9f026a03059dcac109ca6a","url":"workbox-9084fbb7.js"},{"revision":"31b19bffae4ea13ca0f2178ddb639403","url":"src/images/main-image-lg.jpg"},{"revision":"c6bb733c2f39c60e3c139f814d2d14bb","url":"src/images/main-image-sm.jpg"},{"revision":"5c66d091b0dc200e8e89e56c589821fb","url":"src/images/main-image.jpg"},{"revision":"0f282d64b0fb306daf12050e812d6a19","url":"src/images/sf-boat.jpg"}]);

var url = 'https://pwagramdb-default-rtdb.firebaseio.com/posts.json';
self.addEventListener("sync", (event) => {
  console.log("Service worker background synching", event);
  if (event.tag === "sync-new-post") {
    console.log("Service Worker synching new posts");
    event.waitUntil(
      readAllData("sync-posts").then((data) => {
        for (var dt of data) {
          var postData = new FormData();
          postData.append('id',dt.id);
          postData.append('title',dt.title);
          postData.append('location', dt.location);
          postData.append('rawLocationLat', dt.rawLocation.lat);
          postData.append('rawLocationLng', dt.rawLocation.lon);
          postData.append('file', dt.picture, dt.id+'.png')
          fetch(url,{
            method: "POST",
            body: postData
          }) .then((res) => {
            if (res.ok) {
              deleteItemFromData("sync-posts", dt.id);
            }
          }).catch(err=>{console.log('Something went wromg while sending data')});;
        }
      })
    );
  }
});


self.addEventListener('notificationclick', event=>{
  var notification = event.notification;
  var action = event.action ;
  console.log(notification);
  if(action==='confirm'){
    console.log(action);
    notification.close();
  }else{
    console.log('confirm was chosen');
    event.waitUntil(
      clients.matchAll().then(cl=>{
        var client = cl.find(c=> c.visibilityState === 'visible');
        if(client !== undefined){
          client.navigate('http://localhost:8081');
          client.focus();
        }else{
          client.openWindow('http://localhost:8081');
        }
      })
    )
    notification.close();
  }
})

self.addEventListener('notificationclose', event=>{
  console.log('Notification was closed',event);
})

self.addEventListener('push', event=>{
  console.log('Push Notification Received', event);
  var data = {title:'New',Content:'Something new happened'};
  if(event.data){
    data = JSON.parse(event.data.text())
  };
  var options = {
    body:data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title,options)
  )
})
