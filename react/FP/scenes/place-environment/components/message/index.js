import React from "react";
import { View,Text } from "react-360";
import { places } from "../../../../consts";
import { usingAppContext } from "../../../../providers";
import { compose } from "recompose";
import style from "./style";

export default compose(
  usingAppContext,
)(({ selectedPlaceId }) => {
  const text = places[selectedPlaceId].message;
  return (
    <Text style={style.text}>
      { text }
    </Text>
  )
});