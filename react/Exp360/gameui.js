import React from 'react';
import {
  AppRegistry,
  asset,
  StyleSheet,
  Pano,
  Text,
  View,
  VrButton,
  Image,
  NativeModules,
  Prefetch,
  VrHeadModel,
} from 'react-360';
import * as THREE from 'three';
import LocInfoView from './locinfoview'
import { Settings, LocInfo, UserLocInfo, assert } from './common';

const url = require('url');
const DomOverlayModule = NativeModules.DomOverlayModule;

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    layoutOrigin: [0.5, 0.5],
    width: 0.5,
    height: 0.25,
  },
  arrowL: {
    transform: [{ rotateY: 90 }, { translate: [ 0, 0, -3 ] }],
  },
  arrowR: {
    transform: [{ rotateY: -90 }, { translate: [ 0, 0, -3 ] }, { rotateZ: 180 }],
  },
  arrowU: {
    transform: [{ rotateX: 90 }, { translate: [ 0, 0, -3 ]}, { rotateZ: -90 }],
  },
  arrowD: {
    transform: [{ rotateX: -90 }, { translate: [ 0, 0, -3 ]}, { rotateZ: 90 }],
  },
  arrowL2: {
    transform: [{ rotateY: 45 }, { translate: [ 0, 0, -3 ] }],
  },
  arrowR2: {
    transform: [{ rotateY: -45 }, { translate: [ 0, 0, -3 ] }, { rotateZ: 180 }],
  },
  arrowU2: {
    transform: [{ rotateX: 45 }, { translate: [ 0, 0, -3 ]}, { rotateZ: -90 }],
  },
  arrowD2: {
    transform: [{ rotateX: -45 }, { translate: [ 0, 0, -3 ]}, { rotateZ: 90 }],
  },
  splashView: {
    position: 'absolute',
    layoutOrigin: [0.5, 0.5],
    transform: [ { translate : [ 0, 0, -3 ] } ],
    width: 1.9,
    backgroundColor: '#000000',
    paddingBottom: 0.02,
    borderRadius: 0.01,
  },
  splashHeader: {
    backgroundColor: '#cc0000',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 0.11,
    fontWeight: '600',
    paddingTop: 0.01,
    marginBottom: 0.03,
    borderTopLeftRadius: 0.01,
    borderTopRightRadius: 0.01,
  },
  splashText: {
    backgroundColor: '#000000',
    color: '#ffffff',
    textAlign: 'left',
    fontSize: 0.1,
    fontWeight: '300',
    marginHorizontal: 0.08,
    marginVertical: 0.01,
  },
  startButton: {
    backgroundColor: '#22aa22',
    borderRadius: 0.01,
    paddingHorizontal: 0.01,
    paddingVertical: 0.02,
    marginHorizontal: 0.03,
    marginTop: 0.04,
    marginBottom: 0.02,
  },
  disabledStartButton: {
    backgroundColor: '#aaaaaa',
    borderRadius: 0.01,
    paddingHorizontal: 0.01,
    paddingVertical: 0.02,
    marginHorizontal: 0.03,
    marginVertical: 0.01,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 0.11,
    fontWeight: '400',
  },
});

// GameUI: game UI
export default class GameUI extends React.Component {
  constructor(props) {
    super(props);
    
    // scene and userLocInfos must be present (though userLocInfos may be an empty array), taken care of in the parent
    assert(this.props.scene !== null);
    assert((this.props.userMode !== 'play') || (this.props.userLocInfos !== null));

    const wasQuizCompleted = (this.props.userMode === 'play') && this.isQuizCompleted(); // whether the quiz had already been completed before getting here. Different from when user completes it during this session. 
    
    this.state = {
      endGame: false, // whether we are ending the game now
      wasQuizCompleted: wasQuizCompleted, 
      showingStartGameSplash: this.props.showStartGameSplash && !wasQuizCompleted, // Don't start the game yet if splash is to be shown.
      
      // for editing
      keyLocInfoSelected: null, // key of locinfo (hotspot) that is currently open
      locInfoUndo: null, // edit undo buffer in case author cancels
      keyLocInfoMoving: null, // key of locinfo that is currently long selected and ready to move (during editing)
      moveTimerId: null, // determines when a marker button press puts it into movable state

      isEditing: false, // for the currently open locinfo, are we currently editing it or just displaying it
      startTime: 0, // tick count when the hunt started
      gameTimerId: null, // setTimeOut ID for the timeout associated with the whole game
    };

    // set up callback from overlay
    DomOverlayModule.setRNCallbackGameUI((message_id, message) => this.domOverlayCallback(message_id, message));
  }

  render() {
    let locInfoViews = [];
    
    let panoOpacity = 1;
    let startGameSplash = null;
    if (this.state.showingStartGameSplash) { // If skipping home page and directly getting into the game from outside, we show splash. (Unless the quiz has already been completed before.)
      // Show instructions appropriate for each type of activity
      let instructions = [];
      
      switch (this.props.scene.exType) {
        case 'quiz':
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 1 }>{ (VrHeadModel.inVR() ? 'Look around' : (Settings.isMobileDevice ? 'Tilt or drag' : 'Click & drag')) + ' to explore the panorama.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 2 }>{ (Settings.isMobileDevice ? 'Tap' : 'Click') + ' on markers & answer questions.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 3 }>(Your timing and score are in the top right corner.)</Text>);
          break;
          
        case 'huntArtefact':
        case 'huntUnusual':
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 1 }>{ (VrHeadModel.inVR() ? 'Look around' : (Settings.isMobileDevice ? 'Tilt or drag' : 'Click & drag')) + ' to explore the panorama.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 2 }>{ 'See something unusual? ' + (Settings.isMobileDevice ? 'Tap' : 'Click') + ' on it.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 3 }>(Your timing and score are in the top right corner.)</Text>);
          break;
          
        case 'gatherTrash':
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 1 }>{ (VrHeadModel.inVR() ? 'Look around' : (Settings.isMobileDevice ? 'Tilt or drag' : 'Click & drag')) + ' to explore the panorama.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 2 }>{ 'Notice something odd? Yes, there\'s some trash hiding here!' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 3 }>{ 'Please help to restore this place to its pristine beauty by picking the trash up.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 4 }>(Your timing and score are in the top right corner.)</Text>);
          break;
          
        case 'gatherPrecious':
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 1 }>{ (VrHeadModel.inVR() ? 'Look around' : (Settings.isMobileDevice ? 'Tilt or drag' : 'Click & drag')) + ' to explore the panorama.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 2 }>{ 'Legend has it that a pirate hid some diamonds in this area a long time ago.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 3 }>{ 'If you can find them, they are yours!' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 4 }>(Your timing and score are in the top right corner.)</Text>);
          break;
          
        default:
        case 'visit':
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 1 }>{ (VrHeadModel.inVR() ? 'Look around' : (Settings.isMobileDevice ? 'Tilt or drag' : 'Click & drag')) + ' to explore the panorama.' }</Text>);
          instructions.push(
            <Text style={[ styles.splashText ]} key={ 2 }>{ (Settings.isMobileDevice ? 'Tap' : 'Click') + ' on markers for more info.' }</Text>);
          break;
      }
      
      startGameSplash = (
        <View>
          <View style={[ styles.splashView ]} billboarding={ 'on' }>
            <Text style={[ styles.splashHeader ]}>Explorer360</Text>
            { instructions }
            <VrButton style={[ styles.startButton ]} onClick={ e => this.onClickStartGame() }>
              <Text style={[ styles.buttonText ]}>Start Exploring!</Text>
            </VrButton>
          </View>
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowL ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowR ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowU ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowD ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowL2 ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowR2 ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowU2 ]} />
          <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowD2 ]} />
        </View>
      );
      panoOpacity = 0.5;
    } else {
      if (this.props.scene.locInfos) {
        let iLocInfo = 0;
        const cLocInfos = Object.keys(this.props.scene.locInfos).length;
        for (let keyLocInfo in this.props.scene.locInfos) {
            const locInfo = this.props.scene.locInfos[keyLocInfo];
            const userLocInfo = (this.props.userMode === 'play') ? 
              this.props.userLocInfos.find(uli => { return (uli.keyScene === this.props.keySceneCur) && (uli.keyLocInfo === keyLocInfo); }) : null;

            let locInfoView = 
              <LocInfoView userMode={ this.props.userMode } locInfo={ locInfo } isSignedIn={ this.props.userInfo.isSignedIn() } 
                userLocInfo={ userLocInfo } isSelected={ this.state.keyLocInfoSelected === keyLocInfo } isMoving={ this.state.keyLocInfoMoving === keyLocInfo } 
                isDirty={ this.state.locInfoUndo != null } key={ keyLocInfo } seed={ iLocInfo++ / cLocInfos }
                onClick={ () => this.onClickLocInfoView.bind(this)(keyLocInfo) } 
                onButtonPress={ () => this.onButtonPressLocInfoView.bind(this)(keyLocInfo) } 
                onButtonRelease={ () => this.onButtonReleaseLocInfoView.bind(this)(keyLocInfo) } 
                onEdit={ () => this.onEditLocInfoView.bind(this)(keyLocInfo) } 
                onDelete={ () => this.onDeleteLocInfoView.bind(this)(keyLocInfo) } 
                onSave={ () => this.onSaveLocInfoView.bind(this)(keyLocInfo) } 
                onQuizResult={ (exType, isAnswerCorrect, answerText) => this.onQuizResultLocInfoView.bind(this)(keyLocInfo, exType, isAnswerCorrect, answerText) } 
                onClose={ () => this.onCloseLocInfoView.bind(this)(keyLocInfo) } 
                onAction={ () => this.onActionLocInfoView.bind(this)(keyLocInfo) } 
              />;
              
            locInfoViews.push(locInfoView);
          }
      }
    }
    
    let source = this.props.scene.source;
    
    if (!source.toLowerCase().startsWith('http://') && !source.toLowerCase().startsWith('https://')) {
      if (__DEV__) {
        source = '../panos/' + source;
      } else {
        source = Settings.storageURI + Settings.storageBucket + '/o/' + source + '?alt=media';
      }
    }
    
    const scene =
      <View onInput={ e => this.onInput.bind(this)(e) } ref="gameUI">
        <Pano source={{ uri: source }} style={{ opacity: panoOpacity }} />
        { locInfoViews }
        { startGameSplash }
      </View>;
    
    return scene;
  }
  
  componentDidMount() {
    // start prefetching the pano image
    const prefetch = 
      <Prefetch source={asset(this.props.scene.source)} />;

    this.updateSceneTitle();

    if ((this.props.userMode === 'play') && (this.props.scene.exType !== 'visit') && !this.isGameOn() && !this.state.wasQuizCompleted && !this.state.showingStartGameSplash && !this.state.endGame)
      this.startGame();
  }

  componentDidUpdate() {
    this.updateSceneTitle();
  }

   // Is ther game currently on or off
  isGameOn() {
    return (this.state.gameTimerId != null);
  }
  
  onClickStartGame() {
    this.setState({ showingStartGameSplash: false });
    if ((this.props.scene.exType !== 'visit') && !this.isGameOn()) // not a visit and not already started?
      this.startGame();
  }
  
  startGame() {
    // remember play start time and start the game
    this.setState({ startTime: Date.now() });
    
    this.state.gameTimerId = setTimeout(function tick() {
      if (this.updateGameState(null, 0)) { // update game state display and check if game is over
        // game over
        this.endGame(true);
      } else {
        this.state.gameTimerId = setTimeout(tick.bind(this), 1000); // set new timeout to continue game
      }
    }.bind(this), 1000);
  }

  // stop game and clear out all game state
  endGame(isTimeUp) {
    // if currently showing start game splash or ending game already, then ignore
    if (this.state.showingStartGameSplash || this.state.endGame)
      return;
    
    // in play mode and if game was actually running, then show end game message. Otherwise directly go to home page.
    if ((this.props.userMode === 'play') && this.isGameOn()) {
      clearTimeout(this.state.gameTimerId);
      this.setState({ gameTimerId: null, startTime: 0, keyLocInfoSelected: null, endGame: true });

      if (isTimeUp) { // if time's up, show game over message
        this.props.onEndGame();
      }
    } else {
      this.setState({ keyLocInfoSelected: null });
      this.props.onGoHome();
    }
  }

  markUnansweredQuestions() {
    for (let keyLocInfo in this.props.scene.locInfos) {
      const userLocInfo = this.props.userLocInfos.find(
      uli => { 
        return (uli.keyScene === this.props.keySceneCur) && (uli.keyLocInfo === keyLocInfo);
      }
      );
      
      if (!userLocInfo) { // if there is no userLocInfo for this keyLocInfo, it is unanswered. So mark it as such.
        const locInfo = this.props.scene.locInfos[keyLocInfo];
        this.onQuizResultLocInfoView(keyLocInfo, locInfo.exType, false, null);
      }
    }
  }
  
  componentWillUnmount() {
    if (this.isGameOn())
      this.endGame(false);
  }
  
  updateSceneTitle() {
    let actionUrl = this.props.scene.action;
    if (!actionUrl)
      actionUrl = Settings.getDefaultActionUrl(this.props.scene.title);
    
    DomOverlayModule.setSceneTitle(this.props.scene.title, actionUrl);
  }
  
  // Update score / time etc in the UI and also check if game is over.
  // Returns true if game is over. Otherwise false.
  updateGameState(userLocInfoNew, scoreDelta) {
    const timeRemaining = this.calcTimeRemaining();    
    this.props.onUpdateGameState(userLocInfoNew, scoreDelta, timeRemaining);
    
    return (timeRemaining < 0.001);
  }
  
  calcTimeRemaining() {
    let timeRemaining = this.props.maxTime - ((Date.now() - this.state.startTime) / 1000);
    timeRemaining = timeRemaining.toFixed(0);
    timeRemaining = Math.max(timeRemaining, 0);
    return timeRemaining;
  }
  
  // quiz is completed if user has answered (correctly or incorrectly) all questions  
  isQuizCompleted() {
    return !this.props.scene.locInfos || (Object.keys(this.props.scene.locInfos).length === this.props.userLocInfos.length);
  }
  
  domOverlayCallback(message_id, message) {
    let locInfo;

    // TODO: HACKHACK: We are allowed to call the callback only once so we need to keep setting it again. Need to find a better way to do this.
    DomOverlayModule.setRNCallbackGameUI((message_id, message) => this.domOverlayCallback(message_id, message));
    
    switch (message_id) {
      case 'endGame':
        this.endGame(false);
        break;
        
      case 'goHome':
        if (this.props.userMode === 'play')
	        this.markUnansweredQuestions();
        
        this.props.onGoHome();
        break;

      case 'goPrev':
        assert(this.props.scene.prevScene);
        this.props.onGoToScene(this.props.scene.prevScene);
        break;

      case 'goNext':
        assert(this.props.scene.nextScene);
        this.props.onGoToScene(this.props.scene.nextScene);
        break;
      
      case 'viewResults':
        assert(this.props.userMode === 'play');
        this.markUnansweredQuestions();
        break;
      
      case 'newLocInfo':
        this.onNewLocInfo(message);
        break;
        
      case 'editLocInfo':
        this.onEditLocInfo(message);
        break;

      case 'moveLocInfo':
        this.moveLocInfo(message.matrixArray, message.cancel);
        break;
        
      default:
        return;
    }
    
    return true;
  }

  onNewLocInfo(message) {
    if ((this.props.userMode !== 'edit') || this.state.keyLocInfoSelected)
      return;

    // apply the matrix calculated from the point where the mouse click happened.
    const loc = [{ matrix: message.matrix }];
        
    const locInfo = new LocInfo(loc, this.locInfoTypeFromSceneType(this.props.scene.type));
    const url = Settings.dbUrl + '/scenes/' + this.props.keySceneCur + '/locInfos.json?auth=' + Settings.dbSecret;
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = () => { 
      if (xhr.readyState === 4 && xhr.status === 200) {
        const resp = JSON.parse(xhr.responseText);
        const keyLocInfoNew = resp.name;
        this.props.onNewLocInfo(keyLocInfoNew, locInfo);

        this.setState({ keyLocInfoSelected: keyLocInfoNew });
      }
    }

    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  
    xhr.send(JSON.stringify(LocInfo.toDB(locInfo)));
  }

  onEditLocInfo(message) {    
    let locInfo = LocInfo.clone(this.props.scene.locInfos[this.state.keyLocInfoSelected]);
    let locInfoUndo = this.state.locInfoUndo;
    let isDirty = (locInfoUndo != null);
        
    // make a copy of it for undo purposes
    if (!isDirty) {
      locInfoUndo = LocInfo.clone(locInfo);
    }
    
    if (locInfo.type !== message.type) {
      locInfo = new LocInfo(locInfo.location, message.type);
      isDirty = true;
    }
    
    switch (message.type) {
      case 'mcq': // multiple choice question
        if (locInfo.prompt !== message.prompt) {
          locInfo.prompt = message.prompt;
          isDirty = true;
        }
            
        if (locInfo.info !== message.info) {
          locInfo.info = message.info;
          isDirty = true;
        }
            
        if ((locInfo.options[0].text !== message.options[0].text) ||
            (locInfo.options[1].text !== message.options[1].text) ||
            (locInfo.options[2].text !== message.options[2].text) ||
            (locInfo.options[3].text !== message.options[3].text)) {
          locInfo.options = message.options;
          isDirty = true;
        }
        break;
        
      case 'info': 
        if (locInfo.name !== message.name) {
          locInfo.name = message.name;
          isDirty = true;
        }
        if (locInfo.info !== message.info) {
          locInfo.info = message.info;
          isDirty = true;
        }
        break;
        
      case 'nextScene': 
        if (locInfo.nextScene !== message.nextScene) {
          locInfo.nextScene = message.nextScene;
          isDirty = true;
        }
        break;
        
      case 'hidden': 
      case 'collectible':
        break;
        
      default:
        assert(false, 'Unknown LocInfo type: ' + message.type + '.');
        break;
    }
        
    if (isDirty) {
      delete this.props.scene.locInfos[this.state.keyLocInfoSelected];
      this.props.scene.locInfos[this.state.keyLocInfoSelected] = locInfo;
      this.setState({ isEditing: false, locInfoUndo: locInfoUndo });
    }
    else
      this.setState({ isEditing: false });
  }
        
  locInfoTypeFromSceneType(sceneType) {
    switch (sceneType) {
      case 'quiz': return 'mcq';
      case 'visit': return 'info';
      case 'huntArtefact': return 'hidden';
      case 'huntUnusual': return 'hidden';
      case 'gather': return 'collectible';
      default: assert(false);
    }
    
    return 'mcq';
  }
  
  // LocInfo related methods
  onInput(e) {
  }

  onClickLocInfoView(keyLocInfo) {
    if (this.state.moveTimerId)
      clearTimeout(this.state.moveTimerId);

    if ((this.state.keyLocInfoSelected !== keyLocInfo) && !this.state.isEditing && !this.state.locInfoUndo) {
      this.setState({ keyLocInfoSelected: keyLocInfo });
      
      if (this.props.userMode === 'play') {
        // for nextScene and hidden types, perform the related action
        const locInfo = this.props.scene.locInfos[keyLocInfo];
        switch (locInfo.exType) {
          case 'nextScene':
            this.onQuizResultLocInfoView(keyLocInfo, locInfo.exType, true);
            this.props.onGoToScene(locInfo.keySceneNext);
            break;
            
          case 'artefact':
          case 'unusual':
          case 'trash':
          case 'precious':
            this.onQuizResultLocInfoView(keyLocInfo, locInfo.exType, true);
            break;
        }
      }
    }
  }

  // To handle moving the marker for editing: 
  // Start a timer on button press.
  // When timer fires, put the button in movable state.
  onButtonPressLocInfoView(keyLocInfo) {
    if ((this.props.userMode !== 'edit') || this.state.isEditing || this.state.locInfoUndo)
      return;

    this.state.moveTimerId = setTimeout(function tick() {
      this.setState({ keyLocInfoSelected: null, keyLocInfoMoving: keyLocInfo, moveTimerId: null });
      DomOverlayModule.captureKeys(this.props.scene.locInfos[keyLocInfo].location[0].matrix);
    }.bind(this), 500);
  }

  // move the locInfo by the given amount of screen pixels
  moveLocInfo(matrixArray, cancel) {
    if ((this.props.userMode !== 'edit') || !this.state.keyLocInfoMoving)
      return;
    
    if (cancel) {
      DomOverlayModule.captureKeys(null);

      // update locInfo in db
      this.onSaveLocInfoView(this.state.keyLocInfoMoving);

      this.setState({ keyLocInfoSelected: null, keyLocInfoMoving: null });
      return;
    }
    
    let locInfo = LocInfo.clone(this.props.scene.locInfos[this.state.keyLocInfoMoving]);

    locInfo.location = [{ matrix: matrixArray }];
    this.props.scene.locInfos[this.state.keyLocInfoMoving] = locInfo;
    
    this.setState({ keyLocInfoSelected: null });
  }

  // Delete move timer and get out of movable state.
  onButtonReleaseLocInfoView(keyLocInfo) {
    if ((this.props.userMode !== 'edit') || (this.state.keyLocInfoMoving != keyLocInfo))
      return;
    
    if (this.state.moveTimerId)
      clearTimeout(this.state.moveTimerId);
    
    this.setState({ keyLocInfoSelected: null, moveTimerId: null });
  }

  onEditLocInfoView(keyLocInfo) {
    this.setState({ keyLocInfoSelected: keyLocInfo, isEditing: true });
    const locInfo = this.props.scene.locInfos[this.state.keyLocInfoSelected];
    DomOverlayModule.editLocInfo(locInfo);
  }

  onSaveLocInfoView(keyLocInfo) {
    const locInfo = this.props.scene.locInfos[keyLocInfo];
    const url = Settings.dbUrl + '/scenes/' + this.props.keySceneCur + '/locInfos/' + keyLocInfo + '.json?auth=' + Settings.dbSecret;
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = () => { 
      if (xhr.readyState === 4 && xhr.status === 200) {
        //const resp = JSON.parse(xhr.responseText);
        this.setState({ keyLocInfoSelected: null, locInfoUndo: null });
      }
    }

    xhr.open("PATCH", url, true);
    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  
    xhr.send(JSON.stringify(LocInfo.toDB(locInfo)));
  }

  onDeleteLocInfoView(keyLocInfo) {
    const url = Settings.dbUrl + '/scenes/' + this.props.keySceneCur + '/locInfos/' + keyLocInfo + '.json?auth=' + Settings.dbSecret;
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = () => { 
      if (xhr.readyState === 4 && xhr.status === 200) {
        //const resp = JSON.parse(xhr.responseText);
        delete this.props.scene.locInfos[keyLocInfo];
        this.setState({ keyLocInfoSelected: null, locInfoUndo: null });
      }
    }

    xhr.open("DELETE", url, true);
    xhr.send(null);
  }

  onCloseLocInfoView(keyLocInfo) {
    if (this.state.locInfoUndo)
        this.props.scene.locInfos[this.state.keyLocInfoSelected] = JSON.parse(JSON.stringify(this.state.locInfoUndo));
    this.setState({ keyLocInfoSelected: null, locInfoUndo: null });
  }

  onActionLocInfoView(keyLocInfo) {
    const locInfo = this.props.scene.locInfos[keyLocInfo];
    let actionUrl = locInfo.action;

    if (!actionUrl)
      actionUrl = Settings.getDefaultMoreInfoUrl(locInfo.name);

    NativeModules.LinkingManager.openURL(actionUrl);
  }
  
  onQuizResultLocInfoView(keyLocInfo, exType, isAnswerCorrect, answerText) {
    const userLocInfo = this.props.userLocInfos.find(
      uli => { 
        return (uli.keyScene === this.props.keySceneCur) && (uli.keyLocInfo === keyLocInfo);
      }
    );
    
    if (userLocInfo) { // should not already exist because that means already answered
      this.setState({ keyLocInfoSelected: null });
      return;
    }
  
    const userLocInfoNew = new UserLocInfo(this.props.userInfo.userID, this.props.keySceneCur, keyLocInfo, exType, isAnswerCorrect, answerText);

    if (this.props.userInfo.isSignedIn()) {
      const url = Settings.dbUrl + '/userLocInfos/' + this.props.userInfo.userID + '/' + this.props.keySceneCur + '.json?auth=' + Settings.dbSecret;
      const xhr = new XMLHttpRequest();
    
      xhr.onreadystatechange = () => { 
        if (xhr.readyState === 4 && xhr.status === 200) {
          // const resp = JSON.parse(xhr.responseText);
        }
      }

      xhr.open("POST", url, true);
      xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
      xhr.send(JSON.stringify(UserLocInfo.toDB(userLocInfoNew)));
    }
    
    this.updateGameState(userLocInfoNew, isAnswerCorrect ? 1 : 0);
  }
}
