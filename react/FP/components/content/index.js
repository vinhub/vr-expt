import React from "react";
import { View, NativeModules } from "react-360";
import { HomeEnvironment, PlaceEnvironment } from "../../scenes";
import { withAppContext } from "../../providers";
import { places } from "../../consts";
const url = require('url');

const parsedUrl = url.parse(NativeModules.Location.href, true);
const query = parsedUrl.query;
let userMode = query.um;
let placeId = query.id;

// url param validation
if (!userMode || (userMode != 'edit'))
    userMode = 'play';
    
const AppContent = withAppContext(() => (
  <View>
    { (placeId && (placeId >= 0)) ? <PlaceEnvironment /> : <HomeEnvironment /> }
  </View>
));

export default AppContent;