import React from 'react';

const GameUIOverlay = props => {
  const homeButtons = (
    <div className="homeButtonsArea">
      <a title={ 'Home' } className="homeButton" onClick={ props.onHomeClick }>
        <img src="../static_assets/appicon.png" className="appIcon" />
        <span className="gameTitle">Explorer360</span>
      </a>
    </div>
  );

  let prevButton = null, nextButton = null;
  if (props.prevScene)  {
    prevButton = (
      <div className="prevButtonArea">
        <a title={ 'Previous Scene' } className="prevNextButton" onClick={ props.onPrevClick }>
          <img className="prevNextButton" src="../static_assets/prev-scene.png" />
        </a>
      </div>
    );
  }
  
  if (props.nextScene)  {
    nextButton = (
      <div className="nextButtonArea">
        <a title={ 'Next Scene' } className="prevNextButton" onClick={ props.onNextClick }>
          <img className="prevNextButton" src="../static_assets/next-scene.png" />
        </a>
      </div>
    );
  }

  let userStatus = null;
  let gameOverPopup = null;
  
  if ((props.overlayType === 'game') && (props.userMode === 'play')) {
    userStatus = (
      <div className="userStatusArea">
        <div className="userStatusSubArea">
          <div className="userStatus">
            <div className="userStatusRow">
              <span id="userScore">Score: 0 / 0</span>
            </div>
            <div className="userStatusRow">
              <span id="timeRemaining">Time: 0 s.</span>
            </div>
          </div>
        </div>
      </div>
    );

    let gameStatusMessage;
    if (props.isSignedIn) {
      gameStatusMessage = (
        <div className="gameStatusMessage2">Your answers and score have been saved. You can view your results or go to the Home page to explore other panoramas or create your own.</div>
      );
    } else {
      gameStatusMessage = (
        <div className="gameStatusMessage2">View your results or go to the Home page to sign in and explore other panoramas or create your own.</div>
      );
    }
    
    gameOverPopup = (
      <div id="gameOverPopup" className="gameOverPopup">
        <div className="gameStatusHeader">Time's Up!</div>
        <div id="gameOverScore" className="gameStatusMessage"></div>
        { gameStatusMessage }
        <div className="gameOverPopupToolbar">
          <a title="ViewResults" className="gameOverPopupButton" onClick={ props.onViewResultsClick }>View Results</a>
          <a title="Home" className="gameOverPopupButton" onClick={ props.onHomeClick }>Go Home</a>
        </div>
      </div>
    );
  }
    
  return (
    <div>
      <div className="sceneTitleArea">
        <div className="sceneTitleDiv">
          <span id="sceneTitle" className="sceneTitleText"></span>
          <a id="actionButton" title={ 'Go!' } className="actionButton" target="_blank">Go!</a>
        </div>
      </div>
      { homeButtons }
      { userStatus }
      { prevButton }
      { nextButton }
      { gameOverPopup }
    </div>
  );
};

export default GameUIOverlay;