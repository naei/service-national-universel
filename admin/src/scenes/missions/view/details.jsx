import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import ReactSelect from "react-select";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import validator from "validator";
import InfoMessage from "../../dashboardV2/components/ui/InfoMessage";
import InfoCircleMission from "../../../assets/icons/InfoCircleMission";

import {
  translate,
  ROLES,
  MISSION_DOMAINS,
  PERIOD,
  MISSION_PERIOD_DURING_HOLIDAYS,
  MISSION_PERIOD_DURING_SCHOOL,
  ES_NO_LIMIT,
  regexPhoneFrenchCountries,
  SENDINBLUE_TEMPLATES,
} from "../../../utils";
import MissionView from "./wrapper";
import Pencil from "../../../assets/icons/Pencil";
import Field from "../components/Field";
import VerifyAddress from "../../phase0/components/VerifyAddress";
import Toggle from "../../../components/Toggle";

import ModalConfirm from "../../../components/modals/ModalConfirm";

import api from "../../../services/api";
import { toastr } from "react-redux-toastr";
import { adminURL } from "../../../config";
import ExternalLink from "../../../assets/icons/ExternalLink";
import { MISSION_STATUS } from "snu-lib";
import ViewStructureLink from "../../../components/buttons/ViewStructureLink";

export default function DetailsView({ mission, setMission, getMission }) {
  const [values, setValues] = useState(mission);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [referents, setReferents] = useState([]);
  const [creationTutor, setCreationTutor] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);

  const [editingBottom, setEdittingBottom] = useState(false);
  const [loadingBottom, setLoadingBottom] = useState(false);
  const [errorsBottom, setErrorsBottom] = useState({});

  const [newTutor, setNewTutor] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  const [modalConfirmation, setModalConfirmation] = useState(false);

  const thresholdPendingReached = mission.pendingApplications > 0 && mission.pendingApplications >= mission.placesLeft * 5;
  const valuesToCheck =
    mission?.isJvaMission === "true"
      ? ["name", "structureName", "description", "actions", "format"]
      : ["name", "structureName", "mainDomain", "address", "zip", "city", "description", "actions", "format", "tutorId"];
  const valuesToUpdate = [
    ...valuesToCheck,
    "structureId",
    "addressVerified",
    "duration",
    "contraintes",
    "domains",
    "hebergement",
    "hebergementPayant",
    "tutor",
    "visibility",
    "region",
    "department",
    "location",
  ];

  const history = useHistory();

  const referentSelectRef = useRef();

  async function initReferents() {
    const body = { query: { bool: { must: { match_all: {} }, filter: [{ term: { "structureId.keyword": values.structureId } }] } }, size: ES_NO_LIMIT };
    const { responses } = await api.esQuery("referent", body);
    if (responses?.length) {
      const responseReferents = responses[0].hits.hits.map((hit) => ({ label: hit._source.firstName + " " + hit._source.lastName, value: hit._id, tutor: hit._source }));
      if (!responseReferents.find((ref) => ref.value === values.tutorId)) {
        if (referentSelectRef.current?.select?.select) referentSelectRef.current.select.select.setValue("");
        setValues({ ...values, tutorId: "" });
      }
      setReferents(responseReferents);
    }
  }

  useEffect(() => {
    initReferents();
  }, [values.structureId]);

  const fetchStructures = async (inputValue) => {
    const body = {
      query: { bool: { must: [] } },
      size: 50,
      track_total_hits: true,
    };
    if (inputValue) {
      body.query.bool.must.push({
        bool: {
          should: [
            {
              multi_match: {
                query: inputValue,
                fields: ["name", "address", "city", "zip", "department", "region", "code2022", "centerDesignation"],
                type: "cross_fields",
                operator: "and",
              },
            },
            {
              multi_match: {
                query: inputValue,
                fields: ["name", "address", "city", "zip", "department", "region", "code2022", "centerDesignation"],
                type: "phrase",
                operator: "and",
              },
            },
            {
              multi_match: {
                query: inputValue,
                fields: ["name", "address", "city", "zip", "department", "region", "code2022", "centerDesignation"],
                type: "phrase_prefix",
                operator: "and",
              },
            },
          ],
          minimum_should_match: "1",
        },
      });
    }
    const { responses } = await api.esQuery("structure", body);
    return responses[0].hits.hits.map((hit) => {
      return { value: hit._source, _id: hit._id, label: hit._source.name, structure: hit._source };
    });
  };

  const onSubmit = () => {
    setLoading(true);
    const error = {};
    const baseError = "Ce champ est obligatoire";
    valuesToCheck.map((val) => {
      if (!values[val]) error[val] = baseError;
    });
    if (mission?.isJvaMission === "false" && !values.addressVerified) error.addressVerified = "L'adresse doit être vérifiée";
    //check duration only if specified
    if (values.duration && isNaN(values.duration)) error.duration = "Le format est incorrect";
    if (!error.tutorId && !referents.find((ref) => ref.value === values.tutorId)) error.tutorId = "Erreur";

    setErrors(error);
    if (Object.keys(error).length > 0) {
      toastr.error("Oups, le formulaire est incomplet");
      return setLoading(false);
    }

    // open modal to confirm is mission has to change status
    if ((values.description !== mission.description || values.actions !== mission.actions) && mission.status !== "WAITING_VALIDATION") return setModalConfirmation(true);
    updateMission(valuesToUpdate);
  };

  useEffect(() => {
    if (values.period.length === 0 || (values.period.length === 1 && values.period[0] === "WHENEVER")) {
      setValues({ ...values, subPeriod: [] });
    }
  }, [values.period]);

  const onSubmitBottom = () => {
    setLoadingBottom(true);
    const error = {};
    if (values.startAt < new Date()) error.startAt = "La date est incorrect";
    if (values.startAt > values.endAt) error.endAt = "La date de fin est incorrect";
    if (values.placesTotal === "" || isNaN(values.placesTotal) || values.placesTotal < 0) error.placesTotal = "Le nombre de places est incorrect";
    if (values.placesTotal < mission.placesTotal && mission.placesLeft - (mission.placesTotal - values.placesTotal) < 0)
      error.placesTotal = "Il y a plus de candidatures que de places";

    setErrorsBottom(error);
    if (Object.keys(error).length > 0) {
      toastr.error("Oups, le formulaire est incomplet");
      return setLoadingBottom(false);
    }
    updateMission(["startAt", "endAt", "placesTotal", "frequence", "period", "subPeriod"]);
  };

  const updateMission = async (valuesToUpdate) => {
    try {
      // build object from array of keys
      const valuesToSend = valuesToUpdate.reduce((o, key) => ({ ...o, [key]: values[key] }), {});
      if (valuesToSend.addressVerified) valuesToSend.addressVerified = valuesToSend.addressVerified.toString();
      const { ok, code, data: missionReturned } = await api.put(`/mission/${values._id}`, valuesToSend);
      if (!ok) {
        toastr.error("Oups, une erreur est survenue lors de l'enregistrement de la mission", translate(code));
        setLoadingBottom(false);
        return setLoading(false);
      }
      toastr.success("Mission enregistrée");
      setLoading(false);
      setLoadingBottom(false);
      setEdittingBottom(false);
      setEditing(false);
      setValues(missionReturned);
      setMission(missionReturned);
    } catch (e) {
      setLoading(false);
      setLoadingBottom(false);
      return toastr.error("Oups, une erreur est survenue lors de l'enregistrement de la mission");
    }
  };

  const mainDomainsOption = Object.keys(MISSION_DOMAINS).map((d) => {
    return { value: d, label: translate(d) };
  });

  const onVerifyAddress = (isConfirmed) => (suggestion) => {
    setValues({
      ...values,
      addressVerified: true,
      region: suggestion.region,
      department: suggestion.department,
      location: suggestion.location,
      address: isConfirmed ? suggestion.address : values.address,
      zip: isConfirmed ? suggestion.zip : values.zip,
      city: isConfirmed ? suggestion.city : values.city,
    });
  };

  const formatOptions = [
    { value: "CONTINUOUS", label: translate("CONTINUOUS") },
    { value: "DISCONTINUOUS", label: translate("DISCONTINUOUS") },
  ];
  const sendInvitation = async () => {
    try {
      let error = {};
      if (!newTutor.firstName) error.firstName = "Ce champ est obligatoire";
      if (!newTutor.lastName) error.lastName = "Ce champ est obligatoire";
      if (!validator.isEmail(newTutor.email)) error.email = "L'email est incorrect";
      if (!newTutor.phone) error.phone = "Ce champ est obligatoire";
      if (!validator.matches(newTutor.phone, regexPhoneFrenchCountries)) error.phone = "Le numéro de téléphone est au mauvais format. Format attendu : 06XXXXXXXX ou +33XXXXXXXX";
      setErrors(error);
      if (Object.keys(error).length > 0) return setLoading(false);

      newTutor.structureId = values.structureId;
      newTutor.structureName = values.structureName;
      if (selectedStructure?.isNetwork === "true") {
        newTutor.role = ROLES.SUPERVISOR;
      } else {
        newTutor.role = ROLES.RESPONSIBLE;
      }
      const { ok, code } = await api.post(`/referent/signup_invite/${SENDINBLUE_TEMPLATES.invitationReferent.NEW_STRUCTURE_MEMBER}`, newTutor);
      if (!ok) toastr.error("Oups, une erreur est survenue lors de l'ajout du nouveau membre", translate(code));
      setNewTutor({ firstName: "", lastName: "", email: "", phone: "" });
      setCreationTutor(false);
      initReferents();
      return toastr.success("Invitation envoyée");
    } catch (e) {
      if (e.code === "USER_ALREADY_REGISTERED")
        return toastr.error("Cette adresse email est déjà utilisée.", `${newTutor.email} a déjà un compte sur cette plateforme.`, { timeOut: 10000 });
      toastr.error("Oups, une erreur est survenue lors de l'ajout du nouveau membre", translate(e));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
      <ModalConfirm
        isOpen={modalConfirmation}
        title={"Modification de statut"}
        message={"Êtes-vous sûr(e) de vouloir continuer ? Certaines modifications entraîneront une modification du statut de la mission : En attente de validation."}
        onCancel={() => {
          setModalConfirmation(false);
          setLoading(false);
        }}
        onConfirm={() => {
          setModalConfirmation(false);
          updateMission(valuesToUpdate);
        }}
      />
      <MissionView mission={mission} getMission={getMission} tab="details">
        {(editing || editingBottom) && mission?.isJvaMission === "true" ? (
          <div className="mb-2.5 rounded-lg bg-violet-100 p-4 text-center text-base text-indigo-800">
            Les informations grisées sont à modifier par le responsable de la structure depuis son espace{" "}
            <a target="_blank" rel="noreferrer" href="https://www.jeveuxaider.gouv.fr/">
              jeveuxaider.gouv.fr
            </a>
          </div>
        ) : null}
        {mission.status === MISSION_STATUS.WAITING_VALIDATION ? (
          <InfoMessage
            bg="bg-blue-700"
            Icon={InfoCircleMission}
            message="La mission est en attente de validation. Son contenu va être vérifié par un référent SNU du département dans lequel se déroulera la mission dans les jours à venir."
          />
        ) : null}
        <div className="mb-8 rounded-xl bg-white pt-2 mt-8">
          <div className="flex flex-col rounded-xl bg-white px-8 pb-12">
            <div className="my-4 flex items-center justify-between">
              <div className="flex w-full flex-1 flex-row items-center justify-start gap-4">
                <div className="text-lg font-medium text-gray-900">Informations générales</div>
                {mission.status === "VALIDATED" && (
                  <div className="flex flex-row items-center justify-center gap-2">
                    <Toggle
                      id="visibility"
                      name="visibility"
                      disabled={!editing}
                      value={!thresholdPendingReached && values.visibility === "VISIBLE"}
                      onChange={(e) => {
                        setValues({ ...values, visibility: e ? "VISIBLE" : "HIDDEN" });
                      }}
                    />
                    <div>
                      <span>
                        La mission est <strong>{!thresholdPendingReached && values.visibility === "VISIBLE" ? "ouverte" : "fermée"}</strong> aux candidatures
                      </span>
                      {thresholdPendingReached && (
                        <span>
                          <strong>&nbsp; &#183;</strong> Vous avez atteint le seuil des&nbsp;
                          <span className="cursor-pointer text-blue-600 underline" onClick={() => history.push(`/mission/${mission._id}/youngs`)}>
                            candidatures à traiter
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {mission.status !== MISSION_STATUS.ARCHIVED && (
                <>
                  {!editing ? (
                    <button
                      className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] border-blue-100 bg-blue-100 px-3 py-2 text-xs font-medium leading-5 text-blue-600 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setEditing(true)}
                      disabled={loading}>
                      <Pencil stroke="#2563EB" className="h-[12px] w-[12px]" />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] border-gray-100 bg-gray-100 px-3 py-2 text-xs font-medium leading-5 text-gray-700 hover:border-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          setEditing(false);
                          setValues({ ...mission });
                          setErrors({});
                        }}
                        disabled={loading}>
                        Annuler
                      </button>
                      <button
                        className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] border-blue-100 bg-blue-100 px-3 py-2 text-xs font-medium leading-5 text-blue-600 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={onSubmit}
                        disabled={loading}>
                        <Pencil stroke="#2563EB" className="mr-[6px] h-[12px] w-[12px]" />
                        Enregistrer les changements
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-14">
              <div className="flex min-w-[350px] flex-1 flex-col gap-4">
                <div>
                  <div className="mb-2 text-xs font-medium">
                    Donnez un nom à votre mission. Privilégiez une phrase précisant l&apos;action du volontaire. Ex : « Je fais les courses de produits pour mes voisins les plus
                    fragiles »
                  </div>
                  <Field
                    name="name"
                    errors={errors}
                    readOnly={!editing}
                    handleChange={(e) => setValues({ ...values, name: e.target.value })}
                    label="Nom de la mission"
                    value={values.name}
                  />
                </div>
                <div className="mt-4">
                  <div className="mb-2 text-xs font-medium">Structure rattachée</div>
                  <AsyncSelect
                    label="Structure"
                    value={{ label: values.structureName }}
                    loadOptions={fetchStructures}
                    isDisabled={!editing}
                    noOptionsMessage={() => "Aucune structure ne correspond à cette recherche"}
                    styles={{
                      dropdownIndicator: (styles, { isDisabled }) => ({ ...styles, display: isDisabled ? "none" : "flex" }),
                      placeholder: (styles) => ({ ...styles, color: "black" }),
                      control: (styles, { isDisabled }) => ({ ...styles, borderColor: "#D1D5DB", backgroundColor: isDisabled ? "white" : "white" }),
                      singleValue: (styles) => ({ ...styles, color: "black" }),
                      multiValueRemove: (styles, { isDisabled }) => ({ ...styles, display: isDisabled ? "none" : "flex" }),
                      indicatorsContainer: (provided, { isDisabled }) => ({ ...provided, display: isDisabled ? "none" : "flex" }),
                    }}
                    defaultOptions
                    onChange={(e) => {
                      setValues({ ...values, structureName: e.label, structureId: e._id });
                      setSelectedStructure(e.structure);
                    }}
                    placeholder="Rechercher une structure"
                    error={errors.structureName}
                  />
                  {values.structureName && <ViewStructureLink structureId={values.structureId} />}
                </div>
                <div className="mt-4">
                  <div className="mb-2 text-xs font-medium">Domaine d&apos;action principal</div>
                  <CustomSelect
                    readOnly={!editing}
                    isJvaMission={mission?.isJvaMission === "true"}
                    noOptionsMessage={"Aucun domaine ne correspond à cette recherche"}
                    options={mainDomainsOption}
                    placeholder={"Sélectionnez un domaine principal"}
                    onChange={(e) => {
                      setValues({ ...values, mainDomain: e.value, domains: values.domains.filter((d) => d !== e.value) });
                    }}
                    value={values.mainDomain}
                  />
                  <div className="my-2 flex flex-row text-xs font-medium">
                    <div>Domaine(s) d&apos;action secondaire(s)</div>
                    <div className="text-gray-400">&nbsp;(facultatif)</div>
                  </div>
                  <CustomSelect
                    readOnly={!editing}
                    isMulti
                    options={mainDomainsOption.filter((d) => d.value !== values.mainDomain)}
                    noOptionsMessage={"Aucun domaine ne correspond à cette recherche"}
                    placeholder={"Sélectionnez un ou plusieurs domaines"}
                    onChange={(e) => {
                      setValues({ ...values, domains: e });
                    }}
                    value={[...values.domains]}
                  />
                </div>
                <div>
                  <div className="mt-8 mb-4 text-lg font-medium text-gray-900">Lieu où se déroule la mission</div>
                  <div className="mb-2 text-xs font-medium">Adresse</div>
                  <Field
                    errors={errors}
                    readOnly={!editing}
                    isJvaMission={mission?.isJvaMission === "true"}
                    label="Adresse"
                    name="address"
                    handleChange={(e) => {
                      setValues({ ...values, address: e.target.value, addressVerified: false });
                    }}
                    value={values.address}
                    error={errors?.address}
                  />
                  <div className="my-4 flex flex-row justify-between gap-3">
                    <Field
                      errors={errors}
                      readOnly={!editing}
                      isJvaMission={mission?.isJvaMission === "true"}
                      label="Code postal"
                      className="w-[50%]"
                      name="zip"
                      handleChange={(e) => setValues({ ...values, zip: e.target.value, addressVerified: false })}
                      value={values.zip}
                      error={errors?.zip}
                    />
                    <Field
                      errors={errors}
                      readOnly={!editing}
                      isJvaMission={mission?.isJvaMission === "true"}
                      label="Ville"
                      name="city"
                      className="w-[50%]"
                      handleChange={(e) => setValues({ ...values, city: e.target.value, addressVerified: false })}
                      value={values.city}
                      error={errors?.city}
                    />
                  </div>
                  {editing && (!mission?.isJvaMission || mission?.isJvaMission === "false") && !values.addressVerified && (
                    <div className="flex flex-col gap-2 ">
                      <VerifyAddress
                        address={values.address}
                        zip={values.zip}
                        city={values.city}
                        onSuccess={onVerifyAddress(true)}
                        onFail={onVerifyAddress()}
                        isVerified={values.addressVerified === true}
                        buttonClassName="border-[#1D4ED8] text-[#1D4ED8]"
                        verifyText="Pour vérifier  l'adresse vous devez remplir les champs adresse, code postal et ville."
                      />
                      {errors?.addressVerified && <div className="text-[#EF4444]">{errors.addressVerified}</div>}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mt-8 mb-4 text-lg font-medium text-gray-900">Tuteur de la mission</div>
                  <div className="mb-2 text-xs font-medium">
                    Sélectionner le tuteur qui va s&apos;occuper de la mission. Vous pouvez également ajouter un nouveau tuteur à votre équipe.
                  </div>
                  {!editing ? (
                    <a target="_blank" rel="noreferrer" href={`${adminURL}/user/${referents?.find((ref) => ref.value === values.tutorId)?.value}`}>
                      <div className="flex w-full cursor-pointer flex-row items-center gap-2 rounded border-[1px] border-[#D1D5DB] p-2">
                        <div className="ml-1">{referents?.find((ref) => ref.value === values.tutorId)?.label}</div>
                        <ExternalLink />
                      </div>
                    </a>
                  ) : (
                    <CreatableSelect
                      isDisabled={!editing || mission?.isJvaMission === "true"}
                      options={referents}
                      ref={referentSelectRef}
                      error={errors.tutorId}
                      styles={{
                        dropdownIndicator: (styles, { isDisabled }) => ({ ...styles, display: isDisabled ? "none" : "flex" }),
                        placeholder: (styles) => ({ ...styles, color: errors.tutorId ? "red" : "black" }),
                        control: (styles) => ({ ...styles, borderColor: "#D1D5DB", backgroundColor: editing && mission?.isJvaMission === "true" ? "#E5E7EB" : "white" }),
                        singleValue: (styles) => ({ ...styles, color: "black" }),
                        multiValueRemove: (styles, { isDisabled }) => ({ ...styles, display: isDisabled ? "none" : "flex" }),
                        indicatorsContainer: (provided, { isDisabled }) => ({ ...provided, display: isDisabled ? "none" : "flex" }),
                      }}
                      noOptionsMessage={"Aucun tuteur ne correspond à cette recherche"}
                      placeholder={"Sélectionnez un tuteur"}
                      onChange={(e) => {
                        setValues({ ...values, tutorName: e.label, tutorId: e.value, tutor: e.tutor });
                      }}
                      formatCreateLabel={() => {
                        return (
                          <div className="flex flex-col items-center gap-2" onClick={() => setCreationTutor(true)}>
                            <div className="text-sm">Le tuteur recherché n&apos;est pas dans la liste ?</div>
                            <div className="text- font-medium text-blue-600">Ajouter un nouveau tuteur</div>
                          </div>
                        );
                      }}
                      isValidNewOption={() => true}
                      value={referents?.find((ref) => ref.value === values.tutorId)}
                    />
                  )}

                  {editing && creationTutor && (
                    <div>
                      <div className="mt-8 mb-4 text-lg font-medium text-gray-900">Créer un tuteur</div>
                      <div className="mb-2 text-xs font-medium">Identité et contact</div>
                      <div className="mb-4 flex flex-row justify-between gap-3">
                        <Field
                          errors={errors}
                          readOnly={!editing}
                          label="Nom"
                          className="w-[50%]"
                          name="lastName"
                          handleChange={(e) => setNewTutor({ ...newTutor, lastName: e.target.value })}
                          value={newTutor.lastName}
                          error={errors}
                        />
                        <Field
                          errors={errors}
                          readOnly={!editing}
                          label="Prénom"
                          name="firstName"
                          className="w-[50%]"
                          handleChange={(e) => setNewTutor({ ...newTutor, firstName: e.target.value })}
                          value={newTutor.firstName}
                          error={errors}
                        />
                      </div>
                      <Field
                        errors={errors}
                        readOnly={!editing}
                        label="Email"
                        name="email"
                        handleChange={(e) => setNewTutor({ ...newTutor, email: e.target.value })}
                        value={newTutor.email}
                        error={errors}
                      />
                      <Field
                        errors={errors}
                        readOnly={!editing}
                        label="Téléphone"
                        name="phone"
                        className="my-4"
                        handleChange={(e) => setNewTutor({ ...newTutor, phone: e.target.value })}
                        value={newTutor.phone}
                        error={errors}
                      />
                      <div className="flex w-full justify-end">
                        <div className="inline-block cursor-pointer rounded bg-blue-600 py-2.5 px-4 text-sm font-medium text-white" onClick={sendInvitation}>
                          Envoyer l&apos;invitation
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden items-center justify-center xl:flex">
                <div className="h-4/5 w-[1px] border-r-[1px] border-gray-300"></div>
              </div>
              <div className="flex min-w-[350px] flex-1 flex-col gap-4">
                <div>
                  <div className="mb-2 text-xs font-medium">Type de mission</div>
                  <CustomSelect
                    errors={errors}
                    readOnly={!editing}
                    options={formatOptions}
                    placeholder={"Mission regroupée sur des journées"}
                    onChange={(e) => setValues({ ...values, format: e.value })}
                    value={values.format}
                  />
                </div>
                <div>
                  <div className="mt-2 flex flex-row text-xs font-medium">
                    <div>Durée de la mission</div>
                    <div className="text-gray-400">&nbsp;(facultatif)</div>
                  </div>
                  <div className="mb-2 text-xs font-medium">Saisissez un nombre d&apos;heures prévisionnelles pour la réalisation de la mission</div>
                  <Field
                    errors={errors}
                    readOnly={!editing}
                    name="duration"
                    handleChange={(e) => setValues({ ...values, duration: e.target.value })}
                    label="Heure(s)"
                    value={translate(values.duration)}
                  />
                </div>
                <div>
                  <div className="my-2 flex flex-row text-xs font-medium">
                    <div>
                      Objectifs de la mission -
                      <span className="text-gray-400">
                        &nbsp;En cas de modification de ce champ après validation de votre mission, cette dernière repassera en attente de validation et devra être de nouveau
                        étudiée par votre référent départemental.
                      </span>
                    </div>
                  </div>
                  <Field
                    errors={errors}
                    readOnly={!editing}
                    name="description"
                    type="textarea"
                    row={4}
                    handleChange={(e) => setValues({ ...values, description: e.target.value })}
                    label="Décrivez votre mission"
                    value={translate(values.description)}
                  />
                </div>
                <div>
                  <div className="my-2 flex flex-row text-xs font-medium">
                    <div>
                      Actions concrètes confiées au(x) volontaire(s) -
                      <span className="text-gray-400">
                        &nbsp;En cas de modification de ce champ après validation de votre mission, cette dernière repassera en attente de validation et devra être de nouveau
                        étudiée par votre référent départemental.
                      </span>
                    </div>
                  </div>
                  <Field
                    errors={errors}
                    readOnly={!editing}
                    type="textarea"
                    name="actions"
                    row={4}
                    handleChange={(e) => setValues({ ...values, actions: e.target.value })}
                    label="Listez les actions confiées au(x) volontaires"
                    value={translate(values.actions)}
                  />
                </div>
                <div>
                  <div className="my-2 flex flex-col text-xs font-medium">
                    <div>
                      Contraintes spécifiques pour cette mission
                      <span className="text-gray-400">&nbsp;(facultatif).&nbsp;</span>
                    </div>
                    <div>(conditions physiques, période de formation, mission en soirée...)</div>
                  </div>
                  <Field
                    readOnly={!editing}
                    type="textarea"
                    row={4}
                    handleChange={(e) => setValues({ ...values, contraintes: e.target.value })}
                    label="Précisez les informations complémentaires à préciser au volontaire."
                    value={translate(values.contraintes)}
                  />
                </div>
                <div>
                  <div className="mt-8 mb-4 text-lg font-medium text-gray-900">Hébergement</div>
                  <div className="flex flex-row items-center justify-between">
                    <div className="font-medium text-gray-800">Hébergement proposé : {values?.hebergement === "true" ? "oui" : "non"}</div>
                    <Toggle
                      id="hebergement"
                      name="hebergement"
                      disabled={!editing}
                      value={values?.hebergement === "true"}
                      onChange={(e) => {
                        setValues({ ...values, hebergement: e.toString() });
                      }}
                    />
                  </div>
                  {values?.hebergement === "true" && (
                    <div className="mt-4 flex flex-row gap-8">
                      <div
                        onClick={() => editing && setValues({ ...values, hebergementPayant: "false" })}
                        className={`flex flex-row items-center justify-center gap-2 ${editing && "cursor-pointer"}`}>
                        <CheckBox value={values?.hebergementPayant === "false"} />
                        <div className="font-medium text-gray-700">Hébergement gratuit</div>
                      </div>
                      <div
                        onClick={() => editing && setValues({ ...values, hebergementPayant: "true" })}
                        className={`flex flex-row items-center justify-center gap-2 ${editing && "cursor-pointer"}`}>
                        <CheckBox value={values.hebergementPayant === "true"} />
                        <div className="font-medium text-gray-700">Hébergement payant</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-8 rounded-xl bg-white pt-2">
          <div className="flex flex-col rounded-xl bg-white px-8 pb-12">
            <div className="my-4 flex items-center justify-between">
              <div className="text-lg font-medium text-gray-900">
                <div>Dates et places disponibles</div>
              </div>
              {mission.status !== MISSION_STATUS.ARCHIVED && (
                <>
                  {!editingBottom ? (
                    <button
                      className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] border-blue-100 bg-blue-100 px-3 py-2 text-xs font-medium leading-5 text-blue-600 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setEdittingBottom(true)}
                      disabled={loadingBottom}>
                      <Pencil stroke="#2563EB" className="h-[12px] w-[12px]" />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] border-gray-100 bg-gray-100 px-3 py-2 text-xs font-medium leading-5 text-gray-700 hover:border-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          setEdittingBottom(false);
                          setValues({ ...mission });
                          setErrorsBottom({});
                        }}
                        disabled={loading}>
                        Annuler
                      </button>
                      <button
                        className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] border-blue-100 bg-blue-100 px-3 py-2 text-xs font-medium leading-5 text-blue-600 hover:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={onSubmitBottom}
                        disabled={loadingBottom}>
                        <Pencil stroke="#2563EB" className="mr-[6px] h-[12px] w-[12px]" />
                        Enregistrer les changements
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-12">
              <div className="flex min-w-[350px] flex-1 flex-col gap-4">
                <div>
                  <div className="mb-2 text-xs font-medium">Dates de la mission</div>
                  <div className="my-2 flex flex-row justify-between gap-3">
                    <Field
                      errors={errorsBottom}
                      name="startAt"
                      readOnly={!editingBottom}
                      label="Date de début"
                      type="date"
                      className="w-[50%]"
                      handleChange={(e) => setValues({ ...values, startAt: e })}
                      value={values.startAt}
                      error={errors?.startAt}
                    />
                    <Field
                      errors={errorsBottom}
                      readOnly={!editingBottom}
                      isJvaMission={mission?.isJvaMission === "true"}
                      label="Date de fin"
                      name="endAt"
                      className="w-[50%]"
                      type="date"
                      handleChange={(e) => setValues({ ...values, endAt: e })}
                      value={values.endAt}
                      error={errors?.endAt}
                    />
                  </div>
                  <div className="my-2 flex flex-col text-xs font-medium">
                    <div>
                      Fréquence estimée de la mission
                      <span className="text-gray-400">&nbsp;(facultatif)&nbsp;</span>
                      (tous les mardis soirs, le samedi, tous les mercredis après-midi pendant un trimestre...)
                    </div>
                  </div>
                  <Field
                    errors={errorsBottom}
                    readOnly={!editingBottom}
                    isJvaMission={mission?.isJvaMission === "true"}
                    name="frequence"
                    type="textarea"
                    row={4}
                    handleChange={(e) => setValues({ ...values, frequence: e.target.value })}
                    label="Fréquence estimée de la mission"
                    value={values.frequence}
                  />
                </div>
              </div>
              <div className="hidden items-center justify-center xl:flex">
                <div className="h-4/5 w-[1px] border-r-[1px] border-gray-300"></div>
              </div>
              <div className="flex min-w-[350px] flex-1 flex-col gap-4">
                <div>
                  <div className="my-2 flex flex-row text-xs font-medium">
                    <div>Période de réalisation de la mission</div>
                    <div className="text-gray-400">&nbsp;(facultatif)</div>
                  </div>
                  {/* Script pour passage d'array periode en single value */}
                  <CustomSelect
                    readOnly={!editingBottom}
                    isMulti
                    options={Object.values(PERIOD).map((el) => ({ value: el, label: translate(el) }))}
                    placeholder={"Sélectionnez une ou plusieurs périodes"}
                    onChange={(e) => setValues({ ...values, period: e })}
                    value={values.period}
                  />
                  {(editingBottom || values.subPeriod.length > 0) && values.period.length !== 0 && values.period !== "" && values.period !== "WHENEVER" && (
                    <div className="mt-4">
                      <CustomSelect
                        readOnly={!editingBottom}
                        isMulti
                        options={(() => {
                          const valuesToCheck = values.period;
                          let options = [];
                          if (valuesToCheck?.indexOf(PERIOD.DURING_HOLIDAYS) !== -1) options.push(...Object.keys(MISSION_PERIOD_DURING_HOLIDAYS));
                          if (valuesToCheck?.indexOf(PERIOD.DURING_SCHOOL) !== -1) options.push(...Object.keys(MISSION_PERIOD_DURING_SCHOOL));
                          return options.map((el) => ({ value: el, label: translate(el) }));
                        })()}
                        placeholder={"Sélectionnez une ou plusieurs périodes"}
                        onChange={(e) => setValues({ ...values, subPeriod: e })}
                        value={values.subPeriod}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div className="my-2 flex flex-col text-xs font-medium">
                    Nombre de volontaire(s) recherché(s). Précisez ce nombre en fonction de vos contraintes logistiques et votre capacité à accompagner les volontaires.
                  </div>
                  <Field
                    name="placesTotal"
                    errors={errorsBottom}
                    readOnly={!editingBottom}
                    isJvaMission={mission?.isJvaMission === "true"}
                    handleChange={(e) => setValues({ ...values, placesTotal: e.target.value })}
                    value={values.placesTotal}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MissionView>
    </div>
  );
}

const CustomSelect = ({ ref = null, onChange, readOnly, options, value, isMulti = false, placeholder, noOptionsMessage = "Aucune option", error, isJvaMission = false }) => {
  return (
    <ReactSelect
      isDisabled={readOnly || isJvaMission}
      ref={ref}
      noOptionsMessage={() => noOptionsMessage}
      styles={{
        dropdownIndicator: (styles, { isDisabled }) => ({ ...styles, display: isDisabled ? "none" : "flex" }),
        placeholder: (styles) => ({ ...styles, color: error ? "red" : "black" }),
        control: (styles) => ({ ...styles, borderColor: "#D1D5DB", backgroundColor: !readOnly && isJvaMission ? "#E5E7EB" : "white" }),
        singleValue: (styles) => ({ ...styles, color: "black" }),
        multiValueRemove: (styles, { isDisabled }) => ({ ...styles, display: isDisabled ? "none" : "flex" }),
        indicatorsContainer: (provided, { isDisabled }) => ({ ...provided, display: isDisabled ? "none" : "flex" }),
      }}
      options={options}
      placeholder={placeholder}
      onChange={(val) => (isMulti ? onChange(val.map((c) => c.value)) : onChange(val))}
      value={isMulti ? options.filter((c) => value.includes(c.value)) : options.find((c) => c.value === value)}
      isMulti={isMulti}
    />
  );
};

const CheckBox = ({ value }) => {
  return (
    <>
      {value ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="16" height="16" rx="8" fill="#2563EB" />
          <circle cx="8" cy="8" r="3" fill="white" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill="white" />
          <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="#D1D5DB" />
        </svg>
      )}
    </>
  );
};
