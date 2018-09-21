import React from 'react';
import {
  VrHeadModel,
  View
} from 'react-360';
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

/**
 * Helper to fix a component to the viewport.
 * @module components/fixed
 */
class Fixed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hmMatrix: VrHeadModel.getHeadMatrix(),
    }
    
    this.listener = this._onReceivedHeadMatrix.bind(this);
    this._headMatrixListener = RCTDeviceEventEmitter.addListener(
      'onReceivedHeadMatrix',
      this.listener
    );
  }
  
  _onReceivedHeadMatrix(headMatrix, viewMatrix, fov, aspect) {
    this.setState({
      hmMatrix: VrHeadModel.getHeadMatrix()
    });
  }
  
  render(){
    let { hmMatrix } = this.state;
    return (
      <View
        style={{
          position: 'absolute',
          layoutOrigin: [0, 1],
          transform: [
            {translate: [0, 0, 0]},
            {matrix: hmMatrix}
          ]
        }}>
        {this.props.children}
      </View>
    );
  }
  
  componentWillUnmount() {
    RCTDeviceEventEmitter.removeListener(
      'onReceivedHeadMatrix',
      this.listener
    );
  }
}

module.exports = Fixed;