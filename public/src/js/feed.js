var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var locationBtn = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var picture;
var fetchedLocation;

locationBtn.addEventListener('click',event=>{
  if(!('geolocation' in navigator)){
    return;
  }
  locationBtn.style.display='none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition((position)=>{
    locationBtn.style.display='inline';
    locationLoader.style.display = 'none';
    fetchedLocation ={lat: position.coords.latitude, lon: position.coords.longitude};
    locationInput.value ='In Minnesota';
    locationInput.classList.add('is-focused');
  }, (err)=>{
    locationBtn.style.display='inline';
    locationLoader.style.display = 'none';
    fetchedLocation = null;
    alert('Please enter location  manually');
    console.log(err);
  },{timeout: 7000})

})

function initializeLocation(){
if(!('geolocation' in navigator)){
  locationBtn.style.display = none;
}
}

function initializeMedia(){
  if(!('mediaDevices' in navigator)){
    navigator.mediaDevices = {};
  }
  if(!('getUserMedia' in navigator.mediaDevices)){
    navigator.mediaDevices.getUserMedia = function (constraints){
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if(!getUserMedia){
        return Promise.reject(new  Error('GetUserMedia not implemented'));
      }
      return new Promise((resolve,reject)=>{
        getUserMedia.call(navigator,constraints,resolve,reject);
      })
    }
  }

  navigator.mediaDevices.getUserMedia({video:true}).then(stream=>{
    videoPlayer.srcObject = stream;
    videoPlayer.style.display = 'block';
  }).catch(err=>{
    imagePickerArea.style.display = 'block';
  })
}

captureButton.addEventListener('click', (event)=>{
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer,0,0,canvas.width,videoPlayer.videoHeight/(videoPlayer.videoWidth/canvas.width))
  videoPlayer.srcObject.getVideoTracks().forEach(track=>{
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
})

imagePicker.addEventListener('change', event=>{
  picture = event.target.files[0];
})

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  initializeMedia();
  initializeLocation();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  if(videoPlayer.srcObject){
    videoPlayer.srcObject.getVideoTracks().forEach(track=>{
      track.stop();
    })
  }
}

function clearCards(){
  while(sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }

  
}

// function onSaveButtonClicked(event){
//   console.log('clicked');
//   if('caches' in window){
//     caches.open('user-requested')
//     .then( cache =>{
//       cache.addAll(['https://httpbin.org/get','/src/images/sf-boat.jpg'])
//     }
//     )
//   }
// }

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url('+data.image+')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.trip;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
 // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent='Save';
  // cardSaveButton.addEventListener('click',onSaveButtonClicked)
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  for ( var i = 0; i<data.length; i++){
      createCard(data[i])
  }
}

var url = 'https://pwagramdb-default-rtdb.firebaseio.com/posts.json';
var networkReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkReceived = true;
    console.log('data from network')
    var dataArray=[];
    for (var key in data){
      dataArray.push(data[key])
    }
    clearCards();
    updateUI(dataArray) ;
  });
  
  if('indexedDB' in window){
    readAllData('posts').then(data=>{
     // if (!networkReceived){
        console.log('from Cache');
        clearCards();
       updateUI(data) ;
     // }
    })
  }

 function sendData(data){
  var postData = new FormData();
  var id = new Date.toISOString();
  postData.append('id',id);
  postData.append('title',titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('file', picture, id+'.png');
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lon);
 fetch(url,{
    method: "POST",
    body: postData
  }).then( res => {
    console.log('sent Data', res);
    updateUI();
  }).catch(err=>{console.log('Something went wromg while sending data')});
  }

form.addEventListener('submit',event=>{
  event.preventDefault();
  if(titleInput.value === '' || locationInput.value === ''){
    alert('Please enter valid data');
    return;
  }
  closeCreatePostModal();
  var post ={
    id: new Date().toISOString(),
    title: titleInput.value,
    location : locationInput.value,
    picture:picture,
    rawLocation:fetchedLocation
  }
  if('serviceWorker' in navigator && 'SyncManager' in window){
    navigator.serviceWorker.ready.then(
      sw=>{
        writeData('sync-posts', post).then( () =>{
         return sw.sync.register('sync-new-post');
        }).then( ()=>{
          var snackbarContainer = document.querySelector('#confirmation-toast');
          var data = {message:'Your message is saved for synching'};
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        }).catch(err=> console.log(err)
        );
      }
    )
  }else{
    sendData(post);
  }

})