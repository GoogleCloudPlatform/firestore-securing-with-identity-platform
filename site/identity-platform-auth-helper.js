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

function IdentityPlatformAuthHelper(apiKey, baseUrl) {
  this.user = null;
  this.authHandlerUrl = baseUrl + this.authHandlerPath;
  this.signedInHandler = function() {};
}

IdentityPlatformAuthHelper.prototype.identityPlatformBaseUrl = 'https://identitytoolkit.googleapis.com/v1';
IdentityPlatformAuthHelper.prototype.authHandlerPath = '/auth-handler';

IdentityPlatformAuthHelper.prototype.init = function() {
  // Set up for popup notifications
  $(window).on('message', (event) => {
    if (event.originalEvent.origin == window.location.origin) {
      var data = event.originalEvent.data;
      this.signInWithIdp(data);
    }
  });

  // Set up for redirect (relevant if already been redirected back)
  var data = localStorage.getItem('authResponse');
  if (data)
  {
    localStorage.removeItem('authResponse');
    this.signInWithIdp(data);
  }
}

IdentityPlatformAuthHelper.prototype.signInWithPopup = function(providerId, tenantId) {
  // Get URL of IdP, and open it in a popup
  this.createAuthUri(providerId, tenantId)
  .then(authUriResponse => {
    this.storeAuthState(providerId, tenantId, authUriResponse.sessionId);
    const popup = window.open(authUriResponse.authUri);
    if(popup !== null && !popup.closed)
      popup.focus();
  });
}

IdentityPlatformAuthHelper.prototype.signInWithRedirect = function(providerId, tenantId) {
  // Get URL of IdP, and redirect the browser to it
  this.createAuthUri(providerId, tenantId)
    .then(authUriResponse => {
      this.storeAuthState(providerId, tenantId, authUriResponse.sessionId);
      localStorage.setItem('onSuccessfulAuthRedirect', window.location.href);
      window.location.href = authUriResponse.authUri;
    });
}

IdentityPlatformAuthHelper.prototype.storeAuthState = function(providerId, tenantId, sessionId) {
  localStorage.setItem('signInWithIdpParams', JSON.stringify({
    'providerId' : providerId,
    'tenantId' : tenantId,
    'sessionId' : sessionId,
    'authHandlerUrl' : this.authHandlerUrl
  }));
}

IdentityPlatformAuthHelper.prototype.getAuthState = function() {
  const authState = JSON.parse(localStorage.getItem('signInWithIdpParams'));
  localStorage.removeItem('signInWithIdpParams');
  return authState;
}

// [START securing_cloud_firestore_with_identity_platform_create_auth_uri]
IdentityPlatformAuthHelper.prototype.createAuthUri = function(providerId, tenantId) {
  // https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/createAuthUri
  const createAuthUriUrl = `${this.identityPlatformBaseUrl}/accounts:createAuthUri?key=${config.apiKey}`;
  const request = {
    'providerId' : providerId,
    'tenantId' : tenantId,
    'continueUri' : this.authHandlerUrl,
  };

  return fetch(
      createAuthUriUrl,
      {
        contentType: 'application/json',
        method: 'POST',
        body: JSON.stringify(request)
      }
    )
  .then(response => response.json())
  .then(data => {
    return {
      "authUri" : data.authUri,
      "sessionId" : data.sessionId
    };
  })
  .catch(error => {
    console.error(error);
  });
};
// [END securing_cloud_firestore_with_identity_platform_create_auth_uri]

IdentityPlatformAuthHelper.prototype.signOut = function() {
  this.user = null;
}

// [START securing_cloud_firestore_with_identity_platform_sign_in_with_idp]
IdentityPlatformAuthHelper.prototype.signInWithIdp = function(data) {
  authState = this.getAuthState();
  this.authHandlerUrl = authState.authHandlerUrl;

  // https://cloud.google.com/identity-platform/docs/reference/rest/v1/accounts/signInWithIdp
  const signInWithIdpUrl = `${this.identityPlatformBaseUrl}/accounts:signInWithIdp?key=${config.apiKey}`;

  const request = {
      'requestUri' : this.authHandlerUrl,
      'sessionId' : authState.sessionId,
      'returnRefreshToken' : true,
      'returnSecureToken' : true,
      'tenantId' : authState.tenantId
    };

  if (authState.providerId == 'google.com' || authState.providerId.startsWith('saml.')) {
    request.postBody = `${data}&providerId=${authState.providerId}`;
  } else {
    throw new Error('This sample script only supports the google.com and SAML providers for Identity Platform');
  }

  fetch(
      signInWithIdpUrl,
      {
        contentType: 'application/json',
        method: 'POST',
        body: JSON.stringify(request)
      }
    )
  .then(response => response.json())
  .then(data => {
    this.user = data;
    this.signedInHandler(this.user);
  })
  .catch(error => {
    console.error(error);
  });
}
// [END securing_cloud_firestore_with_identity_platform_sign_in_with_idp]

IdentityPlatformAuthHelper.prototype.isSignedIn = function() {
    return (this.user && this.user.idToken);
}

// [START securing_cloud_firestore_with_identity_platform_get_id_token]
IdentityPlatformAuthHelper.prototype.getIdToken = function() {
  const token = this.jwtDecode(this.user.idToken);

  // If exp has passed, refresh the token
  if (Date.now() > token.payload.exp * 1000) {
    return this.refreshToken(this.user.refreshToken);
  }
  return Promise.resolve(this.user.idToken);
}

IdentityPlatformAuthHelper.prototype.jwtDecode = function(t) {
  const token = {};
  token.raw = t;
  token.header = JSON.parse(window.atob(t.split('.')[0]));
  token.payload = JSON.parse(window.atob(t.split('.')[1]));
  return token;
}

IdentityPlatformAuthHelper.prototype.refreshToken = function(refreshToken) {
  // https://cloud.google.com/identity-platform/docs/reference/rest/client#section-refresh-token
  const tokenUrl = `https://securetoken.googleapis.com/v1/token?key=${config.apiKey}`;
  const requestBody = new URLSearchParams(`grant_type=refresh_token&refresh_token=${refreshToken}`);

  return fetch(
      tokenUrl,
      {
        contentType: 'application/x-www-form-urlencoded',
        method: 'POST',
        body: requestBody
      }
    )
  .then(response => response.json())
  .then(data => {
    this.user.idToken = data.id_token;
    this.user.refreshToken = data.refresh_token;
    return this.user.idToken;
  })
  .catch(error => {
    console.error(error);
  });
}
// [END securing_cloud_firestore_with_identity_platform_get_id_token]

IdentityPlatformAuthHelper.prototype.onSignedIn = function(handler) {
    this.signedInHandler = handler;
};
