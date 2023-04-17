import React, { useEffect } from "react";
import { toastr } from "react-redux-toastr";
import { useHistory, useParams } from "react-router-dom";
import validator from "validator";
import dayjs from "dayjs";
import IconFrance from "../../../../assets/IconFrance";
import QuestionMarkBlueCircle from "../../../../assets/icons/QuestionMarkBlueCircle";
import CheckBox from "../../../../components/inscription/checkbox";
import Toggle from "../../../../components/inscription/toggle";
import plausibleEvent from "../../../../services/plausible";
import { getCorrectionByStep } from "../../../../utils/navigation";
import SchoolInFrance from "../../../inscription2023/components/ShoolInFrance";
import SchoolOutOfFrance from "../../../inscription2023/components/ShoolOutOfFrance";
import Input from "../../components/Input";
import Select from "../../components/Select";

import { useDispatch, useSelector } from "react-redux";
import { YOUNG_STATUS } from "snu-lib";
import { setYoung } from "../../../../redux/auth/actions";
import { capture } from "../../../../sentry";
import api from "../../../../services/api";
import { translate } from "../../../../utils";
import DatePickerList from "../../components/DatePickerList";

import ModalSejourCorrection from "../../components/ModalSejourCorrection";

export default function StepEligibilite() {
  const [data, setData] = React.useState({});
  const young = useSelector((state) => state.Auth.young);
  const dispatch = useDispatch();
  const [error, setError] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [toggleVerify, setToggleVerify] = React.useState(false);
  const [modal, setModal] = React.useState({ isOpen: false });

  const [corrections, setCorrections] = React.useState({});

  const { step } = useParams();

  const history = useHistory();

  useEffect(() => {
    if (!young) return;
    if (young.status === YOUNG_STATUS.WAITING_CORRECTION) {
      const corrections = getCorrectionByStep(young, step);
      if (!Object.keys(corrections).length) return history.push("/");
      else setCorrections(corrections);
    }
    setData({
      frenchNationality: young.frenchNationality,
      birthDate: new Date(young.birthdateAt),
      school: young.schooled
        ? {
            fullName: young.schoolName,
            type: young.schoolType,
            adresse: young.schoolAddress,
            codeCity: young.schoolZip,
            city: young.schoolCity,
            departmentName: young.schoolDepartment,
            region: young.schoolRegion,
            country: young.schoolCountry,
            id: young.schoolId,
            postCode: young.schoolZip,
          }
        : null,
      scolarity: young.grade,
      zip: young.zip,
    });
  }, [young]);

  const optionsScolarite = [
    { value: "NOT_SCOLARISE", label: "Non scolarisé(e)" },
    { value: "4eme", label: "4ème" },
    { value: "3eme", label: "3ème" },
    { value: "2ndePro", label: "2de professionnelle" },
    { value: "2ndeGT", label: "2de générale et technologique" },
    { value: "1erePro", label: "1ère professionnelle" },
    { value: "1ereGT", label: "1ère générale et technologique" },
    { value: "TermPro", label: "Terminale professionnelle" },
    { value: "TermGT", label: "Terminale générale et technologique" },
    { value: "CAP", label: "CAP" },
    { value: "Autre", label: "Scolarisé(e) (autre niveau)" },
  ];

  const onSubmit = async () => {
    let errors = {};

    // Nationality
    if (!data?.frenchNationality) {
      errors.frenchNationality = "Vous devez être français";
    }
    // Scolarity
    if (!data?.scolarity) {
      errors.scolarity = "Choisissez un niveau de scolarité";
    }
    // Birthdate
    // ? Check age ?
    if (!data?.birthDate) {
      errors.birthDate = "Vous devez choisir une date de naissance";
    }

    if (data.scolarity) {
      if (data.scolarity === "NOT_SCOLARISE") {
        // Zip du jeune
        // ! Vérifie que ça a la bouille d'un zipcode mais ds les faits, on peut mettre nimp en 5 chiffres
        if (!data?.isAbroad && !(data?.zip && validator.isPostalCode(data?.zip, "FR"))) {
          errors.zip = "Vous devez sélectionner un code postal";
        }
      } else {
        // School
        if (!data?.school) {
          // Permet de rentrer dans la gestion d'erreur et ne pas valider le formulaire
          errors.school = "Vous devez renseigner complètement votre établissement scolaire";
        }
      }
    }

    setError(errors);
    setToggleVerify(!toggleVerify);

    // ! Gestion erreur a reprendre
    if (Object.keys(errors).length) {
      console.warn("Pb avec ce champ : " + Object.keys(errors)[0] + " pour la raison : " + Object.values(errors)[0]);
      toastr.error("Un problème est survenu : Vérifiez que vous avez rempli tous les champs");
      return;
    }

    setLoading(true);
    plausibleEvent("Phase0/CTA demande correction - Corriger Eligibilite");

    const updates = {
      grade: data.scolarity,
      schooled: data.school ? "true" : "false",
      schoolName: data.school?.fullName,
      schoolType: data.school?.type,
      schoolAddress: data.school?.address || data.school?.adresse,
      schoolZip: data.school?.postCode || data.school?.postcode,
      schoolCity: data.school?.city,
      schoolDepartment: data.school?.departmentName || data.school?.department,
      schoolRegion: data.school?.region,
      schoolCountry: data.school?.country,
      schoolId: data.school?.id,
      zip: data.zip,
      birthdateAt: dayjs(data.birthDate).locale("fr").format("YYYY-MM-DD"),
    };

    try {
      const updatedYoung = { ...young, updates };
      const res = await api.post("/cohort-session/eligibility/2023", updatedYoung);
      if (!res.ok) throw new Error(translate(res.code));

      const cohorts = res.data.length > 0 ? res.data : null;

      if (res.data.msg || !cohorts) {
        let res = await api.put("/young/inscription2023/noneligible");
        if (!res.ok) throw new Error(translate(res.code));

        res = await api.put("/young/inscription2023/eligibilite", updates);
        if (!res.ok) throw new Error(translate(res.code));

        dispatch(setYoung(res.data));
        return history.push("/noneligible");
      }

      updates.sessions = cohorts;

      if (cohorts.some((c) => young.cohort === c.name)) {
        const res = await api.put("/young/inscription2023/eligibilite", updates);
        if (!res.ok) throw new Error(translate(res.code));

        dispatch(setYoung(res.data));
        toastr.success("La correction a été prise en compte");
        history.push("/");
      } else {
        setModal({ data: updates, isOpen: true, onValidation });
      }
    } catch (e) {
      setLoading(false);
      capture(e);
      toastr.error("Une erreur s'est produite :", translate(e.code));
    }
  };

  const onValidation = async (updates, cohort) => {
    try {
      const res = await api.put("/young/inscription2023/eligibilite", updates);
      if (!res.ok) throw new Error(translate(code));

      const { ok, code, data: responseData } = await api.put(`/young/inscription2023/changeCohort`, { cohort });
      if (!ok) throw new Error(translate(code));
      dispatch(setYoung(responseData));
      toastr.success("La correction a été prise en compte");
      history.push("/");
    } catch (e) {
      setLoading(false);
      capture(e);
      toastr.error("Une erreur s'est produite :", translate(e.code));
    }
  };

  return (
    <>
      <div className="flex justify-center bg-[#f9f6f2] py-10">
        <div className="mx-auto my-0 basis-[70%] bg-white px-[102px] py-[60px] drop-shadow-md">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-xl text-[#161616]">Vérifiez votre éligibilité au SNU</h1>
            <a href="/public-besoin-d-aide/" target="_blank" rel="noreferrer">
              <QuestionMarkBlueCircle />
            </a>
          </div>
          <hr className="my-8 h-px border-0 bg-gray-200" />
          <div className="flex flex-col gap-5">
            <div className="flex-start flex flex-col">
              <div className="flex items-center">
                <CheckBox disabled={true} checked={data.frenchNationality === "true"} onChange={(e) => setData({ ...data, frenchNationality: e ? "true" : "false" })} />
                <div className="flex items-center backdrop-opacity-100">
                  <span className="ml-4 mr-2 text-[#929292]">Je suis de nationalité française</span>
                  <IconFrance />
                </div>
              </div>
              {error.frenchNationality ? <span className="text-sm text-red-500">{error.frenchNationality}</span> : null}
            </div>
            <div className="flex w-full space-x-4">
              <div className="w-1/2">
                <Select
                  label="Niveau de scolarité"
                  value={data.scolarity}
                  options={optionsScolarite}
                  onChange={(value) => {
                    setData({ ...data, scolarity: value, school: value === "NOT_SCOLARISE" ? null : data.school });
                  }}
                  error={error.scolarity}
                  correction={corrections.grade}
                />
              </div>
              <div className="w-1/2">
                <DatePickerList
                  label="Date de naissance"
                  value={data.birthDate}
                  onChange={(date) => setData({ ...data, birthDate: new Date(date) })}
                  error={error.birthDate}
                  correction={corrections.birthdateAt}
                />
              </div>
            </div>
            {data.scolarity && (
              <>
                <div className="flex items-center justify-between">
                  <p>
                    <div>
                      <span className="font-bold">{data.scolarity === "NOT_SCOLARISE" ? "Je réside" : "Mon établissement scolaire est"}</span> en France
                    </div>
                    <div className="flex h-5 items-center">
                      <span className="text-xs leading-5 text-[#666666]">Métropolitaine ou Outre-mer</span>
                    </div>
                  </p>

                  <Toggle onClick={() => setData({ ...data, isAbroad: !data.isAbroad, zip: data.isAbroad ? null : data.zip })} toggled={!data.isAbroad} />
                </div>

                {data.scolarity !== "NOT_SCOLARISE" ? (
                  data.isAbroad ? (
                    <>
                      <SchoolOutOfFrance
                        school={data.school}
                        onSelectSchool={(school) => setData({ ...data, school: school })}
                        toggleVerify={toggleVerify}
                        corrections={corrections}
                      />
                    </>
                  ) : (
                    <>
                      <SchoolInFrance
                        school={data.school}
                        onSelectSchool={(school) => setData({ ...data, school: school })}
                        toggleVerify={toggleVerify}
                        corrections={corrections}
                      />
                    </>
                  )
                ) : !data.isAbroad ? (
                  <Input value={data.lastName} onChange={(e) => setData({ ...data, zip: e })} label="Code Postal" error={error.zip} correction={corrections.zip} />
                ) : null}
              </>
            )}
            <div className="flex justify-end gap-4">
              <button
                className="flex w-1/3 cursor-pointer items-center justify-center bg-[#000091] px-3 py-2 text-white hover:border hover:border-[#000091] hover:bg-white hover:!text-[#000091]"
                onClick={() => onSubmit()}
                disabled={loading}
              >
                Corriger
              </button>
            </div>
          </div>
        </div>
      </div>
      <ModalSejourCorrection data={modal?.data} isOpen={modal.isOpen} onCancel={() => setModal({ isOpen: false })} onValidation={modal?.onValidation} />
    </>
  );
}
