import React from "react";
import {
  VrButton,
  Text,
} from "react-360";
import style from "./style";

export default ((props) => {
    const { text, textStyle } = props;
    return (
      <VrButton
        onClick={props.buttonClick}
        style={style.button}>
        <Text
          style={[
          style.textDefault,
          textStyle,
          ]}>
          {text}
        </Text>
      </VrButton>
    )
});