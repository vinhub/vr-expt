import React from 'react';
import {
  StyleSheet,
  Pano,
  View,
  Image,
  Sphere,
  Plane,
  VrButton,
  Text,
  asset,
  VrHeadModel,
  NativeModules,
} from 'react-360';
import ReactNative, { Easing } from 'react-native';
import Fixed from './fixed';
import { assert } from './common';
const DomOverlayModule = NativeModules.DomOverlayModule;

const styles = StyleSheet.create({
  homeUI: {
    backgroundColor: 'white',
  },
  arrow: {
    position: 'absolute',
    layoutOrigin: [0.5, 0.5],
    width: 0.5,
    height: 0.5,
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
  startButtonsArea: {
    position: 'absolute',
    layoutOrigin: [0.5, 1.0],
    transform: [ { translate : [ 0, -0.2, -3 ] } ],
    width: 1.8,
    height: 1.7,
    backgroundColor: '#000000',
    paddingBottom: 0.02,
  },
  startButtonsHeader: {
    backgroundColor: '#cc0000',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 0.11,
    fontWeight: '600',
    paddingTop: 0.02,
    margin: 0.03,
  },
  startButton: {
    backgroundColor: '#22aa22',
    borderRadius: 0.01,
    paddingHorizontal: 0.01,
    paddingVertical: 0.02,
    marginHorizontal: 0.03,
    marginVertical: 0.01,
    height: 0.19,
  },
  disabledStartButton: {
    backgroundColor: '#aaaaaa',
    borderRadius: 0.01,
    paddingHorizontal: 0.01,
    paddingVertical: 0.02,
    marginHorizontal: 0.03,
    marginVertical: 0.01,
    height: 0.19,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 0.11,
    fontWeight: '400',
  },
  prevNextButtonsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  prevNextButton: {
    width: 0.8,
    backgroundColor: '#22aa22',
    borderRadius: 0.01,
    paddingHorizontal: 0.01,
    paddingVertical: 0.02,
    marginHorizontal: 0.03,
    marginVertical: 0.01,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledPrevNextButton: {
    width: 0.8,
    backgroundColor: '#aaaaaa',
    borderRadius: 0.01,
    paddingHorizontal: 0.01,
    paddingVertical: 0.02,
    marginHorizontal: 0.03,
    marginVertical: 0.01,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevNextImage: {
    width: 0.1,
    height: 0.1,
  },
  disabledText: {
    color: '#cccccc',
    textAlign: 'center',
    fontSize: 0.11,
    fontWeight: '400',
  },
});

export default class HomeUI extends React.Component {
  constructor(props) {
    super(props);

    // shouldn't get in here unless scenes have been downloaded
    assert(this.props.scenes !== null);
    
    this.state = {
      scenesFiltered: this.filterScenes(this.props.scenes),
      iSceneStart: this.props.iSceneStart,
    };
  }
  
  render() {
    let keys, startButtonsArea;
    const cScenesMax = 6; // how many start buttons to show at a time

    if ((keys = Object.keys(this.state.scenesFiltered)) && keys.length) {
      let startButtons = [];
      for (let iSceneCur = this.state.iSceneStart; iSceneCur < this.state.iSceneStart + cScenesMax; iSceneCur++) {
        let startButton;
        if (iSceneCur < keys.length) {
          const keyScene = keys[iSceneCur];
          startButton = (
            <VrButton style={[ styles.startButton ]} key={ keyScene } onClick={ () => this.props.onClickGameSelected(keyScene) }>
              <Text style={[ styles.buttonText ]} numberOfLines={ 1 }>{ this.state.scenesFiltered[keyScene].tourTitle ? this.state.scenesFiltered[keyScene].tourTitle : this.state.scenesFiltered[keyScene].title }</Text>
            </VrButton>
          );
        } else {
          startButton = (
            <VrButton style={[ styles.disabledStartButton ]} key={ iSceneCur }>
              <Text style={[ styles.disabledText ]}>...</Text>
            </VrButton>
          );
        }
        
        startButtons.push(startButton);
      }
        
      const prevButton = (this.state.iSceneStart > 0) ? (
        <VrButton style={[ styles.prevNextButton ]} onClick={ () => this.onPageChange.bind(this)(Math.max(this.state.iSceneStart - cScenesMax, 0)) }>
          <Image style={[ styles.prevNextImage ]} source={ asset('prev-page.png') } />
        </VrButton>
      ) : (
        <VrButton style={[ styles.disabledPrevNextButton ]}>
          <Image style={[ styles.prevNextImage ]} source={ asset('prev-page-disabled.png') } />
        </VrButton>
      );
      
      const nextButton = (this.state.iSceneStart + cScenesMax < keys.length) ? (
        <VrButton style={[ styles.prevNextButton ]} onClick={ () => this.onPageChange.bind(this)(Math.min(this.state.iSceneStart + cScenesMax, keys.length - 1)) }>
          <Image style={[ styles.prevNextImage ]} source={ asset('next-page.png') } />
        </VrButton>
      ) : (
        <VrButton style={[ styles.disabledPrevNextButton ]}>
          <Image style={[ styles.prevNextImage ]} source={ asset('next-page-disabled.png') } />
        </VrButton>
      );
      
      startButtonsArea = (
        <View style={[ styles.startButtonsArea ]} billboarding={ 'on' }>
          <Text style={[ styles.startButtonsHeader ]}>Choose Your Adventure:</Text>
          { startButtons }
          <View style={[ styles.prevNextButtonsArea ]}>
            { prevButton }
            { nextButton }
          </View>  
      </View>
      );
    } else {
      startButtonsArea = (
        <View style={[ styles.startButtonsArea ]} billboarding={ 'on' }>
          <Text style={[ styles.startButtonsHeader ]}>Loading...</Text>
        </View>
      );
    }    

    return (
      <View style={[ styles.homeUI ]}>
        <Pano source={ asset('HomeBackground.jpg') } style={{ transform: [{ translate: [85, -100, 0] }] }} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowL ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowR ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowU ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowD ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowL2 ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowR2 ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowU2 ]} />
        <Image source={ asset('arrow.png') } style={[ styles.arrow, styles.arrowD2 ]} />
        { startButtonsArea }
      </View>
    );
  }
  
  onPageChange(iSceneStart) {
    this.setState({ iSceneStart: iSceneStart }); 
    this.props.onPageChange(iSceneStart);
  }
  
  // filter out scenes that are part of a tour but not the start of the tour
  filterScenes(scenes) {
    let scenesFiltered = {};
    if ((keys = Object.keys(scenes)) && keys.length) {
      for (let iSceneCur = 0; iSceneCur < keys.length; iSceneCur++) {
        const keyScene = keys[iSceneCur];
        if (scenes[keyScene].prevScene)
          continue;
        scenesFiltered[keyScene] = scenes[keyScene];
      }
    }
    
    return scenesFiltered;
  }
}