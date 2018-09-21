// This file contains the boilerplate to execute your React app.
// If you want to modify your application's content, start in "index.js"

import {ReactInstance} from 'react-360-web';

// Import process.js file which contains definitions required by react-dom
// to run on the client.
import './process';
import DomOverlayModule from './domoverlay';
import { Settings } from './common';

function init(bundle, parent, options = {}) {
  // detect whether we are running on a mobile device vs desktop   
  const isMobileDevice = ('ontouchstart' in document.documentElement);
  console.log(isMobileDevice ? 'Mobile device detected' : 'Non-mobile device detected');

  // Create a div where the overlay will be displayed in the DOM.
  const domOverlayContainer = document.createElement('div');
  domOverlayContainer.id = 'dom-overlay';

  const r360 = new ReactInstance(bundle, parent, {
    // Add custom options here
    fullScreen: true,
    initialProps: { isMobileDevice: isMobileDevice },
    ...options,
    nativeModules: [
      ctx => new DomOverlayModule(ctx, domOverlayContainer),
    ],
  });

  // Inject DOM overlay container to the player so that it is rendered properly.
  r360.overlay._wrapper.appendChild(domOverlayContainer);

  //window.vr = r360;
  window.playerCamera = r360.compositor._camera;

  r360.renderToLocation(
    r360.createRoot('Exp360', { /* initial props */ }),
    r360.getDefaultLocation(),
  );

  // // Render your app content to the default cylinder surface
  // r360.renderToSurface(
    // r360.createRoot('Exp360', { /* initial props */ }),
    // r360.getDefaultSurface()
  // );

  // // Load the initial environment
  // r360.compositor.setBackground(r360.getAssetURL('360_world.jpg'));

  fbInit();
}

window.React360 = {init, handleClientLoad};

// Facebook sigin in stuff
function fbInit() {  
  window.fbAsyncInit = function() {
    FB.init({
      appId      : Settings.FBAppId,
      cookie     : true,
      xfbml      : true,
      version    : 'v2.11'
    });
      
    FB.AppEvents.logPageView();   
  
    // TODO: Implement
    // FB.Event.subscribe('auth.authResponseChange', checkLoginState);
    // checkLoginState();
  };

  (function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
  
    if (d.getElementById(id))
      return;
  
    js = d.createElement(s); 
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}

// function checkLoginState() {
  // FB.getLoginStatus(response => {
    // updateSigninStatus('facebook.com', response.status === 'connected');
  // });
// }

function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  // Initialize the client with API key and People API, and initialize OAuth with an
  // OAuth 2.0 client ID and scopes (space delimited string) to request access.
  gapi.client.init({
    apiKey: Settings.GoogleApiKey,
    discoveryDocs: ["https://people.googleapis.com/$discovery/rest?version=v1"],
    clientId: Settings.GoogleClientId,
    scope: 'profile'
  }).then(function () {
    // TODO: Implement
    // Listen for sign-in state changes.
    // gapi.auth2.getAuthInstance().isSignedIn.listen(isSignedIn => { updateSigninStatus('google.com', isSignedIn); });

    // Handle the initial sign-in state.
    // updateSigninStatus('google.com', gapi.auth2.getAuthInstance().isSignedIn.get());
  });
}

// When signin status changes for any provider we use, this function is called.
function updateSigninStatus(providerId, isSignedIn) {
  // console.log(providerId + ': ' + isSignedIn);
  
  // TODO: implement
  // if (isSignedIn) {
  // } else {
  // }
}
