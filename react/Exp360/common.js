// App Settings

// General info:
// Scene: A pano + title + scene baseType + a collection of locInfos 
// Scene baseTypes: quiz, visit, gather, huntArtefact, huntUnusual
// At play time, an exType gets computed (based on locInfo types in it and URL): quiz => quiz / visit, visit, gather => gatherTrash / gatherPrecious, huntArtefact, huntUnusual
// LocInfo: location + type + exType + attributes depending upon the type
// At play time, an exType gets computed based on the scene exType.  (In edit mode, exType === type for ease of coding.)
// LocInfo types:  quiz => mcq / info, visit => info, gatherTrash => collectible, gatherPrecious => collectible, huntArtefact => hidden, huntUnusual => hidden
// LocInfo exTypes:  quiz => mcq / info, visit => info, gatherTrash => trash, gatherPrecious => precious, huntArtefact => artefact, huntUnusual => unusual
// UserInfo: info about currently logged in user (name, userid, email, picture, score, level etc.)
// Each user has a collection of userLocInfos
// UserLocInfo: key of the corresponding LocInfo and its exType + info about user's interaction with a LocInfo (answer, correct or incorrect etc.)

export class Settings {
  static getDefaultMoreInfoUrl(searchStr) {
    return 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURI(searchStr);
  }

  static getDefaultActionUrl(searchStr) {
    return 'https://www.expedia.com';
  }
}

Settings.isMobileDevice = false;
Settings.contentCreatorLevel = 3;
Settings.adminLevel = 10;
Settings.tokenUrl = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyAssertion';

// TODO: Replace these with real values
if (__DEV__) {
  // Dev settings
  Settings.dbUrl = '<Provide your own>';
  Settings.authDomain = '<Provide your own>';
  Settings.apiKey = '<Provide your own>';
  Settings.projectId = '<Provide your own>'; 
  Settings.storageURI = 'https://firebasestorage.googleapis.com/v0/b/';
  Settings.storageBucket = '<Provide your own>';
  Settings.messagingSenderId = '<Provide your own>';
  Settings.requestUri = '<Provide your own>';
  Settings.dbSecret = '<Provide your own>';

  Settings.FBAppId = '<Provide your own>';
  
  Settings.GoogleApiKey = '<Provide your own>';
  Settings.GoogleClientId = '<Provide your own>';
} else {
  // Production settings
  Settings.dbUrl = '<Provide your own>';
  Settings.authDomain = '<Provide your own>';
  Settings.apiKey = '<Provide your own>';
  Settings.projectId = '<Provide your own>'; 
  Settings.storageURI = 'https://firebasestorage.googleapis.com/v0/b/';
  Settings.storageBucket = '<Provide your own>';
  Settings.messagingSenderId = '<Provide your own>';
  Settings.requestUri = '<Provide your own>';
  Settings.dbSecret = '<Provide your own>';

  Settings.FBAppId = '<Provide your own>';

  Settings.GoogleApiKey = '<Provide your own>';
  Settings.GoogleClientId = '<Provide your own>';
  
  Settings.gaTrackingId = '<Provide your own>';
}

export class MyScene {
  static compareExTypes(ex1, ex2) {
    exTypes = ['visit', 'quiz', 'gatherTrash', 'gatherPrecious', 'huntUnusual', 'huntArtefact']; // ordered by their priority order
    
    const i1 = exTypes.indexOf(ex1);
    const i2 = exTypes.indexOf(ex2);
    
    return i1 - i2; // ascending
  }
}

// UserInfo
// info about current user
export class UserInfo {
  constructor() {
    this.userID = null; // internal unique user id
    
    this.idToken = null;
    this.firstName = null; // first name of the user
    this.lastName = null;
    this.email = null;
    this.pictureUrl = null;
    
    this.level = 0; // user's current level
    this.totalScore = 0; // user's total score so far
    this.score = 0; // user's current score (for the current game)

    this.locations = []; // locations that the user may be interested in
  }
    
  static fromDB(userID, idToken, userInfoDB) {
    let userInfo = new UserInfo();
    userInfo.userID = userID; // internal unique user id
    
    userInfo.idToken = idToken; // we don't save the idToken in the DB
    userInfo.firstName = userInfoDB.firstName; // first name of the user
    userInfo.lastName = userInfoDB.lastName;
    userInfo.email = userInfoDB.email;
    userInfo.pictureUrl = userInfoDB.pictureUrl;
    
    userInfo.level = userInfoDB.level; // user's current level
    userInfo.totalScore = userInfoDB.totalScore; // user's total score so far
    userInfo.score = userInfoDB.score; // user's current score (for the current game)

    userInfo.userLocInfos = userInfoDB.userLocInfos; // UserLocInfo array containing the secenes the user has seen and their answers etc.
    
    return userInfo;
  }

  static fromDBCollection(userInfoDBCollection, idToken) {
    return UserInfo.fromDB(Object.keys(userInfoDBCollection)[0], idToken, Object.values(userInfoDBCollection)[0]);
  }
    
  static clone(userInfoIn) {
    let userInfo = new UserInfo();
    userInfo.userID = userInfoIn.userID; // internal unique user id
    
    userInfo.idToken = userInfoIn.idToken;
    userInfo.firstName = userInfoIn.firstName; // first name of the user
    userInfo.lastName = userInfoIn.lastName;
    userInfo.email = userInfoIn.email;
    userInfo.pictureUrl = userInfoIn.pictureUrl;
    
    userInfo.level = userInfoIn.level; // user's current level
    userInfo.totalScore = userInfoIn.totalScore; // user's total score so far
    userInfo.score = userInfoIn.score; // user's current score (for the current game)

    userInfo.userLocInfos = userInfoIn.userLocInfos; // UserLocInfo array containing the secenes the user has seen and their answers etc.
    
    return userInfo;
  }

  static toDB(userInfo) {
    let userInfoClone = UserInfo.clone(userInfo);
    delete userInfoClone.userID;
    delete userInfoClone.idToken;
    return userInfoClone;
  }

  isSignedIn() { 
    return !!this.idToken; 
  }
}

// LocInfo
// info about a hotspot (where an icon is displayed and user can click and view info or do quiz etc.)
export class LocInfo { 
    constructor(location, type) {
        this.location = location; // transform styles that place the hotspot in the right place in the scene
        this.exType = this.type = type;
        switch (type) {
          case 'mcq': // multiple choice question
            this.prompt = '<question prompt>'; // the prompt text for the quiz

            // For simplicity, we will always have 4 options. Initialize with the first one as correct, rest incorrect. They will be randomized when displayed to the user.
            this.options = [{ text: '<answer a>', isCorrect: true }, { text: '<answer b>', isCorrect: false }, { text: '<answer c>', isCorrect: false }, { text: '<answer d>', isCorrect: false }];
            this.info = '<info about the answer>';
            break;
            
          case 'info': // information
            this.name = '<location name>';
            this.info = '<info about this location>';
            break;
            
          case 'nextScene': // goes to next scene in a sequence
            this.keySceneNext = '<key for next scene>';
            break;
            
          case 'hidden': // hidden hotspot (for 'Where's Waldo' type activity)
          case 'collectible': // collect items
            break;
            
          default:
            break;
        }
    }

    static clone(locInfo) {
      return JSON.parse(JSON.stringify(locInfo));
    }
    
    static toDB(locInfo) {
      const locInfoNew = JSON.parse(JSON.stringify(locInfo));
      delete locInfoNew.exType;
      return locInfoNew;
    }
}

// UserLocInfo
// Info about user's interaction with a specific hotspot (locInfo) in a specific scene
export class UserLocInfo {
  constructor(userID, keyScene, keyLocInfo, exType, isCorrect, answerText) {
    this.userID = userID;
    this.keyScene = keyScene;
    this.keyLocInfo = keyLocInfo;
    this.exType = exType;
    
    switch (exType) {
      case 'mcq':
        this.answerText = answerText;
        this.isCorrect = isCorrect;
        break;
        
      case 'artefact':
      case 'unusual':
      case 'trash':
      case 'precious':
        this.isCorrect = isCorrect;
        break;

      case 'info':
      case 'nextScene':
        break;
    }
  }
  
  static toDB(userLocInfo) {
    const userLocInfoDB = JSON.parse(JSON.stringify(userLocInfo));
    delete userLocInfoDB.userID;
    delete userLocInfoDB.keyScene;
    return userLocInfoDB;
  }
  
  static fromDBCollection(userID, keyScene, userLocInfosDB) {
    const userLocInfos = [];
   
    if (userLocInfosDB && Object.keys(userLocInfosDB).length) {
      const values = Object.values(userLocInfosDB);
      
      for(let i = 0; i < Object.keys(userLocInfosDB).length; i++) {
        const userLocInfo = values[i];
        userLocInfo.userID = userID;
        userLocInfo.keyScene = keyScene;
        userLocInfos.push(userLocInfo);
      }
    }
    
    return userLocInfos;
  }
}

// Common utility functions 
export function assert(condition, message) {
  if (__DEV__) {
    if (!condition) {
        message = message || 'Assertion failed';
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
  }
}
