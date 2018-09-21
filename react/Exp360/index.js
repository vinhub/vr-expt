import React from 'react';
import {
  AppRegistry,
  asset,
  StyleSheet,
  Text,
  View,
  VrButton,
  Image,
  NativeModules,
  Prefetch,
  VrHeadModel,
  Scene,
} from 'react-360';
import * as firebase from 'firebase';
const url = require('url');
import { Settings, MyScene, UserInfo, UserLocInfo } from './common';
import HomeUI from './homeui';
import GameUI from './gameui';
const DomOverlayModule = NativeModules.DomOverlayModule;

const styles = StyleSheet.create({
  splashView: {
    position: 'absolute',
    layoutOrigin: [0.5, 0.5],
    transform: [ { translate : [ 0, 0.25, -3 ] } ],
  },
  splashWait: {
    width: 0.25,
    height: 0.25,
  },
});

// Exp360: Main game UI
export default class Exp360 extends React.Component {
  constructor(props) {
    super(props);

    Settings.isMobileDevice = props.isMobileDevice; // are we running on a mobile device?
    
    // determine url params
    const parsedUrl = url.parse(NativeModules.Location.href, true);
    const query = parsedUrl.query;
    let userMode = query.um;
    let keyScene = query.ks;
    
    // url param validation
    if (!userMode || (userMode != 'edit'))
        userMode = 'play';
    
    this.state = {
      userMode: userMode, // is the user in play or edit mode?
      keySceneCur: keyScene, // scene currently being displayed

      showingPage: keyScene ? 'game' : 'home', // which page is currently being shown. If keyScene was specified, it means we want to skip the home page and go directly to the game page.
      showStartGameSplash: (userMode === 'play'), // show start game splash in play mode only

      scenes: null, // array of scenes in the current search results (scene: panorama with hotspots and info / quiz about them)
      iSceneStart: 0, // index of starting scene in home UI scenes list displayed
      userInfo: new UserInfo(),
      userLocInfos: null, // UserLocInfo array containing the secenes the user has seen and their answers etc. Null means we haven't gotten them from db yet. [] means we got them but it is empty.
      
      maxTime: 0, // max time allowed in seconds for current scene
      maxScore: 0, // max possible score for current scene
    };

    // set up callback from overlay
    DomOverlayModule.setRNCallbackMain((message_id, message) => this.domOverlayCallback(message_id, message));
    DomOverlayModule.openOverlay(this.overlayTypeFromPage(this.state.showingPage), null, this.state.userMode, false, this.state.userInfo, this.state.userInfo.isSignedIn());
  }

  render() {
    let content, url, title, imgUrl;
    
    // Show wait message until scenes get downloaded and, if starting game directly, userLocInfos have been downloaded.
    if (!this.state.scenes || ((this.state.userMode === 'play') && (this.state.showingPage === 'game') && (this.state.userLocInfos === null))) { 
      return (
        <View style={[ styles.splashView ]}>
          <Image style={[ styles.splashWait ]} source={ asset('wait.png') } />
        </View>
      );
    }
    
    if (this.state.showingPage === 'home') {
      content = (
        <HomeUI userMode={ this.state.userMode } scenes={ this.state.scenes } keySceneCur={ this.state.keySceneCur } userInfo={ this.state.userInfo } iSceneStart={ this.state.iSceneStart }
          onClickGameSelected={ (keyScene) => this.loadGame.bind(this)(keyScene, this.state.showStartGameSplash) } 
          onPageChange={ (iSceneStart) => this.setState({ iSceneStart: iSceneStart }) } 
        />
      );
    } else {
      content = (
        <GameUI userMode={ this.state.userMode } scene={ this.state.scenes ? this.state.scenes[this.state.keySceneCur] : null } keySceneCur={ this.state.keySceneCur } 
          userInfo={ this.state.userInfo } userLocInfos={ this.state.userLocInfos } showStartGameSplash={ this.state.showStartGameSplash }
          maxScore={ this.state.maxScore } maxTime={ this.state.maxTime }
          onNewLocInfo={ (keyLocInfoNew, locInfoNew) => this.onNewLocInfo.bind(this)(keyLocInfoNew, locInfoNew) }
          onUpdateGameState={ (userLocInfoNew, score, maxScore, timeRemaining) => this.onUpdateGameState.bind(this)(userLocInfoNew, score, maxScore, timeRemaining) } 
          onEndGame={ () => this.onEndGame.bind(this)() } 
          onGoHome={ () => this.onGoHome.bind(this)() } 
          onGoToScene={ (keySceneNext) => this.onGoToScene.bind(this)(keySceneNext) } />
      );
    }

    return content;
  }
  
  componentDidMount() {
    this.init();
  }
  
  init() {
    // check if userID is saved in cookie
    DomOverlayModule.getCookie('userID', 'idToken', (userID, idToken) => {
      if (userID) {
        const userInfoUrl = Settings.dbUrl + '/userInfos/' + userID + '.json?auth=' + Settings.dbSecret;
        const xhrGetUserInfo = new XMLHttpRequest();
        xhrGetUserInfo.onreadystatechange = () => { 
          if (xhrGetUserInfo.readyState === 4 && xhrGetUserInfo.status === 200) {
            const userInfoDB = JSON.parse(xhrGetUserInfo.responseText);
        
            if (userInfoDB) {
              this.setState({ userInfo: UserInfo.fromDB(userID, idToken, userInfoDB) });
            } else {
              DomOverlayModule.removeCookie('userID', 'idToken', { path: '/' });
            }

            DomOverlayModule.openOverlay(this.overlayTypeFromPage(this.state.showingPage), null, this.state.userMode, false, this.state.userInfo, this.state.userInfo.isSignedIn());
            
            if (this.state.userMode === 'play') {
              this.loadScenesPlayMode();
            } else {
              this.loadScenesEditMode();
            }
          }
        }
    
        xhrGetUserInfo.open("GET", userInfoUrl, true); // true for asynchronous 
        xhrGetUserInfo.send(null);
      } else {
        if (this.state.userMode === 'play') {
          this.loadScenesPlayMode();
        } else {
          this.loadScenesEditMode();
        }
      }
    });
  }
  
  loadScenesPlayMode() {
    // get it using REST API because firebase does not support web workers on IOS.
    const scenesUrl = Settings.dbUrl + '/scenes.json?orderBy="rank"&limitToLast=50&auth=' + Settings.dbSecret;
    const xhrGetScenes = new XMLHttpRequest();
    xhrGetScenes.onreadystatechange = () => { 
      if (xhrGetScenes.readyState === 4 && xhrGetScenes.status === 200) {
        const scenes = JSON.parse(xhrGetScenes.responseText);
        let scenesNew = {};
        
        // take only the scenes that have locInfos
        for (const keyScene in scenes) {
          const scene = scenes[keyScene];
          
          // if (!scene.locInfos) {
            // delete scenes[keyScene];
            // continue;
          // }
          
          // for each scene, insert additional scenes with the corresponding exTypes
          switch (scene.type) {
            case 'quiz':
              scenesNew = this.insertRelatedScenes(scenesNew, keyScene, scene, ['visit', 'quiz']);
              break;
              
            case 'visit':
              scenesNew = this.insertRelatedScenes(scenesNew, keyScene, scene, ['visit']);
              break;
              
            case 'huntUnusual':
            case 'huntArtefact':
              scenesNew = this.insertRelatedScenes(scenesNew, keyScene, scene, [scene.type]);
              break;

              case 'gather':
              scenesNew = this.insertRelatedScenes(scenesNew, keyScene, scene, ['gatherTrash', 'gatherPrecious']);
              break;
          }
        }

        // assign prevScene values to make it easier to loop through tours
        for (const keyScene in scenesNew) {
          let sceneCur = scenesNew[keyScene];
          if (sceneCur.tourTitle) { // first scene in a tour
            let keySceneCur = keyScene;
            while (sceneCur.nextScene) {
              if (!scenesNew[sceneCur.nextScene]) { // this can happen if sceneCur is a quiz but the next scene is a visit. Just terminate the tour if so.
                sceneCur.nextScene = null;
                break;
              }
              
              scenesNew[sceneCur.nextScene].prevScene = keySceneCur;
              keySceneCur = sceneCur.nextScene;
              sceneCur = scenesNew[keySceneCur];
            }
          }
        }
            
        // sort them by exType, followed by rank descending, followed by title ascending
        const sortedScenes = {};
        Object.keys(scenesNew).sort((key1, key2) => {
          const s1 = scenesNew[key1];
          const s2 = scenesNew[key2];
          
          if (s1.exType === s2.exType) {
            if (s1.rank === s2.rank)
              return s1.title.localeCompare(s2.title); // ascending
            else
              return s2.rank - s1.rank; // descending
          } else
            return MyScene.compareExTypes(s1.exType, s2.exType);
        }).forEach(function(key) {
          sortedScenes[key] = scenesNew[key];
        });        
        
        this.initScenes(sortedScenes);
      }
    }
    
    xhrGetScenes.open("GET", scenesUrl, true); // true for asynchronous 
    xhrGetScenes.send(null);
  }

  loadScenesEditMode() {
    // initialize this.state.scenes with db scenes data
    if (!this.state.userInfo.isSignedIn()) // shouldn't happen
      return;

    // Admin level can edit anything. Others can only edit their own scenes.
    const scenesUrl = (Settings.dbUrl + '/scenes.json?auth=' + Settings.dbSecret + '&orderBy="ownerID"') + ((this.state.userInfo.level >= Settings.adminLevel) ? '' : ('&equalTo="' + this.state.userInfo.userID + '"'));

    const xhrGetScenes = new XMLHttpRequest();
    xhrGetScenes.onreadystatechange = () => { 
      if (xhrGetScenes.readyState === 4 && xhrGetScenes.status === 200) {
        const scenes = JSON.parse(xhrGetScenes.responseText);
        
        for (const keyScene in scenes) {
          let scene = scenes[keyScene];
          if (scene.locInfos === undefined) {
              scene.locInfos = {};
          }
          else {
            for (let keyLocInfo in scene.locInfos) {
              const locInfo = scene.locInfos[keyLocInfo];
              locInfo.exType = locInfo.type;
            }
          }
        }
        
        this.initScenes(scenes);
      }
    }
    
    xhrGetScenes.open("GET", scenesUrl, true); // true for asynchronous 
    xhrGetScenes.send(null);
  }

  insertRelatedScenes(scenesNew, keyScene, scene, exTypes) {
    for (let i = 0; i < exTypes.length; i++) {
      let sceneNew = JSON.parse(JSON.stringify(scene));
      sceneNew.exType = exTypes[i];
      
      switch (sceneNew.exType) {
        case 'quiz':
          sceneNew.title += ' (Quiz)';
          if (sceneNew.tourTitle)
            sceneNew.tourTitle += ' (Quiz)';
          break;
          
        case 'visit':
          if (sceneNew.tourTitle)
            sceneNew.tourTitle += ' (Tour)';
          break;
          
        case 'gatherTrash':
          sceneNew.title += ' (Eco)';
          if (sceneNew.tourTitle)
            sceneNew.tourTitle += ' (Eco)';
          break;
          
        case 'gatherPrecious':
          sceneNew.title += ' (Treasure)';
          if (sceneNew.tourTitle)
            sceneNew.tourTitle += ' (Treasure)';
          break;
          
        case 'huntArtefact':
        case 'huntUnusual':
          sceneNew.title += ' (Hunt)';
          if (sceneNew.tourTitle)
            sceneNew.tourTitle += ' (Hunt)';
          break;
      }
      
      for (let keyLocInfo in sceneNew.locInfos) {
        const locInfo = sceneNew.locInfos[keyLocInfo];
        
        switch (locInfo.type) {
          case 'mcq':
            if (sceneNew.exType === 'quiz') // quizzes can be converted into infos because they contain all the info for an 'info'
              locInfo.exType = locInfo.type;
            else
              locInfo.exType = 'info';
            break;
            
          case 'info':
            locInfo.exType = locInfo.type;
            break;
            
          case 'hidden':
            locInfo.exType = (sceneNew.exType === 'huntArtefact') ? 'artefact' : 'unusual';
            break;
            
          case 'collectible':
            locInfo.exType = (sceneNew.exType === 'gatherTrash') ? 'trash' : 'precious';
            break;
        }
      }
      
      if (sceneNew.nextScene)
        sceneNew.nextScene = sceneNew.nextScene + '-' + i;
      
      scenesNew[keyScene + '-' + i] = sceneNew;
    }
    
    return scenesNew;
  }
  
  initScenes(scenes) {
    let keySceneCur = this.state.keySceneCur;
    let showingPage = this.state.showingPage;
    
    if (!(keySceneCur in scenes)) {
      keySceneCur = null;
      showingPage = 'home';
    }
    
    this.setState({ scenes: scenes, keySceneCur: keySceneCur, showingPage: showingPage });
    
    // if we are launching straight into the game, load it
    if ((this.state.userMode === 'play') && (keySceneCur != null)) {
      this.loadGame(keySceneCur, true);
    }
  
    // If we are showing the home page, we need to set up the HTML page here. If we are showing game page, it will be set up in initGame()  
    if (showingPage === 'home') {
      DomOverlayModule.setupHTMLPage('Explorer360 - Home - Redmond Labs', this.calcPageURL(), asset('appicon.png').uri);
    }
  }
  
  domOverlayCallback(message_id, message) {
    let locInfo;

    // TODO: HACKHACK: We are allowed to call the callback only once so we need to keep setting it again. Need to find a better way to do this.
    DomOverlayModule.setRNCallbackMain((message_id, message) => this.domOverlayCallback(message_id, message));
    
    switch (message_id) {
      case 'userInfoResponse':
        this.handleUserInfoResponse(message);
        break;
       
      case 'logoutUser':
        this.logoutUser();
        break;
        
      case 'setUserMode':
        // create URL for the page with approp userMode and navigate to it
        const url = this.calcPageURL(message.userMode);
        NativeModules.Location.replace(url);
        break;
        
      case 'newScene':
        this.onNewScene(message);
        break;
       
      default:
        break;
    }
    
    return true;
  }

  handleUserInfoResponse(userInfoResponse) {
    const xhrGetToken = new XMLHttpRequest();

    // Exchange provider token for firebase token
    const urlGetToken = Settings.tokenUrl + '?auth=' + Settings.dbSecret + '&key=' + Settings.apiKey;
    
    xhrGetToken.onreadystatechange = () => { 
      if (xhrGetToken.readyState === 4 && xhrGetToken.status === 200) {
        this.updateUserInfoDB(JSON.parse(xhrGetToken.responseText));
      }
    }
     
    xhrGetToken.open("POST", urlGetToken, true);
    xhrGetToken.setRequestHeader('Content-type','application/json; charset=utf-8');
    
    xhrGetToken.send(JSON.stringify({ 
      postBody: 'access_token=' + userInfoResponse.accessToken + '&providerId=' + userInfoResponse.providerId, 
      requestUri: Settings.requestUri, 
      returnIdpCredential: true, 
      returnSecureToken: true 
    }));
  }
  
  updateUserInfoDB(getTokenResponse) {
    const xhrGetUserInfo = new XMLHttpRequest();

    // Get user from email
    const urlGetUserInfo = Settings.dbUrl + '/userInfos.json?auth=' + Settings.dbSecret + '&orderBy="email"&equalTo="' + getTokenResponse.email +'"';
    
    xhrGetUserInfo.onreadystatechange = () => { 
      if (xhrGetUserInfo.readyState === 4 && xhrGetUserInfo.status === 200) {
        const resp = JSON.parse(xhrGetUserInfo.responseText);
        let userInfo;

        // the value is returned as a collection with zero or one item in it
        // empty collection means user was not found
        // if user was found, use the values from the db to initialize the userInfo
        if (Object.keys(resp).length === 0) {
          userInfo = UserInfo.clone(this.state.userInfo);
        } else {
          userInfo = UserInfo.fromDBCollection(resp, getTokenResponse.idToken);
        }
        
        // update with data from the login getTokenResponse so we can update it if it has changed in the login provider
        userInfo.idToken = getTokenResponse.idToken;
        userInfo.firstName = getTokenResponse.firstName;
        userInfo.lastName = getTokenResponse.lastName;
        userInfo.email = getTokenResponse.email;
        userInfo.pictureUrl = getTokenResponse.photoUrl;

        // create or update the user as appropriate
        const fUserExists = !!userInfo.userID;
        const url = Settings.dbUrl + (fUserExists ? '/userInfos/' + userInfo.userID + '.json' : '/userInfos.json') + '?auth=' + Settings.dbSecret;
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = () => { 
          if (xhr.readyState === 4 && xhr.status === 200) {
            const resp2 = JSON.parse(xhr.responseText);

            // obtain userID if newly created
            if (!fUserExists) {
              userInfo.userID = resp2.name;
            }
            
            // update userInfo in state and cookie
            this.setState({ userInfo: userInfo });
            DomOverlayModule.setCookie('userID', userInfo.userID, 'idToken', getTokenResponse.idToken, { path: '/' });
            DomOverlayModule.openOverlay(this.overlayTypeFromPage(this.state.showingPage), null, this.state.userMode, false, this.state.userInfo, this.state.userInfo.isSignedIn());
          }
        }

        xhr.open(fUserExists ? "PATCH" : "POST", url, true);
        xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        
        xhr.send(JSON.stringify(UserInfo.toDB(userInfo)));
      }
    }
       
    xhrGetUserInfo.open("GET", urlGetUserInfo, true);
    xhrGetUserInfo.send(null);
  }

  loadGame(keyScene, showStartGameSplash) {
    if ((this.state.userMode === 'play') && this.state.userInfo.isSignedIn()) {
      const url = Settings.dbUrl + '/userLocInfos/' + this.state.userInfo.userID + '/' + keyScene + '.json?auth=' + Settings.dbSecret;
      const xhr = new XMLHttpRequest();
    
      xhr.onreadystatechange = () => { 
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const userLocInfosDB = JSON.parse(xhr.responseText);
            const userLocInfos = UserLocInfo.fromDBCollection(this.state.userInfo.userID, keyScene, userLocInfosDB);
          
            this.initGame(keyScene, userLocInfos, showStartGameSplash);
          } else {
            this.initGame(keyScene, [], showStartGameSplash);
          }
        }
      }

      xhr.onerror = () => {
        this.initGame(keyScene, [], showStartGameSplash);
      }
      
      xhr.open("GET", url, true);
      xhr.send(null);
    } else {
      this.initGame(keyScene, [], showStartGameSplash);
    }
  }

  initGame(keyScene, userLocInfos, showStartGameSplash) {
    let userInfo = UserInfo.clone(this.state.userInfo);
    let maxTime = -1;
    let maxScore = 0;
      
    // we don't want to show splash to people who would have already seen it
    // TODO: this should really be done using cookie and on a per scene.exType basis
    showStartGameSplash = showStartGameSplash && !this.state.userInfo.isSignedIn();
    
    if (this.state.scenes[keyScene].exType === 'visit') {
      DomOverlayModule.openOverlay('visit', this.state.scenes[keyScene], this.state.userMode, false, userInfo, this.state.userInfo.isSignedIn());
    } else {
      if (this.state.userMode === 'play') {
        // randomize the quiz option sequence and accumulate maxscore
        for (const keyLocInfo in this.state.scenes[keyScene].locInfos) {
          const locInfo = this.state.scenes[keyScene].locInfos[keyLocInfo];
          if ((locInfo.type !== 'mcq') && (locInfo.type !== 'hidden') && (locInfo.type !== 'collectible'))
            continue;
          
          maxScore++; // 1 point per question
        }
      
        // calculate user's score so far for this scene
        userInfo.score = 0;
        if (userLocInfos && userLocInfos.length > 0) {
          userLocInfos.forEach(uli => { userInfo.score += (uli.isCorrect ? 1 : 0); });
        }
        
        // calculate max time
        if (Object.keys(this.state.scenes[keyScene].locInfos).length === userLocInfos.length) // if quiz had already been completed before
          maxTime = -1;
        else
          maxTime = (maxScore * (20 - userInfo.level));
      }

      DomOverlayModule.openOverlay('game', this.state.scenes[keyScene], this.state.userMode, false, userInfo, this.state.userInfo.isSignedIn());
      DomOverlayModule.setGameState(userInfo.score, maxScore, maxTime);
    }
   
    this.setState({ showingPage: 'game', keySceneCur: keyScene, userInfo: userInfo, userLocInfos: userLocInfos, showStartGameSplash: showStartGameSplash, maxScore: maxScore, maxTime: maxTime });
    DomOverlayModule.setupHTMLPage(
      'Explorer360 - ' + (this.state.scenes ? this.state.scenes[keyScene].title : '') + ' - Redmond Labs', 
      this.calcPageURL(null, keyScene),
      this.state.scenes ? (Settings.storageURI + Settings.storageBucket + '/o/' + this.state.scenes[keyScene].source + '?alt=media') : asset('appicon.png').uri);
  }

  onRestartGame() {
    // delete any answers already given
    if (this.state.userInfo.isSignedIn()) {
      for (let userLocInfo in this.state.userLocInfos) {
        const url = Settings.dbUrl + '/userLocInfos/' + this.state.userInfo.userID + '/' + this.state.keySceneCur + '.json?auth=' + Settings.dbSecret;
        const xhr = new XMLHttpRequest();
      
        xhr.onreadystatechange = () => { 
          if (xhr.readyState === 4 && xhr.status === 200) {
            // const resp = JSON.parse(xhr.responseText);
          }
        }

        xhr.open("DELETE", url, true);
        xhr.send(null);
      }
    }

    // update game state
    this.onUpdateGameState(null, -this.state.userInfo.score, this.state.maxTime);

    // restart game
    this.initGame(this.state.keySceneCur, [], true);
  }
  
  logoutUser() {
    DomOverlayModule.removeCookie('userID', 'idToken', { path: '/' });
    const url = this.calcPageURL('play'); // after logging out you can not be in edit mode
    NativeModules.Location.replace(url);
  }
  
  // Update score / time etc in the UI
  onUpdateGameState(userLocInfoNew, scoreDelta, timeRemaining) {
    let userInfoT = UserInfo.clone(this.state.userInfo);
    userInfoT.score += scoreDelta;
    userInfoT.totalScore += scoreDelta;
    
    if (userLocInfoNew)
      this.setState({ userInfo: userInfoT, userLocInfos: this.state.userLocInfos.concat([userLocInfoNew]) });
    else 
      this.setState({ userInfo: userInfoT });
    
    DomOverlayModule.setGameState(userInfoT.score, this.state.maxScore, timeRemaining);
    
    if (scoreDelta != 0) // trying to save unnecessary saves to db
      this.updateGameStateDB(userInfoT);
  }
  
  onEndGame() {
    DomOverlayModule.showGameOver();
  }
  
  onGoHome() {
    let userInfoT = UserInfo.clone(this.state.userInfo);
    userInfoT.score = 0;

    // update local state
    this.setState({ showingPage: 'home', userInfo: userInfoT, userLocInfos: [], keySceneCur: null });
    DomOverlayModule.openOverlay('home', null, this.state.userMode, false, userInfoT, this.state.userInfo.isSignedIn());
    DomOverlayModule.setupHTMLPage('Explorer360 - Home - Redmond Labs', this.calcPageURL(), asset('appicon.png').uri);

    this.updateGameStateDB(userInfoT);
  }

  onGoToScene(keyScene) {
    this.loadGame(keyScene, false);
  }
  
  // TODO: 
  updateLocInfos(locInfos) {
    this.state.scenes[this.state.keySceneCur].locInfos = locInfos;
    this.setState({ scenes: this.state.scenes });
  }
  
  updateGameStateDB(userInfo) {
    if (this.state.userInfo.isSignedIn()) {
      // update db userInfo
      const url = Settings.dbUrl + '/userInfos/' + userInfo.userID + '.json?auth=' + Settings.dbSecret;
      const xhr = new XMLHttpRequest();
    
      xhr.onreadystatechange = () => { 
        if (xhr.readyState === 4 && xhr.status === 200) {
          //const resp = JSON.parse(xhr.responseText);
        }
      }

      xhr.open("PATCH", url, true);
      xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
    
      xhr.send(JSON.stringify(UserInfo.toDB(userInfo)));
    }
  }
  
  // calc URL for current page given params
  calcPageURL(userMode = null, keyScene = null) {
    const parsedUrl = url.parse(NativeModules.Location.href, true);
    
    if (userMode)
      parsedUrl.query.um = userMode;
    else
      parsedUrl.query.um = this.state.userMode;
    
    // play is default
    if (parsedUrl.query.um === 'play')
      delete parsedUrl.query.um;
    
    if (keyScene)
      parsedUrl.query.ks = keyScene;
    else if (this.state.keySceneCur)
      parsedUrl.query.ks = this.state.keySceneCur;
    else
      delete parsedUrl.query.ks;
    
    delete parsedUrl.search;

    return url.format(parsedUrl);
  }

  onNewScene(newScene) {
    const scene = { title: newScene.title, source: newScene.source, type: newScene.type, ownerID: this.state.userInfo.userID };
    
    const url = Settings.dbUrl + '/scenes.json?auth=' + Settings.dbSecret;
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = () => { 
      if (xhr.readyState === 4 && xhr.status === 200) {
        const resp = JSON.parse(xhr.responseText);
        
        this.loadScenesEditMode();
        this.setState({ keySceneCur: resp.name });
      }
    }

    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  
    xhr.send(JSON.stringify(scene));
  }

  onNewLocInfo(keyLocInfoNew, locInfoNew) {
    let sceneCur = this.state.scenes[this.state.keySceneCur];
    sceneCur.locInfos[keyLocInfoNew] = locInfoNew;
  }
  
  overlayTypeFromPage(showingPage) {
    if (this.state.showingPage === 'home')
      return 'home';
    
    if (this.state.scenes && (this.state.scenes[this.state.keySceneCur].exType !== 'visit'))
      return 'game';
    
    return 'visit';
  }
}

AppRegistry.registerComponent('Exp360', () => Exp360);
