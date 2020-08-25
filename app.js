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

const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const port = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.raw({ type: 'application/x-www-form-urlencoded'}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/site/index.html'));
});

// For GET requests, usually in response to an OAuth/OIDC sign-in
app.get('/auth-handler', (req, res) => {
  res.render('auth-handler', { post_body: ''});
});

// For POST requests, usually in response to a SAML sign-in
app.post('/auth-handler', (req, res) => {
  res.render('auth-handler', { post_body: req.body});
});

app.use(express.static(__dirname + '/site'));

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);
