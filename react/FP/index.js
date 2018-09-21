import React from "react";
import {
  AppRegistry,
  View,
} from "react-360";
import { AppContent } from "./components";
import { withAppContext } from "./providers";

const Pristine360 = withAppContext(() => (
  <View style={{
    transform: [{ translate: [0, 0, -2] }]
  }}>
    <AppContent />
  </View>
));


AppRegistry.registerComponent("AppContent", () => AppContent);
AppRegistry.registerComponent("Pristine360", () => Pristine360);
