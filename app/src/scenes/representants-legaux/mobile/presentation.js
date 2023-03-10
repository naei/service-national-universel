import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { COHESION_STAY_LIMIT_DATE } from "snu-lib/constants";
import CalendarBig from "../../../assets/icons/CalendarBig";
import CheckCircleStroke from "../../../assets/icons/CheckCircleStroke";
import LinkTo from "../../../assets/icons/LinkTo";
import Footer from "../../../components/footerV2";
import Loader from "../../../components/Loader";
import { RepresentantsLegauxContext } from "../../../context/RepresentantsLegauxContextProvider";
import { isReturningParent } from "../commons";
import { BorderButton } from "../components/Buttons";
import Navbar from "../components/Navbar";

export default function Presentation({ step, parentId }) {
  const history = useHistory();
  const { young, token } = useContext(RepresentantsLegauxContext);

  useEffect(() => {
    if (young) {
      if (isReturningParent(young, parentId)) {
        const route = parentId === 2 ? "done-parent2" : "done";
        history.push(`/representants-legaux/${route}?token=${token}`);
      }
    }
  }, [young]);

  if (!young) return <Loader />;

  const translateNonNecessary = (status) => {
    if (status === "NOT_ELIGIBLE") return "est non éligible";
    if (status === "ABANDONED") return "a abandonné son inscription";
    if (status === "REFUSED") return "est refusé";
  };

  const sejourDate = COHESION_STAY_LIMIT_DATE[young.cohort];

  function onSubmit() {
    const route = parentId === 2 ? "verification-parent2" : "verification";
    history.push(`/representants-legaux/${route}?token=${token}`);
  }
  if (["NOT_ELIGIBLE", "ABANDONED", "REFUSED"].includes(young.status))
    return (
      <>
        <div className="bg-white p-4 text-[#161616]">
          <div className="flex flex-col gap-4">
            <h1 className="text-[22px] font-bold">Votre accord n&apos;est plus requis</h1>
            <div>Le jeune dont vous êtes représentant légal {translateNonNecessary(young.status)} au SNU. Votre accord n&apos;est plus requis.</div>
          </div>
        </div>
        <Footer marginBottom="mb-[135px]" />
      </>
    );
  return (
    <>
      <Navbar step={step} />
      <div className="bg-white p-4 text-[#161616]">
        <div className="flex flex-col gap-4">
          <h1 className="text-[22px] font-bold">
            {parentId === 2 ? <>{young.firstName} s&apos;est inscrit(e) au SNU&nbsp;!</> : <>{young.firstName} souhaite s&apos;inscrire au SNU&nbsp;!</>}
          </h1>
          <p className="text-sm text-[#161616] mb-8">
            {parentId === 2 ? (
              <>Nous avons besoin de votre consentement au droit à l’image.</>
            ) : (
              <>Nous avons besoin de votre accord pour que {young.firstName} vive l’aventure du SNU.</>
            )}
          </p>
          <BorderButton href="https://www.snu.gouv.fr/" target="_blank" rel="noreferrer">
            Découvrir le SNU <LinkTo className="ml-2" />
          </BorderButton>

          <div className="flex flex-col p-4 bg-[#fbfbfb]">
            <ul>
              <li className="flex items-center mb-4 text-sm font-medium">
                <CheckCircleStroke stroke="#979FAA" className="mr-2 flex-shrink-0" />
                Dispositif financé par l&apos;Etat
              </li>
              <li className="flex items-center mb-4 text-sm font-medium">
                <CheckCircleStroke stroke="#D1D5DB" className="mr-2 flex-shrink-0" />
                80 000 jeunes déjà engagés
              </li>
              <li className="flex items-center mb-4 text-sm font-medium">
                <CheckCircleStroke stroke="#979FAA" className="mr-2 flex-shrink-0" />
                Renforcement de la cohésion nationale en développant une culture de l&apos;engagement
              </li>
              <li className="flex items-center mb-4 text-sm font-medium">
                <CheckCircleStroke stroke="#D1D5DB" className="mr-2 flex-shrink-0" />
                Mixité sociale et territoriale
              </li>
              <li className="flex items-center text-[14px] font-medium">
                <CheckCircleStroke stroke="#979FAA" className="mr-2 flex-shrink-0" />
                Accompagnement à l&apos;insertion sociale et professionnelle
              </li>
            </ul>
          </div>
          <div className="flex flex-col p-4 bg-[#fbfbfb]">
            <h2 className="text-[19px] font-bold mb-1.5 mt-0">Première étape</h2>
            <p className="text-sm font-bold">Le séjour de cohésion : 2 semaines dans un autre département</p>
            <div className="flex flex-col items-center justify-center py-9">
              <div className="relative ">
                <CalendarBig />
                <CheckCircleStroke stroke="#E1000F" className="absolute bottom-[-5px] right-[-5px] w-[21px] h-[21px]" />
              </div>
              {sejourDate && (
                <p className="text-[15px] font-400 leading-[19px] mt-3 text-center">
                  {young.firstName} a choisi le séjour <br />
                  <span className="font-bold">{sejourDate}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 w-full z-50">
        <div className="flex flex-col shadow-ninaInverted p-4 bg-white gap-2">
          <button className="flex items-center justify-center p-2 w-full cursor-pointer bg-[#000091] text-white" onClick={onSubmit}>
            Continuer vers la vérification
          </button>
          <div className="text-[13px] text-[#161616] text-center">
            Votre consentement ne sera recueilli qu’à la <b>troisième étape</b> de ce formulaire
          </div>
        </div>
      </div>
      <Footer marginBottom="mb-[135px]" />
    </>
  );
}
