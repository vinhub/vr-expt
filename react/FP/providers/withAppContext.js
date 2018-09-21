import { withContext, compose } from "recompose";
import * as PropTypes from "prop-types";
import withStateAndHandlers from "./withStateAndHandlers";

export const AppPropTypes = {
  selectedPlaceId: PropTypes.number,
  onPlaceSelected: PropTypes.func,
}

const AppContext = withContext(
  AppPropTypes,
  ({ selectedPlaceId, onPlaceSelected }) => ({
    selectedPlaceId,
    onPlaceSelected,
  })
);

export default compose(
  withStateAndHandlers,
  AppContext,
);
