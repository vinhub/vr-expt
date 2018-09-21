import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Sphere,
  Plane,
  VrButton,
  asset,
} from 'react-360';
import LocInfoPanel from './locinfopanel'

const styles = StyleSheet.create({
  infoIconView: {
    position: 'absolute',
    layoutOrigin: [0.5, 0.5],
  },
  movingStyle: {
    tintColor: '#00ffff',
  },
  infoIcon: {
    width: 0.25,
    height: 0.25,
  },
  infoIconHighlighted: {
    width: 0.3,
    height: 0.3,
  },
  infoIconCollectible: {
    width: 0.2,
    height: 0.2,
  },
  infoIconCollectibleHighlighted: {
    width: 0.25,
    height: 0.25,
  },
  infoIconCollectibleSilhouette: {
    width: 0.2,
    height: 0.2,
    opacity: 0.5,
  },
});

// locInfo types: mcq, info, nextScene, hidden
export default class LocInfoView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isHighlighted: false,
      shuffledOptions: (this.props.locInfo.exType === 'mcq') ? this.shuffleArray(this.props.locInfo.options) : null, // for mcq, we need to shuffle the mc options
    };
  }
  
  render() {
    const { userMode, locInfo, isSignedIn, isSelected, isMoving, isDirty, userLocInfo, seed } = this.props;
    let locInfoPanel = null;

    // Show panel if selected. In edit mode, we need to always show the panel. In play mode, show panel only for mcq and info.
    if (isSelected && ((userMode === 'edit') || (locInfo.type === 'mcq') || (locInfo.type === 'info'))) {
      locInfoPanel = 
        <LocInfoPanel userMode = { userMode } locInfo={ locInfo } isSignedIn={ isSignedIn } isDirty={ isDirty } userLocInfo={ userLocInfo } shuffledOptions={ this.state.shuffledOptions }
          onEdit={ this.props.onEdit } 
          onDelete={ this.props.onDelete } 
          onSave={ this.props.onSave } 
          onQuizResult={ (exType, isAnswerCorrect, answerText) => { this.props.onQuizResult(exType, isAnswerCorrect, answerText); } } 
          onClose={ this.props.onClose }
          onAction={ this.props.onAction }
        />;
    }

    let source;
    let iconStyle = this.state.isHighlighted ? styles.infoIconHighlighted : styles.infoIcon;
    let transformStyle = null;
    
    switch (locInfo.type) {
      case 'mcq':
        if (locInfo.exType === 'mcq')
          source = asset(userLocInfo ? (userLocInfo.isCorrect ? 'marker-correct.png' : 'marker-incorrect.png') : 'marker-question.png');
        else
          source = asset('marker-question.png');
        break;
        
      case 'info':
        source = asset('marker-question.png');
        break;

      case 'collectible':
        iconStyle = this.state.isHighlighted ? styles.infoIconCollectibleHighlighted : styles.infoIconCollectible;
        const item = ((userMode === 'edit') || (locInfo.exType === 'trash')) ? 'bottle' : 'diamond';
        if (userMode === 'edit')
          source = asset('marker-' + item + '.png');
        else if (userLocInfo)
          source = userLocInfo.isCorrect ? asset('marker-' + item + '-correct.png') : asset('marker-' + item + '-incorrect.png');
        else if (isSelected)
          source = asset('marker-' + item + '-correct.png');
        else {
          source = asset('marker-' + item + '-silhouette.png');
          iconStyle = styles.infoIconCollectibleSilhouette;
        }

        let rotateZ = (seed * 20 * (seed >= 0.5 ? 1 : -1)) + (180 * (seed >= 0.5 ? 0 : 1));
        transformStyle = { transform: [{ rotateZ: rotateZ }] };
        break;
      
      case 'hidden':
        if (userMode === 'edit')
          source = asset('marker-hidden.png');
        else if (userLocInfo)
          source = userLocInfo.isCorrect ? asset('marker-hidden-correct.png') : asset('marker-hidden-incorrect.png');
        else if (isSelected)
          source = asset('marker-hidden-correct.png');
        else {
          source = asset('marker-transparent.png');
          iconStyle = styles.infoIcon;
        }
        break;
      
      case 'nextScene':
        source = asset('marker-question.png');
        break;
    }
    
    let movingStyle = null;
    if ((userMode === 'edit') && isMoving) {
      movingStyle = styles.movingStyle;
    }
    
    const locInfoView = 
      <View style={[ styles.infoIconView, { transform: locInfo.location } ]} hitSlop={ 0.1 }>
        { locInfoPanel }
        <VrButton onClick={ this.props.onClick } onButtonPress={ this.props.onButtonPress } onButtonRelease={ this.props.onButtonRelease }>
          <Image style={[ iconStyle, transformStyle, movingStyle ]} 
            onEnter={ () => this.setState({ isHighlighted: true }) } onExit={ () => this.setState({ isHighlighted: false }) } 
            source={ source } />
        </VrButton>
      </View>;
    
    return locInfoView;
  }
  
  // utility methods
  shuffleArray(array) {
    const shuffledArray = JSON.parse(JSON.stringify(array)); // clone the array first since given array is immutable
    for (var i = shuffledArray.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[j];
        shuffledArray[j] = temp;
    }
    return shuffledArray;
  }
}