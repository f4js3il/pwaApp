var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    // .register("/sw.js")
    .register("/service-worker.js")
    .then(function () {
      console.log("Service worker registered!");
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    var options = {
      body: "You have successfully subscribed to notifications",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US",
      vibrate: [100,50,200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions:[
        {action:'confirm', title:'Okay', icon:'/src/images/icons/app-icon-96x96.png'},
        {action:'cancel', title:'Cancel', icon:'/src/images/icons/app-icon-96x96.png'}
      ]
    };
    navigator.serviceWorker.ready.then((swreg) => {
      swreg.showNotification("Subscription Successful", options);
    });
  }
}

function confirmPushSub(){
  if(!('serviceWorker' in navigator)){
    return;
  }
  var reg;
    navigator.serviceWorker.ready.then((swreg) =>
      {
        reg = swreg;
        return swreg.pushManager.getSubscription();
      }
    ).then((sub)=>{
      if (sub === null){
        var vapidPublicKey = 'BKCQR3mW8yDBMl7EmojGtODWtYAmB1CPthKvv7p4K6xZr8YGWHQXagWVFk3gV_axsrpqKLzDz_2F9HWdluLUXMw';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
       return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        })
      }else{
        
      }
    }).then((newSub)=>{
     return fetch('https://pwagramdb-default-rtdb.firebaseio.com/subscriptions.json',{
        method: 'POST',
        headers:{
          'Content-Type':'application/json',
          'Accept':'application/json'
        },
        body:JSON.stringify(newSub)
      })
    }).then((res)=>{
      if(res.ok){
        displayConfirmNotification();
      }
    }).catch((err)=> {console.log('something wrong with subscription')});
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    console.log("User Choice", result);
    if (result !== "granted") {
      console.log("Notification not granted");
    } else {
      confirmPushSub();
     // displayConfirmNotification();
    }
  });
}

if ("Notification" in window) {
  enableNotificationsButtons.forEach((element) => {
    element.style.display = "inline-block";
    element.addEventListener("click", askForNotificationPermission);
  });
}
