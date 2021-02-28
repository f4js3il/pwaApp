var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webPush = require("web-push");
var formidable = require("formidable");
var fs = require("fs");
var UUID = require("uuid-v4");

var serviceAccount = require("./pwagram-fb-key.json");
var gcConfig = {
  projectId: "pwagramdb",
  keyFileName: "pwagram-fb-key.json",
};

var gcs = require("@google-cloud/storage")(config);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

admin.initializeApp({
  credential: "blah",
  databaseURL: "https://pwagramdb-default-rtdb.firebaseio.com/",
});
exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    var uuid = UUID();
    var formData = new formidable.IncomingForm();
    formData.parse(request, (err, fields, files) => {
      fs.rename(files.file.path, "/tmp/" + files.file.name);
      var bucket = gcs.bucket("pwagramdb.appspot.com");
      bucket.upload(
        "/tmp/" + files.file.name,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: files.file.type,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        },
        (error, file) => {
          if (!error) {
            admin.database
              .ref("posts")
              .push({
                id: request.body.id,
                title: request.body.title,
                location: request.body.location,
                image: request.body.image,
              })
              .then(() => {
                webPush.setVapidDetails(
                  "mailto:shaluchandran@gmail.com",
                  "BKCQR3mW8yDBMl7EmojGtODWtYAmB1CPthKvv7p4K6xZr8YGWHQXagWVFk3gV_axsrpqKLzDz_2F9HWdluLUXMw",
                  "yqdXfobC6B1My2Bcjptm0DiksxN4rkAVtIebTTjtzEk"
                );
                return admin.database().ref("subscriptions").once("value");
              })
              .then((subscriptions) => {
                subscriptions.forEach((sub) => {
                  var pushConfig = {
                    endPoint: sub.val().endPoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh,
                    },
                  };
                  webPush
                    .sendNotification(
                      pushConfig,
                      JSON.stringify({
                        title: "NewPost",
                        content: "New Post added",
                      })
                    )
                    .catch((err) => {
                      console.log(err);
                    });
                });
                response
                  .status(201)
                  .json({ message: "Data Stored", id: request.body.id });
              })
              .catch((err) => {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(error);
          }
        }
      );
    });
  });
});
