import React from "react";
import { View, NativeModules } from "react-360";
import { BaseButton } from "../../../../components";
import { usingAppContext } from "../../../../providers";
import { places } from "../../../../consts";
import { compose } from "recompose";
import style from "./style";

const StartButton = compose(
    usingAppContext
)(({ onPlaceSelected }) => {
  // TODO: For now, select a place at random (eventually will be more intelligent based on history)
  const place = places[Math.floor(Math.random() * places.length)];
 
  // TODO: Update URL
  //  window.history.pushState(null, title, url);
  
  return (
    <View style={ style.view }>
      <BaseButton
        selectedPlaceId={place.id}
        buttonClick={() => {
          onPlaceSelected(place.id);
        }}
        text={ "Start" }
      />
    </View>
  )
});

export default StartButton;