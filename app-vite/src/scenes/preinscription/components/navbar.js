import React from "react";
import { useParams } from "react-router-dom";

import useDevice from "../../../hooks/useDevice";
import { getStepFromUrlParam, PREINSCRIPTION_STEPS_LIST } from "../../../utils/navigation";

const Navbar = () => {
  const { step } = useParams();
  const currentStep = getStepFromUrlParam(step, PREINSCRIPTION_STEPS_LIST) || "ELIGIBILITE";

  return ["ELIGIBILITE", "SEJOUR", "PROFIL"].includes(currentStep) ? (
    <div className="flex flex-col justify-center w-full md:w-[56rem] mx-auto px-[1rem] md:px-[6rem] py-[1rem] md:py-[2rem]">
      <div className="text-sm">Étape {currentStep === "ELIGIBILITE" ? "1" : currentStep === "SEJOUR" ? "2" : currentStep === "PROFIL" && "3"} sur 3</div>
      <div className="text-lg font-bold mt-2">
        {currentStep === "ELIGIBILITE" ? "Avant d'aller plus loin" : currentStep === "SEJOUR" ? "Séjour de cohésion" : currentStep === "PROFIL" && "Mon compte volontaire SNU"}
      </div>
      <div className="flex space-x-2 w-full mt-2">
        <div className="basis-1/3 bg-[#000091] h-2"></div>
        <div className={`basis-1/3  h-2 ${currentStep !== "ELIGIBILITE" ? "bg-[#000091]" : "bg-[#C6C6FB]"}`}></div>
        <div className={`basis-1/3  h-2 ${currentStep === "PROFIL" ? "bg-[#000091]" : "bg-[#C6C6FB]"}`}></div>
      </div>
      {useDevice() === "desktop" && (
        <div className="flex space-x-1 text-xs mt-2 text-[#666666]">
          <div className="font-bold">{["ELIGIBILITE", "SEJOUR"].includes(currentStep) && "Étape suivante:"}</div>
          <div>{currentStep === "ELIGIBILITE" ? "Séjour de cohésion" : currentStep === "SEJOUR" ? "Mon compte volontaire SNU" : null}</div>
        </div>
      )}
    </div>
  ) : (
    <div className="m-4 hidden md:block" />
  );
};

export default Navbar;
