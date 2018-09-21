import React from "react";
import { withState, withHandlers, compose } from "recompose";
import { Environment, asset, NativeModules } from "react-360";
const { AudioModule } = NativeModules;
import { places } from "../consts";

const withStateAndHandlers = compose(
  withState("selectedPlaceId", "onPlaceSelected", -1),
  withHandlers({
    onPlaceSelected: (props) => (id, evt) => {
      if (id >= 0) {
        Environment.setBackgroundImage(asset(places[id].image));
        if (places[id].audio !== null && places[id].audio !== undefined) {
          AudioModule.playEnvironmental({
            source: asset(places[id].audio),
            volume: 0.3,
          });
        } else {
          AudioModule.stopEnvironmental();
        }
      } else {
        Environment.setBackgroundImage("images/HomeBackground.jpg");
        AudioModule.stopEnvironmental();
      }
      
      props.onPlaceSelected(selectedPlaceId => id);
    }
  }),
)

export default withStateAndHandlers;