import React from "react";
import { useSelector } from "react-redux";

import { YOUNG_PHASE } from "../../utils";
import HomeInscription from "./inscription";
import HomeInterestMission from "./interestMission";
import HomeCohesionStay from "./cohesionStay";

export default () => {
  const young = useSelector((state) => state.Auth.young) || {};

  const renderStep = () => {
    if (young.phase === YOUNG_PHASE.INSCRIPTION || (young.cohort === "2020" && young.cohesion2020Step === "DONE")) return <HomeInscription young={young} />;
    if (young.phase === YOUNG_PHASE.COHESION_STAY) return <HomeCohesionStay young={young} />;
    if (young.phase === YOUNG_PHASE.INTEREST_MISSION) return <HomeInterestMission young={young} />;
    return <div />;
  };

  return renderStep();
};
