import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { COHESION_STAY_LIMIT_DATE, translate } from "~/../../lib-module";
import EditPen from "../../../assets/icons/EditPen";
import ModalSejour from "../components/ModalSejour";
import { setYoung } from "../../../redux/auth/actions";
import { capture } from "../../../sentry";
import api from "../../../services/api";
import Error from "../../../components/error";
import QuestionMark from "../../../assets/icons/QuestionMarkBlueCircle";
import plausibleEvent from "../../../services/plausible";
import { supportURL } from "../../../config";

export default function StepConfirm() {
  const young = useSelector((state) => state.Auth.young);
  const [modal, setModal] = React.useState({ isOpen: false });
  const [hasHandicap, setHasHandicap] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState({});
  const history = useHistory();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (
      young.handicap ||
      young.allergies ||
      young.ppsBeneficiary ||
      young.paiBeneficiary ||
      young.specificAmenagment ||
      young.reducedMobilityAccess ||
      young.handicapInSameDepartment ||
      young.highSkilledActivity ||
      young.highSkilledActivityInSameDepartment
    ) {
      setHasHandicap(true);
    }
  }, []);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const { ok, code, data: responseData } = await api.put(`/young/inscription2023/confirm`);
      if (!ok) {
        setError({ text: `Une erreur s'est produite`, subText: code ? translate(code) : "" });
        setLoading(false);
        return;
      }
      dispatch(setYoung(responseData));
      plausibleEvent("Phase0/CTA inscription - valider inscription");
      history.push("/inscription2023/attente-consentement");
    } catch (e) {
      capture(e);
      setError({
        text: `Une erreur s'est produite`,
        subText: e?.code ? translate(e.code) : "",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <div className="bg-[#f9f6f2] flex justify-center py-10">
        <div className="bg-white basis-[60%] mx-auto my-0 px-[102px] py-[60px]">
          <div className="p-4 text-[#161616]">
            {error?.text && <Error {...error} onClose={() => setError({})} />}
            <div className="flex items-center justify-between">
              <h1 className="text-[32px] font-bold mt-2 ">Vous y êtes presque...</h1>
              <a href={`${supportURL}/base-de-connaissance/le-volontaire-a-fait-une-erreur-sur-son-dossier`} target="_blank" rel="noreferrer">
                <QuestionMark className="hover:scale-105 cursor-pointer" />
              </a>
            </div>

            <div className="text-[#666666] text-sm mt-2">
              Vous êtes sur le point de soumettre votre dossier à l’administration du SNU. Veuillez vérifier vos informations avant de valider votre demande d’inscription.
            </div>

            <hr className="my-4 h-px bg-gray-200 border-0" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-lg font-bold mt-2 text-[#161616]">Séjour de cohésion :</h1>
                <div className="text-lg font-normal text-[#161616]">{capitalizeFirstLetter(COHESION_STAY_LIMIT_DATE[young.cohort])}</div>
              </div>
              <EditPen className="hover:scale-105 cursor-pointer" onClick={() => setModal({ isOpen: true })} />
            </div>
            <hr className="my-4 h-px bg-gray-200 border-0" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold mt-2 text-[#161616]">Mon profil</h1>
                <EditPen className="hover:scale-105 cursor-pointer" onClick={() => history.push("/inscription2023/coordonnee")} />
              </div>
              <Details title="Pays de naissance" value={young.birthCountry} />
              <Details title="Département de naissance" value={young.birthCityZip} />
              <Details title="Ville de naissance" value={young.birthCity} />
              <Details title="Sexe" value={translate(young.gender)} />
              <Details title="Téléphone" value={young.phone} />
              <Details title="Adresse de résidence" value={young.address} />
              <Details title="Code postal" value={young.zip} />
              <Details title="Ville" value={young.city} />
              {young.foreignAddress && (
                <>
                  <div className="text-[#666666] text-sm text-center">L&apos;adresse affichée ci-dessus est celle de votre hébergeur. Votre adresse à l&apos;étranger :</div>
                  <Details title="Adresse à l'étranger" value={young.foreignAddress} />
                  <Details title="Code postal à l'étranger" value={young.foreignZip} />
                  <Details title="Ville à l'étranger" value={young.foreignCity} />
                  <Details title="Pays à l'étranger" value={young.foreignCity} />
                </>
              )}
              <Details title={young.schooled === "true" ? "Ma situation scolaire" : "Ma situation"} value={translate(young.situation)} />
              {hasHandicap ? (
                <>
                  <Details title="Handicap" value={translate(young.handicap)} />
                  <Details title="Allergies" value={translate(young.allergies)} />
                  <Details title="PPS" value={translate(young.ppsBeneficiary)} />
                  <Details title="PAI" value={translate(young.paiBeneficiary)} />
                  <Details title="Aménagement spécifique" value={translate(young.specificAmenagment)} />
                  <Details title="A besoin d'un aménagement pour mobilité réduite" value={translate(young.reducedMobilityAccess)} />
                  <Details title="Doit être affecté dans son département de résidence" value={translate(young.handicapInSameDepartment)} />
                  <Details title="Activités de haut niveau" value={translate(young.highSkilledActivity)} />
                  <Details title="Doit être affecté dans son département de résidence (activité de haut niveau)" value={translate(young.highSkilledActivityInSameDepartment)} />
                </>
              ) : (
                <Details title="Situation particulière" value="Non" />
              )}
            </div>
            <hr className="my-5 h-px bg-gray-200 border-0" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold mt-2 text-[#161616]">Mes représentants légaux</h1>
                <EditPen className="hover:scale-105 cursor-pointer" onClick={() => history.push("/inscription2023/representants")} />
              </div>
              <Details title="Votre lien" value={translate(young.parent1Status)} />
              <Details title="Son prénom" value={young.parent1FirstName} />
              <Details title="Son nom" value={young.parent1LastName} />
              <Details title="Son e-mail" value={young.parent1Email} />
              <Details title="Son téléphone" value={young.parent1Phone} />
              {young.parent2Status ? (
                <>
                  <hr className="my-2 mx-10 h-px bg-gray-200 border-0" />
                  <Details title="Votre lien" value={translate(young.parent2Status)} />
                  <Details title="Son prénom" value={young.parent2FirstName} />
                  <Details title="Son nom" value={young.parent2LastName} />
                  <Details title="Son e-mail" value={young.parent2Email} />
                  <Details title="Son téléphone" value={young.parent2Phone} />
                </>
              ) : null}
            </div>
            <hr className="my-5 h-px bg-gray-200 border-0" />
            <div className="flex flex-col items-end w-full">
              <div className="flex justify-end space-x-4">
                <div
                  className="flex items-center justify-center py-2 px-4 text-[#000091] border-[1px] border-[#000091] hover:text-white hover:bg-[#000091] "
                  onClick={() => history.push("/inscription2023/documents")}>
                  Précédent
                </div>
                <div>
                  <div
                    disabled={loading}
                    className="flex items-center justify-center px-3 py-2 cursor-pointer bg-[#000091] text-white hover:!text-[#000091] hover:bg-white hover:border hover:border-[#000091]  disabled:bg-[#E5E5E5] disabled:!text-[#929292] disabled:border-0 disabled:cursor-default"
                    onClick={() => !loading && onSubmit()}>
                    Valider mon inscription au SNU
                  </div>
                </div>
              </div>
              <div className="text-[13px]">Je certifie l’exactitude de ces renseignements</div>
            </div>
          </div>
        </div>
      </div>

      <ModalSejour isOpen={modal.isOpen} onCancel={() => setModal({ isOpen: false })} />
    </>
  );
}

function capitalizeFirstLetter(string) {
  if (string) return string.charAt(0).toUpperCase() + string.slice(1);
}

const Details = ({ title, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <div className="text-base text-[#666666] min-w-[90px] mr-4">{`${title} :`}</div>
      <div className="text-base text-[#161616] text-right">{value}</div>
    </div>
  );
};
