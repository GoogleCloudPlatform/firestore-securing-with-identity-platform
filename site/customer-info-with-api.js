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
  const authHelper = new IdentityPlatformAuthHelper(config.apiKey, window.location.href.replace(window.location.pathname,''));

  $('#sign-in').click((event) => {
    //authHelper.signInWithPopup('google.com');
    authHelper.signInWithRedirect('google.com');
  });

  authHelper.onSignedIn(function(user) {
    showSignOut();
    $('#email').val(user.email);
  });

  $('#query-info').click(function(event) {
    showCustomerInformation($('#email').val());
  });

  $('#sign-out').click(function(event) {
    authHelper.signOut();
    $('#email').val('');
    showSignIn();
  });

  function showSignIn() {
    $('#logged-in').hide();
    $('#logged-out').show();
    $('#customer-information').hide();
  }

  function showSignOut() {
    $('#logged-in').show();
    $('#logged-out').hide();
  }

  // [START securing_cloud_firestore_with_identity_platform_firestore_rest_api]
  function showCustomerInformation(userEmail) {
    $('#customer-information').show();
    $('#output').empty();

    const idTokenPromise = authHelper.getIdToken();
    const firestoreEndpoint = 'https://firestore.googleapis.com/v1';
    const defaultDbPath = `projects/${config.projectId}/databases/(default)/documents`;
    const collectionId = 'customers';

    // Call Firestore via its REST API and authenticate with the user's ID token
    idTokenPromise
    .then(idToken => {
      console.log(`JWT Token: ${idToken}`);
      return fetch(
        `${firestoreEndpoint}/${defaultDbPath}/${collectionId}/${userEmail}`,
        {
          headers: {
            'Authorization': 'Bearer ' + idToken
          },
          contentType: 'application/json',
          method: 'GET'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
          throw data.error.message;
        }
        var fields = data.fields;
        $('#output').append($('<p>').text(`Id: ${userEmail}`));
        $('#output').append($('<p>').text(`Name: ${fields.name.stringValue}`));
        $('#output').append($('<p>').text(`Company: ${fields.company.stringValue}`));
        $('#output').append($('<p>').text(`Doc path: ${data.name}`));
        $('#output').append($('<p>').text(`Doc URL: ${firestoreEndpoint}/${data.name}`));
    })
    .catch(error => {
      console.error(error);
      $('#output').text("Error: " + JSON.stringify(error));
    });
  }
  // [END securing_cloud_firestore_with_identity_platform_firestore_rest_api]

  authHelper.init();
  showSignIn();
})();
