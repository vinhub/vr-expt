import React from 'react';
import ReactDOM from 'react-dom';
import {Module} from 'react-360-web';
import * as THREE from 'three';
import Cookies from 'universal-cookie';
const cookies = new Cookies();

import { assert,Settings } from './common';
import HomeUIOverlay from './homeuioverlay';
import GameUIOverlay from './gameuioverlay';

export default class DomOverlayModule extends Module {
  constructor(ctx, overlayContainer) {
    super('DomOverlayModule');

    console.log(__DEV__ ? 'Dev environment detected' : 'Prod environment detected');

    this._ctx = ctx;

    this._overlayContainer = overlayContainer;
    this._isOpen = false;
    this._isShowingProfilePane = false;
    this._boundOnRendererClick = this.onRendererClick.bind(this);
    this._boundOnRendererDoubleClick = this.onRendererDoubleClick.bind(this);
    this._boundOnRendererKeyDown = this.onRendererKeyDown.bind(this);

    // handle double click for editing purposes
    // TODO: only while editing
    window.addEventListener('dblclick', this._boundOnRendererDoubleClick);
  }

  // This method call opens up the overlay for display.
  openOverlay(overlayType, scene, userMode, showingGameOver, userInfo, isSignedIn, showMenu) {
    if (this._isOpen) {
      this.closeOverlay();
    }
      
    ReactDOM.render(
      (overlayType === 'home') ? (
        <HomeUIOverlay userMode={ userMode } userInfo={ userInfo } isSignedIn={ isSignedIn }
          showMenu={ showMenu }
          onMenuClick={ (e) => this.onMenuClick.bind(this)(e, userMode, userInfo, isSignedIn) }
          loginUser={ (providerId) => this.loginUser.bind(this)(providerId) }
          logoutUser={ this.logoutUser.bind(this) }
          onSetUserMode={ (userMode) => this.onSetUserMode.bind(this)(userMode) }
          onNewSceneClick={ this.onNewSceneClick.bind(this) }
          onClose={ this.closeOverlay.bind(this) } />
        ) : (
        <GameUIOverlay overlayType={ overlayType } userMode={ userMode } showingGameOver={ showingGameOver } 
          userInfo={ userInfo } isSignedIn={ isSignedIn } prevScene={ scene ? scene.prevScene : null } nextScene={ scene ? scene.nextScene : null }
          onViewResultsClick={ this.onViewResultsClick.bind(this) }
          onHomeClick={ this.onHomeClick.bind(this) }
          onPrevClick={ this.onPrevClick.bind(this) }
          onNextClick={ this.onNextClick.bind(this) }
          onClose={ this.closeOverlay.bind(this) } />
        ),
      this._overlayContainer
    );

    this._isOpen = true;
    this._isShowingProfilePane = showMenu;
    this._userMode = userMode;
    this._userInfo = userInfo;
    this._isSignedIn = isSignedIn;
    
    if (showMenu) {
      // handle click / tap for closing the menu
      window.addEventListener('click', this._boundOnRendererClick, false);
      window.addEventListener('touchstart', this._boundOnRendererClick, false);
    }
  }

  closeOverlay() {
    ReactDOM.unmountComponentAtNode(this._overlayContainer);
    this._isOpen = false;
    this._isShowingProfilePane = false;
    window.removeEventListener('click', this._boundOnRendererClick);
    window.removeEventListener('touchstart', this._boundOnRendererClick);
  }

  // Class methods can be called from the React side
  
  // setting up callback methods from Exp360 and GameUI
  setRNCallbackGameUI(rncb) {
    this._rncbGameUI = rncb;
  }
  
  setRNCallbackMain(rncb) {
    this._rncbMain = rncb;
  }
  
  getCookie(name1, name2, cb) {
    const value1 = cookies.get(name1);
    const value2 = name2 ? cookies.get(name2) : null;
    if (this._ctx) {
      this._ctx.invokeCallback(cb, [value1, value2]);
    }
  }
  
  setCookie(name1, value1, name2, value2, options) {
    cookies.set(name1, value1, options);
    if (name2)
      cookies.set(name2, value2, options);
  }

  removeCookie(name1, name2, options) {
    cookies.remove(name1, options);
    if (name2)
      cookies.remove(name2, options);
  }
  
  onMenuClick(e, userMode, userInfo, isSignedIn) {
    this.openOverlay('home', null, userMode, false, userInfo, isSignedIn, !this._isShowingProfilePane);
    e.stopPropagation();
  }

  // login using the given provider and get access token  
  loginUser(providerId) {
    if (providerId === 'facebook.com') {
      FB.login(loginResponse => {
        const meResponse = {
          providerId: providerId,
          accessToken: loginResponse.authResponse.accessToken,
        };
        this.notifyWorkerMain('userInfoResponse', meResponse);
      }, {scope: 'public_profile,email'});
    } else if (providerId === 'google.com') {
      Promise.resolve(gapi.auth2.getAuthInstance().signIn()).then(loginResponse => {
        const meResponse = { 
          providerId: providerId,
          accessToken: loginResponse.Zi.access_token,            
        };
        this.notifyWorkerMain('userInfoResponse', meResponse);
      });
    }
  }
  
  logoutUser() {
    this.notifyWorkerMain('logoutUser');
  }
  
  onSetUserMode(userMode) {
    this.notifyWorkerMain('setUserMode', { userMode: userMode });
  }
  
  setSceneTitle(title, actionUrl) {
    document.getElementById('sceneTitle').innerText = title;
    document.getElementById('actionButton').href = actionUrl;
  }

  setGameState(score, maxScore, timeRemaining) {
    const userScoreElement = document.getElementById("userScore");
    
    if (userScoreElement) {
      // update score and time display
      userScoreElement.innerText = 'Score: ' + score + ' / ' + maxScore;
      document.getElementById('gameOverScore').innerText = 'Your score: ' + score + ' / ' + maxScore;
      if (timeRemaining < 0.001) // negative timeRemaining indicates user had already completed this quiz
        document.getElementById('timeRemaining').innerText = 'Status: Completed';
      else
        document.getElementById('timeRemaining').innerText = 'Time: ' + timeRemaining + ' s.';
    }
  }

  showGameOver() {
    document.getElementById('gameOverPopup').style.display = 'block';
  }
  
  hideGameOver() {
    document.getElementById('gameOverPopup').style.display = 'none';
  }
  
  // TODO: implement using proper popup form
  editLocInfo(locInfo) {
    switch (locInfo.type) {
      case 'mcq':
        const promptNew = window.prompt('Quiz prompt:', locInfo.prompt);
        if (promptNew)
          locInfo.prompt = promptNew;
      
        const infoNew = window.prompt('Quiz answer info:', locInfo.info);
        if (infoNew)
          locInfo.info = infoNew;
      
        let optionText = window.prompt('Correct option:', locInfo.options[0].text);
        if (optionText)
          locInfo.options[0].text = optionText;
      
        optionText = window.prompt('Incorrect option 1:', locInfo.options[1].text);
        if (optionText)
          locInfo.options[1].text = optionText;
      
        optionText = window.prompt('Incorrect option 2:', locInfo.options[2].text);
        if (optionText)
          locInfo.options[2].text = optionText;
      
        optionText = window.prompt('Incorrect option: 3', locInfo.options[3].text);
        if (optionText)
          locInfo.options[3].text = optionText;
        break;
        
      case 'info':
        // TODO: select info or nextScene
        const name = window.prompt('Location name:', locInfo.name);
        if (name)
          locInfo.name = name;
        const infoNew2 = window.prompt('Location info:', locInfo.info);
        if (infoNew2)
          locInfo.info = infoNew2;
        break;
        
      case 'nextScene':
        const nextSceneNew = window.prompt('Key of next scene:', locInfo.nextScene);
        if (nextSceneNew)
          locInfo.nextScene = nextSceneNew;
        break;
        
      case 'hidden':
      case 'collectible':
        break;

      default:
        assert(false, 'Unknown LocInfo type: ' + locInfo.type + '.');
        break;        
    }
  
    this.notifyWorkerGameUI('editLocInfo', locInfo);
  }
  
  notifyWorkerMain(message_id, message) {
    if (this._rncbMain)
      this._ctx.invokeCallback(this._rncbMain, [message_id, message]);  
  }
  
  notifyWorkerGameUI(message_id, message) {
    if (this._rncbGameUI)
      this._ctx.invokeCallback(this._rncbGameUI, [message_id, message]);  
  }
  
  onRendererClick(e) {
    if (!this._isOpen || !this._isShowingProfilePane)
      return;

    if (e instanceof MouseEvent) {
      if (this.isInsideElement(e.clientX, e.clientY, document.getElementById('menuPane')))
        return;
    } else if (e instanceof TouchEvent) {
      if (this.isInsideElement(e.touches[0].clientX, e.touches[0].clientY, document.getElementById('menuPane')))
        return;
    } else
      return;
    
    this.openOverlay('home', null, this._userMode, false, this._userInfo, this._isSignedIn, false);
    window.removeEventListener('click', this._boundOnRendererClick);
    window.removeEventListener('touchstart', this._boundOnRendererClick);
  }
  
  isInsideElement(x, y, el) {
    var rect = el.getBoundingClientRect();
    return (x >= rect.left && x <= rect.right &&
            y >= rect.top && y <= rect.bottom);
  }
  
  onRendererDoubleClick(e) {
    if (!this._isOpen)
      return;
    
    const x  = 2 * (window.event.x / window.innerWidth) - 1;
    const y = 1 - 2 * (window.event.y / window.innerHeight);
    const matrix = this.map2Dto3D(x, y, 0.5);

    const coordinates = { matrix: matrix };

    this.notifyWorkerGameUI('newLocInfo', coordinates);
    
    e.stopPropagation();
    e.preventDefault();
  }

  map2Dto3D(x, y, z) {
    const camera = window.playerCamera;
    
    // convert 2D mouse click event coordinates into transformation of matrix for a plane located at that position, looking back at the camera.
    // calculate 3D vector pointing to the 2D coordinates 
    const mousePosition = new THREE.Vector3(x, y, z);
    
    mousePosition.unproject(camera);

    const vec = mousePosition.sub(camera.position).normalize().multiplyScalar(4.0);

    // calculate transformation matrix for a plane located at the end of the vector, looking back at the camera
    const matrix4 = new THREE.Matrix4(); 
    matrix4.lookAt(camera.position, vec, new THREE.Vector3(0, 1, 0));
    matrix4.setPosition(vec);
    
    const matrix = Array.from(matrix4.elements); // convert from Matrix4 to javascript array containing the transformation matrix
    
    return matrix;
  }

  map3Dto2D(matrixArray) {
    let matrix4 = new THREE.Matrix4();
    matrix4 = matrix4.fromArray(matrixArray);
    
    const camera = window.playerCamera;
    
    let vec = new THREE.Vector3();
    vec.setFromMatrixPosition(matrix4);
    vec.project(camera);
    
    return vec;
  }

  captureKeys(matrixArray) {
    if (matrixArray) {
      this.movingLocInfoMatrix = matrixArray;
      window.addEventListener('keydown', this._boundOnRendererKeyDown);
    }
    else {
      window.removeEventListener('keydown', this._boundOnRendererKeyDown);
      this.movingLocInfoMatrix = null;
    }
  }
  
  onRendererKeyDown(e) {
    if (!this.movingLocInfoMatrix)
      return;
    
    const keyName = e.key;
    let cancel = false;
    
    switch (keyName) {
      case 'ArrowLeft': 
        this.movingLocInfoMatrix = this.moveMatrixXY(this.movingLocInfoMatrix, -0.01, 0); 
        break;
        
      case 'ArrowRight':
        this.movingLocInfoMatrix = this.moveMatrixXY(this.movingLocInfoMatrix, 0.01, 0); 
        break;
        
      case 'ArrowDown':
        this.movingLocInfoMatrix = this.moveMatrixXY(this.movingLocInfoMatrix, 0, -0.01); 
        break;
        
      case 'ArrowUp':
        this.movingLocInfoMatrix = this.moveMatrixXY(this.movingLocInfoMatrix, 0, 0.01); 
        break;
        
      case 'PageUp':
        this.movingLocInfoMatrix = this.moveMatrixZ(this.movingLocInfoMatrix, 0.1); 
        break;
        
      case 'PageDown':
        this.movingLocInfoMatrix = this.moveMatrixZ(this.movingLocInfoMatrix, -0.1); 
        break;
        
      case 'Escape': 
        cancel = true; 
        break;
    }
    
    //console.log('After: ');
    //console.log(this.map3Dto2D(this.movingLocInfoMatrix));
    
    this.notifyWorkerGameUI('moveLocInfo', { matrixArray: this.movingLocInfoMatrix, cancel: cancel});
  }
  
  moveMatrixXY(matrixArray, dx, dy) {
    const vec = this.map3Dto2D(matrixArray);
    
    //console.log('Before: ');
    //console.log(vec);
    
    vec.x += dx;
    vec.y += dy;
    
    return this.map2Dto3D(vec.x, vec.y, vec.z);
  }
  
  moveMatrixZ(matrixArray, dz) {
    return matrixArray;
    
    // TODO: implement
    // let translationMatrix = new THREE.Matrix4();
    // translationMatrix = translationMatrix.makeTranslation(0, 0, dz);
    
    // let matrix4 = new THREE.Matrix4();
    // matrix4 = matrix4.fromArray(matrixArray);
    // matrix4 = matrix4.multiply(translationMatrix);

    // return Array.from(matrix4.elements);
  }
  
  onViewResultsClick() {
    this.notifyWorkerGameUI('viewResults');
    this.hideGameOver();
  }
  
  onHomeClick() {
    this.notifyWorkerGameUI('goHome');
  }

  onPrevClick() {
    this.notifyWorkerGameUI('goPrev');
  }
  
  onNextClick() {
    this.notifyWorkerGameUI('goNext');
  }
  
  onNewSceneClick() {
    // TODO: For now simply add a new scene with title same as source
    const source = window.prompt('Enter source for the new scene:', '<new scene source>');
    const type = window.prompt('Enter type of activity:', '<quiz, visit, gather, huntArtefact, or huntUnusual>');
    if (source && type) {
      this.notifyWorkerMain('newScene', { title: source, source: source, type: type });
      this.openOverlay('home', null, this._userMode, false, this._userInfo, this._isSignedIn, false);
    }
  }

  // updatePageMeta(url, title, imageUrl) {  
    // // add meta tags for sharing
    // this.insertMeta('ogTitle', 'og:title', title);
    // this.insertMeta('ogUrl', 'og:url', url);
    // this.insertMeta('ogImage', 'og:image', imageUrl);
    // this.insertMeta('ogDescription', 'og:description', 'Explorer360 from Redmond Labs - A more fun and immersive way to share your story!');
  // }

  // insertMeta(id, property, content){
    // // if it exists already, delete it
    // const el = document.getElementById(id);
    // if (el) {
      // el.parentElement.removeChild(el);
    // }
  
    // let metaNew, meta = document.getElementsByTagName('meta')[0];
  
    // metaNew = document.createElement('meta'); 
    // metaNew.id = id;
    // metaNew.setAttribute('property', property);
    // metaNew.setAttribute('content', content);
    // meta.parentNode.insertBefore(metaNew, meta);
  // }
  
  alert(message) {
    window.alert(message);
  }

  setupHTMLPage(title, url, imgUrl) {
    window.history.pushState(null, title, url);
    //this.updatePageMeta(url, title, imgUrl);
    if (!__DEV__)
    {
      gtag('config', Settings.gaTrackingId, {
        'page_title' : title,
        'page_location': url
      });
    }
  }
}
