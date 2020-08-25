/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function () {
  configureFirebaseApp();

  // [START securing_cloud_firestore_with_identity_platform_firebase_auth_setup]
  $('#sign-in').click((event) => {
    provider = new firebase.auth.GoogleAuthProvider();
    //firebase.auth().signInWithPopup(provider)
    firebase.auth().signInWithRedirect(provider)
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
    });
  });

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      $('#logged-out').hide();
      /* If the provider gives a display name, use the name for the
      personal welcome message. Otherwise, use the user's email. */
      const welcomeName = user.displayName ? user.displayName : user.email;
      console.log(firebase.auth().currentUser);
      $('#user').text(welcomeName);
      $('#logged-in').show();
      $('#email').val(firebase.auth().currentUser.email);
    } else {
      $('#logged-in').hide();
      $('#logged-out').show();
      $('#email').val('');
    }
    $('#customer-information').hide();
  });

  $('#sign-out').click(function(event) {
    firebase.auth().signOut().then(function() {
      console.log('Sign out successful');
    }, function(error) {
      console.error(error);
    });
  });
  // [END securing_cloud_firestore_with_identity_platform_firebase_auth_setup]

  $('#query-info').click(function(event) {
    showCustomerInformation($('#email').val());
  });

  // [START securing_cloud_firestore_with_identity_platform_firestore_with_sdk]
  function showCustomerInformation(userEmail) {
    $('#customer-information').show();
    $('#output').empty();

    const db = firebase.firestore();
    const collectionId = 'customers';

    query = db.collection(collectionId).doc(userEmail).get();
    query.then((doc) => {
      var fields = doc.data();
      $('#output').append($('<p>').text(`Id: ${doc.id}`));
      $('#output').append($('<p>').text(`Name: ${fields.name}`));
      $('#output').append($('<p>').text(`Company: ${fields.company}`));
    }).catch((error) => {
      console.error(error);
      $('#output').text("Error: " + error.toString());
    });
  }
  // [END securing_cloud_firestore_with_identity_platform_firestore_with_sdk]
})();
