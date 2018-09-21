import React from "react";
import {
  VrButton,
  View,
} from "react-360";
import { BaseButton } from "../../../../components";
import { usingAppContext } from "../../../../providers";
import { places } from "../../../../consts";
import style from "./style";

export default usingAppContext(({ selectedPlaceId, onPlaceSelected }) => {
  return (
  <View style={style.view}>
    <BaseButton
    selectedPlaceId={selectedPlaceId}
    buttonClick={() => {
      onPlaceSelected(-1);
    }}
    text="Home"
    textStyle={style.text}
    />
  </View>
  )
});