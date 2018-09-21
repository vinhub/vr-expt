import React from "react";
import { View } from "react-360";
import { Message, HomeButton } from "./components";

const PlaceEnvironment = (props) => (
  <View style={{
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    transform: [{translate: [150, 0, -100]}],
    marginTop: 80,
  }}>
    <HomeButton />
    <Message />
  </View>
);

export default PlaceEnvironment;