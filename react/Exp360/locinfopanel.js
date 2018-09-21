import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Sphere,
  Plane,
  VrButton,
  asset,
  billboarding,
} from 'react-360';
import { assert } from './common';

const styles = StyleSheet.create({
  infoPanel: {
    position: 'absolute',
    width: 1.8,
    backgroundColor: '#555555',
    opacity: 0.9,
    layoutOrigin: [0.5, 1.0],
    borderRadius: 0.01,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 0.11,
    fontWeight: '600',
    margin: 0.05,
  },
  contentItem: {
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  optionButton: {
    margin: 0.02,
    padding: 0.03,
    borderRadius: 0.01,
    width: 0.2,
    height: 0.2,
  },
  optionButtonUnselected: {
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#ffff00',
  },
  optionButtonCorrect: {
    backgroundColor: 'lime',
  },
  optionButtonIncorrect: {
    backgroundColor: '#ff0000',
  },
  optionButtonText: {
    fontSize: 0.11,
    marginHorizontal: 0.04,
  },
  optionButtonTextUnselected: {
    color: '#000000',
    fontWeight: '300',
  },
  optionButtonTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  optionButtonTextCorrect: {
    color: '#000000',
    fontWeight: '600',
  },
  optionButtonTextIncorrect: {
    color: '#000000',
    fontWeight: '600',
  },
  optionText: {
    width: 1.3,
    fontSize: 0.11,
    marginLeft: 0.05,
  },
  textUnselected: {
    color: '#ffffff',
    fontWeight: '300',
  },
  textSelected: {
    color: '#ffff00',
    fontWeight: '600',
  },
  textCorrect: {
    color: 'lime',
    fontWeight: '600',
  },
  textIncorrect: {
    color: '#ff0000',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 0.11,
    marginLeft: 0.05,
    marginRight: 0.05,
    color: '#ffffff',
    fontWeight: '300',
  },
  toolbar: {
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'flex-end',
    margin: 0.05,
  },
  toolbarButton: {
    backgroundColor: 'white',
    margin: 0.02,
    padding: 0.03,
    borderRadius: 0.01,
  },
  toolbarButtonText: {
    color: 'black',
    fontSize: 0.11,
    marginHorizontal: 0.05,
  },
  resultImage: {
    width: 0.2,
    height: 0.2,
  },
  messageText: {
    fontWeight: '600',
    fontSize: 0.11,
    marginRight: 0.02,
    marginTop: 0.05,
  }
});

// handles locInfo types that have panels: mcq and info in play and edit mode, nextScene and hidden in edit mode
export default class LocInfoPanel extends React.Component {
  constructor(props) {
    super(props);
    
    let isQuizChecked = false;
    let iSelectedOption = -1;

    if ((props.locInfo.exType === 'mcq') && props.userLocInfo) {
      isQuizChecked = true;
      iSelectedOption = this.props.shuffledOptions.findIndex(option => {
        return option.text === props.userLocInfo.answerText;
      });
    }
      
    this.state = {
      iSelectedOption: iSelectedOption,
      isQuizChecked: isQuizChecked,
    };
  }
  
  render() {
    const { userMode, locInfo, isSignedIn, isDirty, userLocInfo } = this.props;
    let locInfoPanel, header, toolbar;
    let contentItems = [];
    let isAnswerCorrect = false;
    let iCorrectOption = -1;

    switch (locInfo.exType) {
      case 'info':
        header =
          <Text style={[ styles.headerText ]}>{ (!locInfo.name || !locInfo.name.length) ? '<location name>' : locInfo.name }</Text>;
          
        contentItems.push(
          <View style={[ styles.contentItem ]} key={ 'info' }>
            <Text style={[ styles.infoText ]}>{ locInfo.info }</Text>
          </View>);
        break;
      
      case 'mcq':
        header =
          <Text style={[ styles.headerText ]}>{ (!locInfo.prompt || !locInfo.prompt.length) ? '<quiz prompt>' : locInfo.prompt }</Text>;
          
        for (let iOption = 0; iOption < this.props.shuffledOptions.length; iOption++) {
          const option = this.props.shuffledOptions[iOption];
          
          if ((userMode === 'edit') || (option.text && option.text.length)) {
            let styleButton, styleOptionButtonText, styleText;

            if (userMode === 'edit') {
              styleButton = (iOption === 0) ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
              styleOptionButtonText = (iOption === 0) ? styles.optionButtonTextCorrect : styles.optionButtonTextIncorrect;
              styleText = (iOption === 0) ? styles.optionTextCorrect : styles.optionTextIncorrect;
            } else {
              if (option.isCorrect)
                iCorrectOption = iOption;
              
              if (this.state.isQuizChecked) {
                if (this.state.iSelectedOption === iOption) {
                  isAnswerCorrect = option.isCorrect;
                }
              
                styleButton = (this.state.iSelectedOption === iOption) ? (option.isCorrect ? styles.optionButtonCorrect : styles.optionButtonIncorrect) : styles.optionButtonUnselected;
                styleOptionButtonText = (this.state.iSelectedOption === iOption) ? (option.isCorrect ? styles.optionButtonTextCorrect : styles.optionButtonTextIncorrect) : styles.optionButtonTextUnselected;
                styleText = (this.state.iSelectedOption === iOption) ? (option.isCorrect ? styles.textCorrect : styles.textIncorrect) : styles.textUnselected;
              } else {
                styleButton = (this.state.iSelectedOption === iOption) ? styles.optionButtonSelected : styles.optionButtonUnselected;
                styleOptionButtonText = (this.state.iSelectedOption === iOption) ? styles.optionButtonTextSelected : styles.optionButtonTextUnselected;
                styleText = (this.state.iSelectedOption === iOption) ? styles.textSelected : styles.textUnselected;
              }
            }
            
            const resultImageFile = this.state.isQuizChecked ? 
              ((this.state.iSelectedOption === iOption) ? (isAnswerCorrect ? 'correct.png' : 'incorrect.png') : 'transparent.png') : 
              'transparent.png';
            
            contentItem = 
              <View style={[ styles.contentItem ]} key={ iOption }>
                <Image style={[ styles.resultImage ]} source={ asset(resultImageFile) } />
                <VrButton style={[ styles.optionButton, styleButton ]} onClick={ e => this.onSelectOption.bind(this)(e, iOption) } key={ iOption }>
                  <Text style={[ styles.optionButtonText, styleOptionButtonText ]}>{ String.fromCharCode('A'.charCodeAt(0) + iOption) }</Text>
                </VrButton>
                <Text style={[ styles.optionText, styleText ]}>{ option.text }</Text>
              </View>;
              
            contentItems.push(contentItem);
          }
        }
        break;
      
      case 'nextScene':
        assert(userMode === 'edit');
        header =
          <Text style={[ styles.headerText ]}>Next Scene in the Tour</Text>;
          
        contentItems.push(
          <View style={[ styles.contentItem ]} key={ 'nextScene' }>
            <Text style={[ styles.optionText, styles.textUnselected ]}>{ locInfo.keySceneNext }</Text>
          </View>);
        break;
      
      case 'collectible':
      case 'hidden':
      case 'artefact':
      case 'unusual':
      case 'trash':
      case 'precious':
        // TODO: Need some params to make it work nicely
        break;
        
      default:
        assert(false);
        break;
    }
  
    // toolbar
    if (userMode === 'edit') {
      toolbar =
        <View style={[ styles.toolbar ]}>
          <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onEdit }>
            <Text style={[ styles.toolbarButtonText ]}>Edit</Text>
          </VrButton>
          <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onDelete }>
            <Text style={[ styles.toolbarButtonText ]}>Delete</Text>
          </VrButton>
          { isDirty ? 
            <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onSave }>
              <Text style={[ styles.toolbarButtonText ]}>Save</Text>
            </VrButton>
            : null
          }
          <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onClose }>
            <Text style={[ styles.toolbarButtonText ]}>Cancel</Text>
          </VrButton>
        </View>;
    } else {
      switch (locInfo.exType) {
        case 'info':
          toolbar = 
            <View style={[ styles.toolbar ]}>
              <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onAction }>
                <Text style={[ styles.toolbarButtonText ]}>More...</Text>
              </VrButton>
              <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onClose }>
                <Text style={[ styles.toolbarButtonText ]}>Close</Text>
              </VrButton>
            </View>;
          break;
          
        case 'mcq':
          if (this.state.isQuizChecked) {
            let messageText;
            if (this.state.iSelectedOption >= 0) {
              if (this.props.shuffledOptions[this.state.iSelectedOption].isCorrect) {
                messageText = 'Correct! (1 Point)';
              } else {
                messageText = 'Answer: ' + String.fromCharCode('A'.charCodeAt(0) + iCorrectOption) + '. (0 Points)';
              }
            } else {
              messageText = 'Answer: ' + String.fromCharCode('A'.charCodeAt(0) + iCorrectOption) + '. (0 Points)';
            }
            
            toolbar = 
              <View style={[ styles.toolbar ]}>
                <Text style={[ styles.messageText, styles.textSelected ]}>{ messageText }</Text>
                <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onClose }>
                  <Text style={[ styles.toolbarButtonText ]}>Ok</Text>
                </VrButton>
              </View>;
          } else {
            toolbar = 
              <View style={[ styles.toolbar ]}>
                <VrButton style={[ styles.toolbarButton ]} 
                  onClick={ e => this.onQuizResult(locInfo.exType, (this.state.iSelectedOption >= 0) && this.props.shuffledOptions[this.state.iSelectedOption].isCorrect, 
                                                   (this.state.iSelectedOption >= 0) ? this.props.shuffledOptions[this.state.iSelectedOption].text : null) }>
                  <Text style={[ styles.toolbarButtonText ]}>Check Answer</Text>
                </VrButton>
                <VrButton style={[ styles.toolbarButton ]} onClick={ this.props.onClose }>
                  <Text style={[ styles.toolbarButtonText ]}>Cancel</Text>
                </VrButton>
              </View>;
          }
          break;
          
        default:
          assert(false);
      }
    }
        
    // putting it all together
    locInfoPanel = 
      <View style={[ styles.infoPanel ]}>
        { header }
        { contentItems }
        { toolbar }
      </View>;
      
    return locInfoPanel;
  }
  
  onSelectOption(e, iOption) {
    if ((this.props.userMode === 'play') && !this.state.isQuizChecked) {
      this.setState({ iSelectedOption: iOption });
    }
  }
  
  onQuizResult(exType, isAnswerCorrect, answerText) {
    this.setState({ isQuizChecked: true });
    this.props.onQuizResult(exType, isAnswerCorrect, answerText);
  }
}