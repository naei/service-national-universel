import React from "react";

import { YOUNG_STATUS } from "../../../utils";
import WaitingValidation from "./waitingValidation";
import WaitingCorrection from "./waitingCorrection";
import Validated from "./validated";
import Refused from "./refused";

export default ({ young }) => {
  const renderStep = () => {
    if (young.status === YOUNG_STATUS.WAITING_CORRECTION) return <WaitingCorrection />;
    if (young.status === YOUNG_STATUS.WAITING_VALIDATION) return <WaitingValidation />;
    if (young.status === YOUNG_STATUS.VALIDATED) return <Validated />;
    if (young.status === YOUNG_STATUS.REFUSED) return <Refused />;
    return <div />;
  };

  return renderStep();
};
