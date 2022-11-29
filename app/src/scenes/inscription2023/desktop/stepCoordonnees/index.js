import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toastr } from "react-redux-toastr";
import { useHistory, useParams } from "react-router-dom";
import validator from "validator";

import api from "../../../../services/api";
import { setYoung } from "../../../../redux/auth/actions";
import { translate, regexPhoneFrenchCountries } from "../../../../utils";
import { capture } from "../../../../sentry";
import DesktopPageContainer from "../../components/DesktopPageContainer";
import plausibleEvent from "../../../../services/plausible";
import { supportURL } from "../../../../config";
import { YOUNG_STATUS } from "snu-lib";
import { getCorrectionByStep } from "../../../../utils/navigation";
import {
  FRANCE,
  errorMessages,
  foreignAddressFields,
  moreInformationFields,
  commonFields,
  commonRequiredFields,
  requiredFieldsForeigner,
  requiredMoreInformationFields,
  defaultState,
  getDataFromYoung,
  birthPlaceFields,
  getObjectWithEmptyData,
  addressFields,
} from "./utils";
import Form from "./Form";

export default function StepCoordonnees() {
  const [data, setData] = useState(defaultState);
  const [errors, setErrors] = useState({});
  const [corrections, setCorrections] = useState({});
  const [hasSpecialSituation, setSpecialSituation] = useState(false);
  const [loading, setLoading] = useState(false);

  const young = useSelector((state) => state.Auth.young);
  const dispatch = useDispatch();
  const history = useHistory();
  const { step } = useParams();

  const { frenchNationality, birthCityZip, phone, livesInFrance, addressVerified, address, city, zip, handicap, allergies, ppsBeneficiary, paiBeneficiary, specificAmenagment } =
    data;

  const isFrench = frenchNationality === "true";
  const isFrenchResident = livesInFrance === "true";

  const isVerifyAddressDisabled = !address || !city || !zip;
  const moreInformation = handicap === "true" || ppsBeneficiary === "true" || paiBeneficiary === "true";

  useEffect(() => {
    if (young) {
      if (young.handicap === "true" || young.allergies === "true" || young.ppsBeneficiary === "true" || young.paiBeneficiary === "true") {
        setSpecialSituation(true);
      }
      setData(getDataFromYoung(young, data));
    }
    if (young.status === YOUNG_STATUS.WAITING_CORRECTION) {
      const corrections = getCorrectionByStep(young, step);
      if (!Object.keys(corrections).length) return history.push("/");
      else setCorrections(corrections);
    }
  }, [young]);

  useEffect(() => {
    setErrors(getErrors());
  }, [phone, frenchNationality, birthCityZip, zip, hasSpecialSituation, handicap, allergies, ppsBeneficiary, paiBeneficiary]);

  useEffect(() => {
    if (data._id && !hasSpecialSituation) {
      setData({
        ...data,
        handicap: "false",
        allergies: "false",
        ppsBeneficiary: "false",
        paiBeneficiary: "false",
        specificAmenagment: "",
        specificAmenagmentType: "",
        reducedMobilityAccess: "",
        handicapInSameDepartment: "",
      });
    }
  }, [hasSpecialSituation]);

  useEffect(() => {
    if (data._id && handicap === "false" && ppsBeneficiary === "false" && paiBeneficiary === "false") {
      setData({
        ...data,
        specificAmenagment: "",
        specificAmenagmentType: "",
        reducedMobilityAccess: "",
        handicapInSameDepartment: "",
      });
    }
  }, [handicap, ppsBeneficiary, paiBeneficiary]);

  const updateFrenchNationality = (frenchNationality) => {
    if (frenchNationality === "true") {
      setData({ ...data, ...getObjectWithEmptyData(birthPlaceFields), birthCountry: FRANCE, frenchNationality });
    } else {
      setData({ ...data, ...getObjectWithEmptyData(birthPlaceFields), frenchNationality });
    }
  };

  const updateLivesInFrance = (livesInFrance) => {
    setData({ ...data, ...getObjectWithEmptyData(addressFields), ...getObjectWithEmptyData(foreignAddressFields), livesInFrance });
  };

  const updateData = (key) => (value) => {
    setData({ ...data, [key]: value });
  };

  const updateAddressToVerify = (key) => (value) => {
    setData({ ...data, [key]: value, addressVerified: "false" });
  };

  const onClickBirthCitySuggestion = (birthCity, birthCityZip) => {
    setData({ ...data, birthCity, birthCityZip });
  };

  const onVerifyAddress = (isConfirmed) => (suggestion) => {
    setData({
      ...data,
      addressVerified: "true",
      cityCode: suggestion.cityCode,
      region: suggestion.region,
      department: suggestion.department,
      location: suggestion.location,
      // if the suggestion is not confirmed we keep the address typed by the user
      address: isConfirmed ? suggestion.address : address,
      zip: isConfirmed ? suggestion.zip : zip,
      city: isConfirmed ? suggestion.city : city,
    });
  };

  const getErrors = () => {
    let errors = {};

    if (phone && !validator.matches(phone, regexPhoneFrenchCountries)) {
      errors.phone = errorMessages.phone;
    }

    if (isFrench && birthCityZip && !validator.isPostalCode(birthCityZip, "FR")) {
      errors.birthCityZip = errorMessages.zip;
    }
    if (zip && !validator.isPostalCode(zip, "FR")) {
      errors.zip = errorMessages.zip;
    }

    if (hasSpecialSituation && handicap === "false" && allergies === "false" && ppsBeneficiary === "false" && paiBeneficiary === "false") {
      errors.hasSpecialSituation = errorMessages.hasSpecialSituation;
    }

    if (!addressVerified) {
      errors.addressVerified = errorMessages.addressVerified;
    }

    return errors;
  };

  const onSubmit = (isCorrection) => async () => {
    setLoading(true);
    let errors = {};
    const fieldToUpdate = [...commonFields];
    const requiredFields = [...commonRequiredFields];

    if (!isFrenchResident) {
      fieldToUpdate.push(...foreignAddressFields);
      requiredFields.push(...requiredFieldsForeigner);
    }

    if (addressVerified !== "true") {
      errors.addressVerified = errorMessages.addressVerified;
    }

    if (moreInformation) {
      fieldToUpdate.push(...moreInformationFields);
      requiredFields.push(...requiredMoreInformationFields);
    }

    if (specificAmenagment === "true") {
      fieldToUpdate.push("specificAmenagmentType");
      requiredFields.push("specificAmenagmentType");
    }

    for (const key of requiredFields) {
      if (data[key] === undefined || data[key] === "") {
        errors[key] = "Ce champ est obligatoire";
      }
    }

    errors = { ...errors, ...getErrors() };

    setErrors(errors);

    if (!Object.keys(errors).length) {
      const updates = {};
      fieldToUpdate.forEach((field) => {
        updates[field] = data[field];
      });

      updates.country = FRANCE;
      updates.moreInformation = moreInformation.toString();

      try {
        const { ok, code, data: responseData } = await api.put(`/young/inscription2023/coordinates/${isCorrection ? "correction" : "next"}`, updates);
        if (!ok) {
          setErrors({ text: `Une erreur s'est produite`, subText: code ? translate(code) : "" });
          setLoading(false);
          return;
        }
        dispatch(setYoung(responseData));
        plausibleEvent(isCorrection ? "Phase0/CTA demande correction - Corriger Coordonnees" : "Phase0/CTA inscription - profil");
        history.push(isCorrection ? "/" : "/inscription2023/consentement");
      } catch (e) {
        capture(e);
        toastr.error("Une erreur s'est produite :", translate(e.code));
      }
    } else {
      toastr.error("Merci de corriger les erreurs", "");
    }
    setLoading(false);
  };

  const onSave = async () => {
    setLoading(true);

    const fieldToUpdate = [...commonFields];
    if (!isFrenchResident) {
      fieldToUpdate.push(...foreignAddressFields);
    }

    if (moreInformation) {
      fieldToUpdate.push(...moreInformationFields);
    }

    if (moreInformation && specificAmenagment === "true") {
      fieldToUpdate.push("specificAmenagmentType");
    }

    const updates = {};

    fieldToUpdate.forEach((field) => {
      updates[field] = data[field];
    });

    updates.country = FRANCE;
    updates.moreInformation = moreInformation.toString();

    try {
      const { ok, code, data: responseData } = await api.put("/young/inscription2023/coordinates/save", updates);
      if (!ok) {
        setErrors({ text: `Une erreur s'est produite`, subText: code ? translate(code) : "" });
        setLoading(false);
        return;
      }
      toastr.success("Vos modifications ont bien été enregistrees !", "");
      dispatch(setYoung(responseData));
    } catch (e) {
      capture(e);
      toastr.error("Une erreur s'est produite :", translate(e.code));
    }
  };

  return (
    <DesktopPageContainer
      title="Mon profil volontaire"
      onSave={onSave}
      onSubmit={onSubmit()}
      onClickPrevious={() => (young.status === YOUNG_STATUS.WAITING_CORRECTION ? history.push("/") : null)}
      modeCorrection={young.status === YOUNG_STATUS.WAITING_CORRECTION}
      childrenContinueButton={young.status === YOUNG_STATUS.WAITING_CORRECTION ? "Corriger" : "Continuer"}
      onCorrection={onSubmit(true)}
      disabled={loading}
      questionMarckLink={`${supportURL}/base-de-connaissance/je-minscris-et-remplis-mon-profil`}>
      <Form
        data={{ data, setData }}
        errors={errors}
        corrections={corrections}
        specialSituation={{ hasSpecialSituation, setSpecialSituation }}
        updates={{ updateData, updateFrenchNationality, updateLivesInFrance, updateAddressToVerify, onClickBirthCitySuggestion, onVerifyAddress }}
        helpers={{ isFrench, isFrenchResident, isVerifyAddressDisabled, moreInformation }}
      />
    </DesktopPageContainer>
  );
}
