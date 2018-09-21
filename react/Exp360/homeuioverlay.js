import React from 'react';
import { Settings } from './common';

const HomeUIOverlay = props => {
  let menuPane;
  if (props.showMenu) {
    if (props.isSignedIn) {
      menuPane = (
        <div id="menuPane" className="menuPane">
          <div className="menuLoginArea">
            <span className="menuText">{ props.userInfo.firstName } { props.userInfo.lastName }</span>
          </div>
          <div><span className="menuText">Total Score:&nbsp;{ props.userInfo.totalScore }</span></div>
          {
            (!Settings.isMobileDevice && (props.userInfo.level >= Settings.contentCreatorLevel)) ? (
              <div>
                <span className="menuText">User Mode: </span>
                <label className="menuText">
                  <input type="radio" name="setUserMode" value="play" defaultChecked={ props.userMode === 'play' } onChange={ () => (props.userMode !== 'play') && props.onSetUserMode('play') } />Play
                </label>
                <label className="menuText">
                  <input type="radio" name="setUserMode" value="edit" defaultChecked={ props.userMode === 'edit' } onChange={ () => (props.userMode !== 'edit') && props.onSetUserMode('edit') } />Edit
                </label>
              </div>
            ) : null
          }
          {
            (!Settings.isMobileDevice && (props.userMode === 'edit')) ? (
              <span className="menuText"><a id="newSceneButton" title="Add New Scene" onClick={ props.onNewSceneClick }>Add New Scene</a></span>
            ) : null
          }
          <div>
            <span className="menuText">
              <a title="Logout" onClick={ props.logoutUser }>Logout<img src={ '../static_assets/logout.png' } className="menuItemButton" /></a>
            </span>
          </div>
          <div><span className="menuText"><a href="http://redmondlabs.com/" target="_blank">About Redmond Labs</a></span></div>
        </div>
      );
    } else {
      menuPane = (
        <div id="menuPane" className="menuPane">
          <div className="menuLoginArea">
            <span className="menuText">Sign in:</span>
            <a id="fbLoginButton" title="Facebook Login" onClick={ () => props.loginUser('facebook.com') }>
              <img src={ '../static_assets/fb.png' } className="menuItemButton" />
            </a>
            <a id="googleLoginButton" title="Google Login" onClick={ () => props.loginUser('google.com') }>
              <img src={ '../static_assets/google.png' } className="menuItemButton" />
            </a>
          </div>
          <div><span className="menuText"><a href="http://redmondlabs.com/" target="_blank">About Redmond Labs</a></span></div>
        </div>
      );
    }
  } else 
  {
    menuPane = null;
  }

  let picture;
  if (props.isSignedIn && props.userInfo.pictureUrl) {
    picture = ( <img src={ props.userInfo.pictureUrl } width="30" height="30" /> );
  } else {
    picture = (
      <svg width="30px" height="30px" viewBox="0 0 60 60">
        <g fill="#ffffff" stroke="none" fillRule="evenodd">
          <path d="M10,15 L50,15 L50,20 L10,20 L10,15 Z"></path>
          <path d="M10,30 L50,30 L50,35 L10,35 L10,30 Z"></path>
          <path d="M10,45 L50,45 L50,50 L10,50 L10,45 Z"></path>
        </g>
      </svg>
    );
  }
  
  const overlayUI = (
    <div>
      <div className="homeButtonsArea">
        <a title={ 'Home' } className="homeButton" onClick={ props.onHomeClick }>
          <img src="../static_assets/appicon.png" className="appIcon" />
          <span className="gameTitle">Explorer360</span>
        </a>
      </div>
      <div className="userStatusArea">
        <div className="userStatusSubArea">
          <a id="menuButton" title="User Profile" className="menuButton" onClick={ props.onMenuClick }>
            { picture }
          </a>
        </div>
      </div>
      { menuPane }
    </div>
  );
    
  return overlayUI;
};

export default HomeUIOverlay;