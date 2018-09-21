import React from "react";
import hideIf from "./hideIf";

const hideIfHome = hideIf((props) => props.selectedPlaceId === 4);

export default hideIfHome;