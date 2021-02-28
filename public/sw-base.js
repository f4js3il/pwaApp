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

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

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
