import React, { useEffect, useState } from "react";
import YoungHeader from "./components/YoungHeader";
import { RoundButton, BorderButton, PlainButton } from "./components/Buttons";
import Pencil from "../../assets/icons/Pencil";
import ChevronDown from "../../assets/icons/ChevronDown";
import { MiniTitle } from "./components/commons";
import { FieldsGroup } from "./components/FieldsGroup";
import Field from "./components/Field";
import dayjs from "dayjs";
import {
  COHESION_STAY_LIMIT_DATE,
  COHESION_STAY_START,
  START_DATE_SESSION_PHASE1,
  translate,
  translateGrade,
  YOUNG_STATUS,
  GRADES,
  getAge,
  ROLES,
  SENDINBLUE_TEMPLATES,
} from "snu-lib";
import Tabs from "./components/Tabs";
import Bin from "../../assets/Bin";
import { toastr } from "react-redux-toastr";
import api from "../../services/api";
import { CniField } from "./components/CniField";
import FieldSituationsParticulieres from "./components/FieldSituationsParticulieres";
import ShieldCheck from "../../assets/icons/ShieldCheck";
import CheckCircle from "../../assets/icons/CheckCircle";
import XCircle from "../../assets/icons/XCircle";
import ConfirmationModal from "./components/ConfirmationModal";
import { countryOptions, SPECIFIC_SITUATIONS_KEY, YOUNG_SCHOOLED_SITUATIONS, YOUNG_ACTIVE_SITUATIONS } from "./commons";
import Check from "../../assets/icons/Check";
import RadioButton from "./components/RadioButton";
import MiniSwitch from "./components/MiniSwitch";
import FranceConnect from "../../assets/icons/FranceConnect";
import SchoolEditor from "./components/SchoolEditor";
import validator from "validator";
import SectionContext from "./context/SectionContext";
import VerifyAddress from "./components/VerifyAddress";
import { FileField } from "./components/FileField";
import { copyToClipboard } from "../../utils";
import Warning from "../../assets/icons/Warning";
import { useSelector } from "react-redux";
import { appURL } from "../../config";
import { capture } from "../../sentry";
import Modal from "../../components/ui/modals/Modal";
import ButtonLight from "../../components/ui/buttons/ButtonLight";
import ButtonPrimary from "../../components/ui/buttons/ButtonPrimary";
import PhoneField from "./components/PhoneField";
import { isPhoneNumberWellFormated, PHONE_ZONES } from "snu-lib/phone-number";
import { environment } from "../../config";
import downloadPDF from "../../utils/download-pdf";

const REJECTION_REASONS = {
  NOT_FRENCH: "Le volontaire n'est pas de nationalité française",
  TOO_YOUNG: "Le volontaire n'a pas l'âge requis",
  OTHER: "Autre (préciser)",
};

const booleanOptions = [
  { value: "true", label: translate("true") },
  { value: "false", label: translate("false") },
];

const parentStatusOptions = [
  { label: "Mère", value: "mother" },
  { label: "Père", value: "father" },
  { label: "Autre", value: "representant" },
];

const PENDING_ACCORD = "en attente";

export default function VolontairePhase0View({ young, onChange, globalMode }) {
  const user = useSelector((state) => state.Auth.user);
  const [currentCorrectionRequestField, setCurrentCorrectionRequestField] = useState("");
  const [requests, setRequests] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [footerMode, setFooterMode] = useState("NO_REQUEST");
  const [oldCohort, setOldCohort] = useState(false);

  useEffect(() => {
    if (young) {
      setRequests(young.correctionRequests ? young.correctionRequests.filter((r) => r.status !== "CANCELED") : []);
      setOldCohort(dayjs(COHESION_STAY_START[young.cohort]).year() < 2023);
    } else {
      setRequests([]);
      setOldCohort(false);
    }
  }, [young]);

  useEffect(() => {
    if (requests.find((r) => r.status === "PENDING")) {
      setFooterMode("PENDING");
    } else if (requests.find((r) => ["SENT", "REMINDED"].includes(r.status))) {
      setFooterMode("WAITING");
    } else {
      setFooterMode("NO_REQUEST");
    }
  }, [requests]);

  function onStartRequest(fieldName) {
    setCurrentCorrectionRequestField(fieldName);
  }

  async function onCorrectionRequestChange(fieldName, message, reason) {
    if (message === null && reason == null) {
      const requestIndex = requests.findIndex((req) => req.field === fieldName);
      if (requestIndex >= 0) {
        const request = requests[requestIndex];
        if (request.status === "PENDING") {
          requests.splice(requestIndex, 1);
          setRequests(requests);
        } else {
          // enregistrer l'annulation de la demande.
          setProcessing(true);
          try {
            await api.remove(`/correction-request/${young._id}/${request.field}`);
            toastr.success("La demande a bien été annulée.");
            onChange && onChange();
            // requests.splice(requestIndex, 1);
            // setRequests(requests);
          } catch (err) {
            console.error(err);
            toastr.error("Erreur !", "Nous n'avons pas pu enregistrer l'annulation de la demande. Veuillez réessayer dans quelques instants.");
          }
          setProcessing(false);
        }
      }
      setCurrentCorrectionRequestField("");
    } else {
      // change request
      const reqIdx = requests.findIndex((req) => {
        return req.field === fieldName;
      });
      if (reqIdx >= 0) {
        const reqsBefore = reqIdx > 0 ? requests.slice(0, reqIdx) : [];
        const reqsAfter = reqIdx < requests.length - 1 ? requests.slice(reqIdx + 1) : [];
        setRequests([...reqsBefore, { ...requests[reqIdx], message, reason, status: "PENDING" }, ...reqsAfter]);
      } else {
        setRequests([
          ...requests,
          {
            cohort: young.cohort,
            field: fieldName,
            reason,
            message,
            status: "PENDING",
          },
        ]);
      }
    }
  }

  function deletePendingRequests() {
    setRequests(
      requests.filter((req) => {
        return req.status !== "PENDING";
      }),
    );
    setCurrentCorrectionRequestField("");
  }

  async function sendPendingRequests() {
    setProcessing(true);
    const pendingRequests = requests.filter((req) => {
      return req.status === "PENDING";
    });
    if (pendingRequests.length > 0) {
      try {
        await api.post(`/correction-request/${young._id}`, pendingRequests);
        toastr.success("Demandes de corrections envoyées.");
        onChange && onChange();
      } catch (err) {
        console.error(err);
        toastr.error("Erreur !", translate(err.code));
      }
    }
    setProcessing(false);
  }

  async function remindRequests() {
    setProcessing(true);
    try {
      await api.post(`/correction-request/${young._id}/remind`, {});
      toastr.success("Le volontaire a été relancé.");
      onChange && onChange();
    } catch (err) {
      console.error(err);
      toastr.error("Erreur !", translate(err.code));
    }
    setProcessing(false);
  }

  async function processRegistration(state, data) {
    setProcessing(true);
    try {
      if (state === "SESSION_FULL") state = "WAITING_LIST";

      let body = {
        lastStatusAt: Date.now(),
        phase: "INSCRIPTION",
        status: state,
      };

      if (state === "REFUSED") {
        if (data.reason === "OTHER") {
          body.inscriptionRefusedMessage = data.message;
        } else {
          body.inscriptionRefusedMessage = REJECTION_REASONS[data.reason];
        }
      }

      await api.put(`/referent/young/${young._id}`, body);

      //Notify young
      switch (state) {
        case "REFUSED":
          await api.post(`/young/${young._id}/email/${SENDINBLUE_TEMPLATES.young.INSCRIPTION_REFUSED}`, { message: body.inscriptionRefusedMessage });
          break;
        case "WAITING_LIST":
          await api.put(`/referent/young/${young._id}`, { status: YOUNG_STATUS.WAITING_LIST });
          await api.post(`/young/${young._id}/email/${SENDINBLUE_TEMPLATES.young.INSCRIPTION_WAITING_LIST}`);
          break;
        case "VALIDATED":
          await api.post(`/young/${young._id}/email/${SENDINBLUE_TEMPLATES.young.INSCRIPTION_VALIDATED}`);
          break;
      }

      toastr.success("Votre action a été enregistrée.");
      onChange && onChange();
    } catch (err) {
      console.error(err);
      toastr.error("Erreur !", translate(err.code));
    }
    setProcessing(false);
  }

  return (
    <>
      <YoungHeader young={young} tab="file" onChange={onChange} />
      <div className="p-[30px]">
        {(young.status === YOUNG_STATUS.WAITING_CORRECTION || young.status === YOUNG_STATUS.WAITING_VALIDATION) && (
          <div className="pb-[30px]">
            <h1 className="mb-[8px] text-center text-[30px] font-bold">Veuillez vérifier le dossier</h1>
            <p className="mx-auto max-w-[826px] text-center text-[14px] leading-[20px]">
              Vous pouvez faire une <b>demande de correction</b> si besoin en passant votre curseur sur un champ et en cliquant sur le bouton orange. Si vous le souhaitez, vous
              pouvez également <b>modifier</b> vous-même l’information en cliquant sur &quot;modifier&quot;.
            </p>
          </div>
        )}
        <SectionIdentite
          young={young}
          globalMode={globalMode}
          requests={requests}
          onStartRequest={onStartRequest}
          currentRequest={currentCorrectionRequestField}
          onCorrectionRequestChange={onCorrectionRequestChange}
          onChange={onChange}
          readonly={user.role === ROLES.HEAD_CENTER}
        />
        <SectionParents
          young={young}
          globalMode={globalMode}
          requests={requests}
          onStartRequest={onStartRequest}
          currentRequest={currentCorrectionRequestField}
          onCorrectionRequestChange={onCorrectionRequestChange}
          onChange={onChange}
          oldCohort={oldCohort}
          readonly={user.role === ROLES.HEAD_CENTER}
        />
        {oldCohort ? <SectionOldConsentements young={young} /> : <SectionConsentements young={young} onChange={onChange} readonly={user.role === ROLES.HEAD_CENTER} />}
      </div>
      {globalMode === "correction" && (
        <>
          {footerMode === "PENDING" && (
            <FooterPending young={young} requests={requests} onDeletePending={deletePendingRequests} sending={processing} onSendPending={sendPendingRequests} />
          )}
          {footerMode === "WAITING" && <FooterSent young={young} requests={requests} reminding={processing} onRemindRequests={remindRequests} />}
          {footerMode === "NO_REQUEST" && <FooterNoRequest young={young} processing={processing} onProcess={processRegistration} />}
        </>
      )}
    </>
  );
}

function FooterPending({ young, requests, sending, onDeletePending, onSendPending }) {
  const [sentRequestsCount, setSentRequestsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const sent = requests.filter((r) => r.status === "SENT" || r.status === "REMINDED").length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    setSentRequestsCount(sent);
    setPendingRequestsCount(pending);
  }, [requests]);

  return (
    <div className="fixed bottom-0 left-[220px] right-0 flex bg-white py-[20px] px-[42px] shadow-[0px_-16px_16px_-3px_rgba(0,0,0,0.05)]">
      <div className="grow">
        <div className="flex items-center">
          <span className="text-[18px] font-medium leading-snug text-[#242526]">Le dossier est-il conforme&nbsp;?</span>
          {pendingRequestsCount > 0 && (
            <>
              {sentRequestsCount > 0 && (
                <span className="ml-[12px] rounded-[100px] border-[1px] border-[#CECECE] bg-[#F7F7F7] py-[4px] px-[10px] text-[12px] text-[#6B7280]">
                  {sentRequestsCount} {sentRequestsCount > 1 ? "corrections envoyées" : "correction envoyée"}
                </span>
              )}
              <span className="ml-[12px] rounded-[100px] bg-[#F97316] py-[4px] px-[10px] text-[12px] text-[#FFFFFF]">
                {pendingRequestsCount} {pendingRequestsCount > 1 ? "corrections demandées" : "correction demandée"}
              </span>
              <button className="ml-[12px] flex items-center text-[12px] text-[#F87171]" onClick={onDeletePending}>
                <Bin fill="#F87171" />
                <span className="ml-[5px]">Supprimer {pendingRequestsCount > 1 ? "les demandes" : "la demande"}</span>
              </button>
            </>
          )}
        </div>
        <p className="mt-[8px] text-[14px] leading-[20px] text-[#6B7280]">
          Votre demande sera transmise par mail à {young.firstName} {young.lastName} ({young.email})
        </p>
      </div>
      <div>
        <PlainButton spinner={sending} onClick={onSendPending}>
          Envoyer la demande de correction
        </PlainButton>
      </div>
    </div>
  );
}

function FooterSent({ young, requests, reminding, onRemindRequests }) {
  const [sentRequestsCount, setSentRequestsCount] = useState(0);

  useEffect(() => {
    setSentRequestsCount(requests.filter((r) => r.status === "SENT" || r.status === "REMINDED").length);
  }, [requests]);

  let sentDate = null;
  let remindedDate = null;
  for (const req of requests) {
    if (req.status === "SENT") {
      if (sentDate === null || req.sentAt.valueOf() > sentDate.valueOf()) {
        sentDate = req.sentAt;
      }
    } else if (req.status === "REMINDED") {
      if (remindedDate === null || req.remindedAt.valueOf() > remindedDate.valueOf()) {
        remindedDate = req.remindedAt;
      }
    }
  }
  const sentAt = sentDate ? dayjs(sentDate).locale("fr").format("DD/MM/YYYY à HH:mm") : null;
  const remindedAt = remindedDate ? dayjs(remindedDate).locale("fr").format("DD/MM/YYYY à HH:mm") : null;

  return (
    <div className="fixed bottom-0 left-[220px] right-0 flex bg-white py-[20px] px-[42px] shadow-[0px_-16px_16px_-3px_rgba(0,0,0,0.05)]">
      <div className="grow">
        <div className="flex items-center">
          <span className="text-[18px] font-medium leading-snug text-[#242526]">Demande de correction envoyée</span>
          <span className="ml-[12px] rounded-[100px] border-[1px] border-[#CECECE] bg-[#F7F7F7] py-[4px] px-[10px] text-[12px] text-[#6B7280]">
            {sentRequestsCount} {sentRequestsCount > 1 ? "corrections demandées" : "correction demandée"}
          </span>
        </div>
        <p className="mt-[8px] text-[14px] leading-[20px] text-[#6B7280]">
          {sentAt && "Envoyée le " + sentAt} {remindedAt && (sentAt ? "/ " : "") + "Relancé(e) le " + remindedAt}
        </p>
      </div>
      <div>
        <BorderButton spinner={reminding} onClick={onRemindRequests}>
          Relancer {young.gender === "female" ? "la" : "le"} volontaire
        </BorderButton>
      </div>
    </div>
  );
}

function FooterNoRequest({ processing, onProcess, young }) {
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [error, setError] = useState(null);

  async function validate() {
    try {
      const res = await api.get(`/inscription-goal/${young.cohort}/department/${young.department}`);
      if (!res.ok) throw new Error(res);
      const fillingRate = res.data;
      if (fillingRate >= 1.05) {
        return setConfirmModal({
          icon: <ShieldCheck className="h-[36px] w-[36px] text-[#D1D5DB]" />,
          title: (
            <span>
              L&apos;objectif d&apos;inscription de votre département a été atteint à 105%. Le dossier d&apos;inscription de {young.firstName} {young.lastName} va être{" "}
              <strong className="text-bold">validé sur liste complémentaire</strong>.
            </span>
          ),
          message: `Souhaitez-vous confirmer l'action ?`,
          type: "SESSION_FULL",
          infoLink: {
            href: "https://support.snu.gouv.fr/base-de-connaissance/procedure-de-validation-des-dossiers",
            text: "Des questions sur ce fonctionnement ?",
          },
        });
      }
      return setConfirmModal({
        icon: <ShieldCheck className="h-[36px] w-[36px] text-[#D1D5DB]" />,
        title: (
          <span>
            L&apos;objectif d&apos;inscription de votre département n&apos;a pas été atteint à 105%. Le dossier d&apos;inscription de {young.firstName} {young.lastName} va être{" "}
            <strong className="text-bold">validé sur liste principale</strong>.
          </span>
        ),
        message: `Souhaitez-vous confirmer l'action ?`,
        type: "VALIDATED",
        infoLink: {
          href: "https://support.snu.gouv.fr/base-de-connaissance/procedure-de-validation-des-dossiers",
          text: "Des questions sur ce fonctionnement ?",
        },
      });
    } catch (e) {
      capture(e);
      toastr.error(e.message);
    }
  }

  const rejectionReasonOptions = [
    <option value="" key="none">
      Motif
    </option>,
    <option value="NOT_FRENCH" key="NOT_FRENCH">
      {REJECTION_REASONS.NOT_FRENCH}
    </option>,
    <option value="TOO_YOUNG" key="TOO_YOUNG">
      {REJECTION_REASONS.TOO_YOUNG}
    </option>,
    <option value="OTHER" key="OTHER">
      {REJECTION_REASONS.OTHER}
    </option>,
  ];

  function reject() {
    setRejectionReason("");
    setRejectionMessage("");

    setConfirmModal({
      icon: <XCircle className="h-[36px] w-[36px] text-[#D1D5DB]" />,
      title: "Refuser le dossier",
      message: `Vous vous apprêtez à refuser le dossier d’inscription de ${young.firstName} ${young.lastName}. Dites-lui pourquoi ci-dessous. Un email sera automatiquement envoyé au volontaire.`,
      type: "REFUSED",
      confirmLabel: "Confirmer le refus",
      confirmColor: "danger",
    });
  }

  function confirm() {
    if (confirmModal.type === "REFUSED") {
      if (rejectionReason === "") {
        setError("Vous devez obligatoirement sélectionner un motif.");
        return;
      } else if (rejectionReason === "OTHER" && rejectionMessage.trim().length === 0) {
        setError("Pour le motif 'Autre', vous devez précisez un message.");
        return;
      } else {
        setError(null);
      }
    }
    onProcess(
      confirmModal.type,
      confirmModal.type === "REFUSED"
        ? {
            reason: rejectionReason,
            message: rejectionMessage,
          }
        : null,
    );
    setConfirmModal(null);
  }

  return (
    <div className="fixed bottom-0 left-[220px] right-0 flex bg-white py-[20px] px-[42px] shadow-[0px_-16px_16px_-3px_rgba(0,0,0,0.05)]">
      <div className="grow">
        <div className="flex items-center">
          <span className="text-[18px] font-medium leading-snug text-[#242526]">Le dossier est-il conforme&nbsp;?</span>
        </div>
        <p className="text-[14px] leading-[20px] text-[#6B7280]">Veuillez actualiser le statut du dossier d&apos;inscription.</p>
      </div>
      <div className="flex gap-2">
        <PlainButton spinner={processing} onClick={validate} mode="green" className="ml-[8px]">
          <CheckCircle className="text-[#10B981]" />
          Valider
        </PlainButton>
        <PlainButton spinner={processing} onClick={reject} mode="red" className="ml-[8px]">
          <XCircle className="text-[#EF4444]" />
          Refuser
        </PlainButton>
      </div>
      <Modal isOpen={confirmModal ? true : false}>
        {confirmModal && (
          <>
            <Modal.Header className="flex-col">
              {confirmModal.icon && <div className="mb-auto flex justify-center">{confirmModal.icon}</div>}
              <h2 className="m-0 text-center text-xl leading-7">{confirmModal.title}</h2>
            </Modal.Header>
            <Modal.Content>
              {(confirmModal.type === "VALIDATED" || confirmModal.type === "SESSION_FULL") && <p className="mb-0 text-center text-xl leading-7">{confirmModal.message}</p>}
              {confirmModal.type === "REFUSED" && (
                <div className="mt-[24px]">
                  <div className="mb-[16px] flex w-[100%] items-center rounded-[6px] border-[1px] border-[#D1D5DB] bg-white pr-[15px]">
                    <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="block grow appearance-none bg-[transparent] p-[15px]">
                      {rejectionReasonOptions}
                    </select>
                    <ChevronDown className="flex-[0_0_16px] text-[#6B7280]" />
                  </div>
                  {rejectionReason === "OTHER" && (
                    <textarea
                      value={rejectionMessage}
                      onChange={(e) => setRejectionMessage(e.target.value)}
                      className="w-[100%] rounded-[6px] border-[1px] border-[#D1D5DB] bg-white p-[15px]"
                      rows="5"
                      placeholder="Précisez la raison de votre refus ici"
                    />
                  )}
                  {error && <div className="text-[#EF4444]">{error}</div>}
                </div>
              )}
            </Modal.Content>
            <Modal.Footer>
              <div className="flex items-center justify-between gap-2">
                <ButtonLight className="grow" onClick={() => setConfirmModal(null)}>
                  Annuler
                </ButtonLight>
                <ButtonPrimary onClick={confirm} className="grow">
                  {confirmModal.confirmLabel || "Confirmer"}
                </ButtonPrimary>
              </div>
              {confirmModal.infoLink && (
                <div className="flex items-center justify-center pt-6">
                  <a
                    href={confirmModal.infoLink.href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-transparent px-3 py-2 text-blue-600 drop-shadow-sm hover:cursor-pointer hover:text-blue-700 hover:underline disabled:opacity-60 disabled:hover:text-blue-600 disabled:hover:no-underline">
                    {confirmModal.infoLink.text}
                  </a>
                </div>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
}

function SectionIdentite({ young, onStartRequest, currentRequest, onCorrectionRequestChange, requests, globalMode, onChange, readonly = false }) {
  const [sectionMode, setSectionMode] = useState(globalMode);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [birthDate, setBirthDate] = useState({ day: "", month: "", year: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (young) {
      setData({ ...young });
    } else {
      setData({});
    }
  }, [young]);

  useEffect(() => {
    setSectionMode(globalMode);
  }, [globalMode]);

  useEffect(() => {
    if (data && data.birthdateAt) {
      const date = dayjs(data.birthdateAt).locale("fr");
      setBirthDate({ day: date.date(), month: date.format("MMMM"), year: date.year() });
    }
  }, [data]);

  function onSectionChangeMode(mode) {
    setSectionMode(mode === "default" ? globalMode : mode);
  }

  function onLocalChange(field, value) {
    setData({ ...data, [field]: value });
  }

  function onLocalAddressChange(field, value) {
    onLocalChange(field, value);
    setData((prev) => ({ ...prev, addressVerified: "false" }));
  }

  function onCancel() {
    setData({ ...young });
    setErrors({});
  }

  async function onSave() {
    setSaving(true);
    if (validate()) {
      try {
        const result = await api.put(`/young-edition/${young._id}/identite`, data);
        if (result.ok) {
          toastr.success("Les données ont bien été enregistrées.");
          setSectionMode(globalMode);
          onChange();
        } else {
          if (result.code === "ALREADY_EXISTS") {
            return toastr.error("Erreur !", "Email déjà existant.");
          }
          toastr.error("Erreur !", "Nous n'avons pas pu enregistrer les modifications. Veuillez réessayer dans quelques instants.");
        }
      } catch (err) {
        toastr.error("Erreur !", "Nous n'avons pas pu enregistrer les modifications. Veuillez réessayer dans quelques instants.");
      }
    }
    setSaving(false);
  }

  function validate() {
    let result = true;
    let errors = {};

    if (!data.email || !validator.isEmail(data.email)) {
      errors.email = "L'email ne semble pas valide";
      result = false;
    }

    if (!data.phone || !isPhoneNumberWellFormated(data.phone, data.phoneZone || "AUTRE")) {
      errors.phone = PHONE_ZONES[data.phoneZone || "AUTRE"].errorMessage;
      result = false;
    }

    result = validateEmpty(data, "lastName", errors) && result;
    result = validateEmpty(data, "firstName", errors) && result;
    result = validateEmpty(data, "birthCity", errors) && result;
    result = validateEmpty(data, "birthCityZip", errors) && result;
    result = validateEmpty(data, "birthCountry", errors) && result;

    result = validateEmpty(data, "address", errors) && result;
    result = validateEmpty(data, "zip", errors) && result;
    result = validateEmpty(data, "city", errors) && result;
    result = validateEmpty(data, "country", errors) && result;

    setErrors(errors);
    return result;
  }

  const onVerifyAddress = (isConfirmed) => (suggestion) => {
    setData({
      ...data,
      addressVerified: true,
      cityCode: suggestion.cityCode,
      region: suggestion.region,
      department: suggestion.department,
      location: suggestion.location,
      // if the suggestion is not confirmed we keep the address typed by the user
      address: isConfirmed ? suggestion.address : data.address,
      zip: isConfirmed ? suggestion.zip : data.zip,
      city: isConfirmed ? suggestion.city : data.city,
    });
  };

  return (
    <SectionContext.Provider value={{ errors }}>
      <Section
        step={globalMode === "correction" ? "Première étape" : null}
        title={globalMode === "correction" ? "Vérifier l'identité" : "Informations générales"}
        editable={young.status !== YOUNG_STATUS.DELETED && !readonly}
        mode={sectionMode}
        onChangeMode={onSectionChangeMode}
        saving={saving}
        onSave={onSave}
        onCancel={onCancel}>
        <div className="flex-[1_0_50%] pr-[56px]">
          {globalMode === "correction" ? (
            <>
              <SectionIdentiteCni
                young={data}
                globalMode={sectionMode}
                requests={requests}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={onLocalChange}
              />
              <SectionIdentiteContact
                className="mt-[32px]"
                young={data}
                globalMode={sectionMode}
                requests={requests}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={onLocalChange}
              />
            </>
          ) : (
            <>
              <SectionIdentiteContact
                young={data}
                globalMode={sectionMode}
                requests={requests}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={onLocalChange}
              />
              <SectionIdentiteCni
                className="mt-[32px]"
                young={data}
                globalMode={sectionMode}
                requests={requests}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={onLocalChange}
              />
            </>
          )}
        </div>
        <div className="my-[73px] w-[1px] flex-[0_0_1px] bg-[#E5E7EB]" />
        <div className="flex-[1_0_50%] pl-[56px]">
          <div>
            <FieldsGroup
              name="birthdateAt"
              title="Date et lieu de naissance"
              mode={sectionMode}
              correctionLabel="Date de naissance"
              className="mb-[16px]"
              onStartRequest={onStartRequest}
              currentRequest={currentRequest}
              correctionRequest={getCorrectionRequest(requests, "birthdateAt")}
              onCorrectionRequestChange={onCorrectionRequestChange}
              type="date"
              value={data.birthdateAt}
              onChange={(value) => onLocalChange("birthdateAt", value)}
              young={young}>
              <Field name="birth_day" label="Jour" value={birthDate.day} className="mr-[14px] flex-[1_1_23%]" />
              <Field name="birth_month" label="Mois" value={birthDate.month} className="mr-[14px] flex-[1_1_42%]" />
              <Field name="birth_year" label="Année" value={birthDate.year} className="flex-[1_1_35%]" />
            </FieldsGroup>
            <div className="mb-[16px] flex">
              <Field
                name="birthCity"
                label="Ville de naissance"
                value={data.birthCity}
                mode={sectionMode}
                className="mr-[8px] flex-[1_1_50%]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "birthCity")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={(value) => onLocalChange("birthCity", value)}
                young={young}
              />
              <Field
                name="birthCityZip"
                label="Code postal de naissance"
                value={data.birthCityZip}
                mode={sectionMode}
                className="ml-[8px] flex-[1_1_50%]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "birthCityZip")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={(value) => onLocalChange("birthCityZip", value)}
                young={young}
              />
            </div>
            <Field
              name="birthCountry"
              label="Pays de naissance"
              value={data.birthCountry}
              mode={sectionMode}
              onStartRequest={onStartRequest}
              currentRequest={currentRequest}
              correctionRequest={getCorrectionRequest(requests, "birthCountry")}
              onCorrectionRequestChange={onCorrectionRequestChange}
              type="select"
              options={countryOptions}
              filterOnType
              onChange={(value) => onLocalChange("birthCountry", value)}
              young={young}
            />
          </div>
          <div className="mt-[32px]">
            <MiniTitle>Adresse</MiniTitle>
            <Field
              name="address"
              label="Adresse"
              value={data.address}
              mode={sectionMode}
              className="mb-[16px]"
              onStartRequest={onStartRequest}
              currentRequest={currentRequest}
              correctionRequest={getCorrectionRequest(requests, "address")}
              onCorrectionRequestChange={onCorrectionRequestChange}
              onChange={(value) => onLocalAddressChange("address", value)}
              young={young}
            />
            <div className="mb-[16px] flex items-start justify-between">
              <Field
                name="zip"
                label="Code postal"
                value={data.zip}
                mode={sectionMode}
                className="mr-[8px] flex-[1_1_50%]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "zip")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={(value) => onLocalAddressChange("zip", value)}
                young={young}
              />
              <Field
                name="city"
                label="Ville"
                value={data.city}
                mode={sectionMode}
                className="ml-[8px] flex-[1_1_50%]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "city")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={(value) => onLocalAddressChange("city", value)}
                young={young}
              />
            </div>
            <Field
              name="country"
              label="Pays"
              value={data.country}
              mode={sectionMode}
              className="mb-[16px]"
              onStartRequest={onStartRequest}
              currentRequest={currentRequest}
              correctionRequest={getCorrectionRequest(requests, "country")}
              onCorrectionRequestChange={onCorrectionRequestChange}
              type="select"
              options={countryOptions}
              filterOnType
              onChange={(value) => onLocalAddressChange("country", value)}
              young={young}
            />
            <div className="mb-[16px] flex items-start justify-between">
              <Field name="department" label="Département" value={data.department} mode="readonly" className="mr-[8px] flex-[1_1_50%]" />
              <Field name="region" label="Région" value={data.region} mode="readonly" className="ml-[8px] flex-[1_1_50%]" />
            </div>
            {sectionMode === "edition" && data.country && data.country.toUpperCase() === "FRANCE" && (
              <VerifyAddress
                address={data.address}
                zip={data.zip}
                city={data.city}
                onSuccess={onVerifyAddress(true)}
                onFail={onVerifyAddress()}
                isVerified={data.addressVerified === true}
                buttonClassName="border-[#1D4ED8] text-[#1D4ED8]"
              />
            )}
          </div>
          {data.foreignAddress && (
            <div className="mt-[32px]">
              <MiniTitle>Adresse à l&apos;étranger</MiniTitle>
              <Field
                name="address"
                label="Adresse"
                value={data.foreignAddress}
                mode={sectionMode}
                className="mb-[16px]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "foreignAddress")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={(value) => onLocalChange("foreignAddress", value)}
                young={young}
              />
              <div className="mb-[16px] flex items-start justify-between">
                <Field
                  name="zip"
                  label="Code postal"
                  value={data.foreignZip}
                  mode={sectionMode}
                  className="mr-[8px] flex-[1_1_50%]"
                  onStartRequest={onStartRequest}
                  currentRequest={currentRequest}
                  correctionRequest={getCorrectionRequest(requests, "foreignZip")}
                  onCorrectionRequestChange={onCorrectionRequestChange}
                  onChange={(value) => onLocalChange("foreignZip", value)}
                  young={young}
                />
                <Field
                  name="city"
                  label="Ville"
                  value={data.foreignCity}
                  mode={sectionMode}
                  className="ml-[8px] flex-[1_1_50%]"
                  onStartRequest={onStartRequest}
                  currentRequest={currentRequest}
                  correctionRequest={getCorrectionRequest(requests, "foreignCity")}
                  onCorrectionRequestChange={onCorrectionRequestChange}
                  onChange={(value) => onLocalChange("foreignCity", value)}
                  young={young}
                />
              </div>
              <Field
                name="country"
                label="Pays"
                value={data.foreignCountry}
                mode={sectionMode}
                className="mb-[16px]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "foreignCountry")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                type="select"
                options={countryOptions}
                filterOnType
                onChange={(value) => onLocalChange("foreignCountry", value)}
                young={young}
              />
            </div>
          )}
        </div>
      </Section>
    </SectionContext.Provider>
  );
}

function SectionIdentiteCni({ young, globalMode, currentRequest, onStartRequest, requests, onCorrectionRequestChange, className, onChange }) {
  const user = useSelector((state) => state.Auth.user);
  const categoryOptions = ["cniNew", "cniOld", "passport"].map((s) => ({ value: s, label: translate(s) }));
  let cniDay = "";
  let cniMonth = "";
  let cniYear = "";

  if (young.latestCNIFileExpirationDate) {
    const date = dayjs(young.latestCNIFileExpirationDate).locale("fr");
    cniDay = date.date();
    cniMonth = date.format("MMMM");
    cniYear = date.year();
  }

  return (
    <div className={className}>
      <CniField
        name="cniFile"
        label="Pièce d'identité"
        young={young}
        mode={globalMode}
        onStartRequest={onStartRequest}
        currentRequest={currentRequest}
        correctionRequest={getCorrectionRequest(requests, "cniFile")}
        onCorrectionRequestChange={onCorrectionRequestChange}
        onChange={onChange}
      />

      <FieldsGroup
        name="latestCNIFileExpirationDate"
        title="Date d'expiration de la pièce d'identité"
        mode={globalMode}
        onStartRequest={onStartRequest}
        currentRequest={currentRequest}
        correctionRequest={getCorrectionRequest(requests, "latestCNIFileExpirationDate")}
        onCorrectionRequestChange={onCorrectionRequestChange}
        type="date"
        value={young.latestCNIFileExpirationDate}
        onChange={(value) => onChange("latestCNIFileExpirationDate", value)}
        young={young}>
        <Field name="cni_day" label="Jour" value={cniDay} className="mr-[14px] flex-[1_1_23%]" />
        <Field name="cni_month" label="Mois" value={cniMonth} className="mr-[14px] flex-[1_1_42%]" />
        <Field name="cni_year" label="Année" value={cniYear} className="flex-[1_1_35%]" />
      </FieldsGroup>

      {user.role === ROLES.ADMIN && (
        <Field
          name="latestCNIFileCategory"
          label="Type de pièce d'identité"
          value={young.latestCNIFileCategory}
          transformer={translate}
          mode={globalMode}
          className="my-[16px]"
          onStartRequest={onStartRequest}
          currentRequest={currentRequest}
          correctionRequest={getCorrectionRequest(requests, "latestCNIFileCategory")}
          onCorrectionRequestChange={onCorrectionRequestChange}
          type="select"
          options={categoryOptions}
          onChange={(cat) => onChange("latestCNIFileCategory", cat)}
          young={young}
        />
      )}
      <HonorCertificate young={young} />
    </div>
  );
}

function SectionIdentiteContact({ young, globalMode, currentRequest, onStartRequest, requests, onCorrectionRequestChange, className, onChange }) {
  const genderOptions = [
    { value: "female", label: translate("female") },
    { value: "male", label: translate("male") },
  ];

  return (
    <div className={className}>
      <MiniTitle>Identité et contact</MiniTitle>
      <div className="mb-[16px] flex items-start justify-between">
        <Field
          name="lastName"
          label="Nom"
          value={young.lastName}
          mode={globalMode}
          className="mr-[8px] flex-[1_1_50%]"
          onStartRequest={onStartRequest}
          currentRequest={currentRequest}
          correctionRequest={getCorrectionRequest(requests, "lastName")}
          onCorrectionRequestChange={onCorrectionRequestChange}
          onChange={(value) => onChange("lastName", value)}
          young={young}
        />
        <Field
          name="firstName"
          label="Prénom"
          value={young.firstName}
          mode={globalMode}
          className="ml-[8px] flex-[1_1_50%]"
          onStartRequest={onStartRequest}
          currentRequest={currentRequest}
          correctionRequest={getCorrectionRequest(requests, "firstName")}
          onCorrectionRequestChange={onCorrectionRequestChange}
          onChange={(value) => onChange("firstName", value)}
          young={young}
        />
      </div>
      <Field
        name="gender"
        label="Sexe"
        value={young.gender}
        mode={globalMode}
        className="mb-[16px]"
        onStartRequest={onStartRequest}
        currentRequest={currentRequest}
        correctionRequest={getCorrectionRequest(requests, "gender")}
        onCorrectionRequestChange={onCorrectionRequestChange}
        type="select"
        options={genderOptions}
        transformer={translate}
        onChange={(value) => onChange("gender", value)}
        young={young}
      />
      <Field
        name="email"
        label="Email"
        value={young.email}
        mode={globalMode}
        className="mb-[16px]"
        onStartRequest={onStartRequest}
        currentRequest={currentRequest}
        correctionRequest={getCorrectionRequest(requests, "email")}
        onCorrectionRequestChange={onCorrectionRequestChange}
        onChange={(value) => onChange("email", value)}
        young={young}
        copy={true}
      />
      <PhoneField
        name="phone"
        young={young}
        value={young.phone}
        onChange={(value) => onChange("phone", value)}
        zoneValue={young.phoneZone}
        onChangeZone={(value) => onChange("phoneZone", value)}
        mode={globalMode}
        placeholder={PHONE_ZONES[young.phoneZone]?.example}
        onStartRequest={onStartRequest}
        currentRequest={currentRequest}
        correctionRequest={getCorrectionRequest(requests, "phone")}
        onCorrectionRequestChange={onCorrectionRequestChange}
      />
    </div>
  );
}

function SectionParents({ young, onStartRequest, currentRequest, onCorrectionRequestChange, requests, globalMode, onChange, oldCohort, readonly }) {
  const [currentParent, setCurrentParent] = useState(1);
  const [hasSpecificSituation, setHasSpecificSituation] = useState(false);
  const [sectionMode, setSectionMode] = useState(globalMode);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [youngAge, setYoungAge] = useState(0);
  const [situationOptions, setSituationOptions] = useState([]);
  const gradeOptions = Object.keys(GRADES).map((g) => ({ value: g, label: translateGrade(g) }));

  useEffect(() => {
    if (data) {
      if (data.grade === GRADES.NOT_SCOLARISE) {
        setSituationOptions(Object.keys(YOUNG_ACTIVE_SITUATIONS).map((s) => ({ value: s, label: translate(s) })));
      } else {
        setSituationOptions(Object.keys(YOUNG_SCHOOLED_SITUATIONS).map((s) => ({ value: s, label: translate(s) })));
      }
    }
    if (young) {
      setData({ ...young });
      setHasSpecificSituation(SPECIFIC_SITUATIONS_KEY.findIndex((key) => young[key] === "true") >= 0);
      setYoungAge(getAge(young.birthdateAt));
    } else {
      setData({});
      setHasSpecificSituation(false);
      setYoungAge(0);
    }
  }, [young]);

  useEffect(() => {
    setSectionMode(globalMode);
  }, [globalMode]);

  function onSectionChangeMode(mode) {
    setSectionMode(mode === "default" ? globalMode : mode);
  }

  function onLocalChange(field, value) {
    const newData = { ...data, [field]: value };
    if (field === "grade") {
      if (value === GRADES.NOT_SCOLARISE) {
        newData.schooled = "false";
        if (!YOUNG_ACTIVE_SITUATIONS[data.situation]) {
          newData.situation = "";
        }
        setSituationOptions(Object.keys(YOUNG_ACTIVE_SITUATIONS).map((s) => ({ value: s, label: translate(s) })));
      } else {
        newData.schooled = "true";
        if (!YOUNG_SCHOOLED_SITUATIONS[data.situation]) {
          newData.situation = "";
        }
        setSituationOptions(Object.keys(YOUNG_SCHOOLED_SITUATIONS).map((s) => ({ value: s, label: translate(s) })));
      }
    }
    setData(newData);
  }

  function onSchoolChange(changes) {
    setData({ ...data, ...changes });
  }

  function onCancel() {
    setData({ ...young });
    setErrors({});
  }

  const trimmedPhones = {};
  if (data.parent1Phone) trimmedPhones[1] = data.parent1Phone.replace(/\s/g, "");
  if (data.parent2Phone) trimmedPhones[2] = data.parent2Phone.replace(/\s/g, "");

  async function onSave() {
    setSaving(true);
    if (validate()) {
      try {
        if (data.parent1Phone) data.parent1Phone = trimmedPhones[1];
        if (data.parent2Phone) data.parent2Phone = trimmedPhones[2];

        if (data.grade === GRADES.NOT_SCOLARISE) {
          const request = await api.put(`/young-edition/${young._id}/situationparents`, {
            schooled: "false",
            schoolName: "",
            schoolType: "",
            schoolAddress: "",
            schoolComplementAdresse: "",
            schoolZip: "",
            schoolCity: "",
            schoolDepartment: "",
            schoolRegion: "",
            schoolCountry: "",
            schoolLocation: null,
            schoolId: "",
            academy: "",
          });
          data.schoolName = "";
          data.schoolType = "";
          data.schoolAddress = "";
          data.schoolComplementAdresse = "";
          data.schoolZip = "";
          data.schoolCity = "";
          data.schoolDepartment = "";
          data.schoolRegion = "";
          data.schoolCountry = "";
          data.schoolLocation = null;
          data.schoolId = "";
          data.academy = "";

          if (!request.ok) {
            toastr.error("Erreur !", "Nous n'avons pas pu enregistrer les modifications. Veuillez réessayer dans quelques instants.");
          }
        }

        const result = await api.put(`/young-edition/${young._id}/situationparents`, data);
        if (result.ok) {
          toastr.success("Les données ont bien été enregistrées.");
          setSectionMode(globalMode);
          onChange && onChange();
        } else {
          toastr.error("Erreur !", "Nous n'avons pas pu enregistrer les modifications. Veuillez réessayer dans quelques instants.");
        }
      } catch (err) {
        console.log(err);
        toastr.error("Erreur !", "Nous n'avons pas pu enregistrer les modifications. Veuillez réessayer dans quelques instants.");
      }
    }
    setSaving(false);
  }

  function validate() {
    let result = true;
    let errors = {};

    if (!data.parent1Status) return true;

    for (let parent = 1; parent <= (young.parent2Status ? 2 : 1); ++parent) {
      if ((data[`parent${parent}ContactPreference`] === "email" || data[`parent${parent}Email`] !== "") && !validator.isEmail(data[`parent${parent}Email`])) {
        errors[`parent${parent}Email`] = "L'email ne semble pas valide";
        result = false;
      }

      if (
        (data[`parent${parent}ContactPreference`] === "phone" || (trimmedPhones[parent] && trimmedPhones[parent] !== "")) &&
        !isPhoneNumberWellFormated(data[`parent${parent}Phone`], data[`parent${parent}PhoneZone`] || "AUTRE")
      ) {
        errors[`parent${parent}Phone`] = PHONE_ZONES[data[`parent${parent}PhoneZone`] || "AUTRE"].errorMessage;
        result = false;
      }
      result = validateEmpty(data, `parent${parent}LastName`, errors) && result;
      result = validateEmpty(data, `parent${parent}FirstName`, errors) && result;

      if (data[`parent${parent}OwnAddress`] === "true") {
        result = validateEmpty(data, `parent${parent}Address`, errors) && result;
        result = validateEmpty(data, `parent${parent}Zip`, errors) && result;
        result = validateEmpty(data, `parent${parent}City`, errors) && result;
        result = validateEmpty(data, `parent${parent}Country`, errors) && result;
      }
      if (!data.situation || data.situation === "") {
        errors["situation"] = "Ce champ ne peut pas être vide";
        result = false;
      }
      if (!data.grade || data.grade === "") {
        errors["grade"] = "Ce champ ne peut pas être vide";
        result = false;
      }
    }

    setErrors(errors);
    return result;
  }

  function parentHasRequest(parentId) {
    return (
      requests &&
      requests.findIndex((req) => {
        return req.field.startsWith("parent" + parentId);
      }) >= 0
    );
  }

  const tabs = [{ label: "Représentant légal 1", value: 1, warning: parentHasRequest(1) || Object.keys(errors)?.some((error) => error.includes("parent1")) }];
  if (young.parent2Status) {
    tabs.push({ label: "Représentant légal 2", value: 2, warning: parentHasRequest(2) || Object.keys(errors)?.some((error) => error.includes("parent2")) });
  }

  function onParrentTabChange(tab) {
    setCurrentParent(tab);
    onStartRequest("");
  }

  return (
    <SectionContext.Provider value={{ errors }}>
      <Section
        step={globalMode === "correction" ? "Seconde étape :" : null}
        title={globalMode === "correction" ? "Vérifiez la situation et l'accord parental" : "Détails"}
        editable={young.status !== YOUNG_STATUS.DELETED && !readonly}
        mode={sectionMode}
        onChangeMode={onSectionChangeMode}
        saving={saving}
        onSave={onSave}
        onCancel={onCancel}
        containerNoFlex>
        <div className="flex">
          <div className="flex-[1_0_50%] pr-[56px]">
            <div>
              <MiniTitle>Situation</MiniTitle>
              <Field
                name="grade"
                label="Classe"
                value={data.grade}
                transformer={translateGrade}
                mode={sectionMode}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "grade")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                type="select"
                options={gradeOptions}
                onChange={(value) => onLocalChange("grade", value)}
                young={young}
                className="flex-[1_1_50%]"
              />
              <Field
                name="situation"
                label="Statut"
                value={data.situation}
                transformer={translate}
                mode={sectionMode}
                className="mt-4 mb-4 flex-[1_1_50%]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, "situation")}
                onCorrectionRequestChange={onCorrectionRequestChange}
                type="select"
                options={situationOptions}
                onChange={(value) => onLocalChange("situation", value)}
                young={young}
              />
              {data.schooled === "true" && (
                <>
                  {sectionMode === "edition" ? (
                    <SchoolEditor young={data} onChange={onSchoolChange} />
                  ) : (
                    <>
                      <Field
                        name="schoolCity"
                        label="Ville de l'établissement"
                        value={data.schoolCity}
                        mode={sectionMode}
                        className="mb-[16px]"
                        onStartRequest={onStartRequest}
                        currentRequest={currentRequest}
                        correctionRequest={getCorrectionRequest(requests, "schoolCity")}
                        onCorrectionRequestChange={onCorrectionRequestChange}
                        onChange={(value) => onLocalChange("schoolCity", value)}
                        young={young}
                      />
                      <Field
                        name="schoolName"
                        label="Nom de l'établissement"
                        value={data.schoolName}
                        mode={sectionMode}
                        className="mb-[16px]"
                        onStartRequest={onStartRequest}
                        currentRequest={currentRequest}
                        correctionRequest={getCorrectionRequest(requests, "schoolName")}
                        onCorrectionRequestChange={onCorrectionRequestChange}
                        onChange={(value) => onLocalChange("schoolName", value)}
                        young={young}
                      />
                    </>
                  )}
                </>
              )}
            </div>
            {(sectionMode === "edition" || hasSpecificSituation) && (
              <div className="mt-[32px]">
                <MiniTitle>Situations particulières</MiniTitle>
                <FieldSituationsParticulieres
                  name="specificSituations"
                  young={data}
                  mode={sectionMode === "edition" ? "edition" : "readonly"}
                  onStartRequest={onStartRequest}
                  currentRequest={currentRequest}
                  correctionRequest={getCorrectionRequest(requests, "specificSituations")}
                  onCorrectionRequestChange={onCorrectionRequestChange}
                  onChange={onLocalChange}
                />
                {data.specificAmenagment === "true" && (
                  <Field
                    name="specificAmenagmentType"
                    label="Nature de l'aménagement spécifique"
                    value={data.specificAmenagmentType}
                    mode={sectionMode === "edition" ? "edition" : "readonly"}
                    onStartRequest={onStartRequest}
                    currentRequest={currentRequest}
                    correctionRequest={getCorrectionRequest(requests, "specificAmenagmentType")}
                    onCorrectionRequestChange={onCorrectionRequestChange}
                    onChange={(value) => onLocalChange("specificAmenagmentType", value)}
                    young={young}
                  />
                )}
              </div>
            )}
          </div>
          <div className="my-[73px] w-[1px] flex-[0_0_1px] bg-[#E5E7EB]" />
          <div className="flex-[1_0_50%] pl-[56px]">
            <Tabs tabs={tabs} selected={currentParent} onChange={onParrentTabChange} />
            <div className="mt-[32px]">
              <Field
                name={`parent${currentParent}Status`}
                label="Statut"
                value={data[`parent${currentParent}Status`]}
                transformer={translate}
                mode={sectionMode}
                className="mb-[16px]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, `parent${currentParent}Status`)}
                onCorrectionRequestChange={onCorrectionRequestChange}
                type="select"
                options={parentStatusOptions}
                onChange={(value) => onLocalChange(`parent${currentParent}Status`, value)}
                young={young}
              />
              <div className="mb-[16px] flex">
                <Field
                  name={`parent${currentParent}LastName`}
                  label="Nom"
                  value={data[`parent${currentParent}LastName`]}
                  mode={sectionMode}
                  className="mr-[8px] flex-[1_1_50%]"
                  onStartRequest={onStartRequest}
                  currentRequest={currentRequest}
                  correctionRequest={getCorrectionRequest(requests, `parent${currentParent}LastName`)}
                  onCorrectionRequestChange={onCorrectionRequestChange}
                  onChange={(value) => onLocalChange(`parent${currentParent}LastName`, value)}
                  young={young}
                />
                <Field
                  name={`parent${currentParent}FirstName`}
                  label="Prénom"
                  value={data[`parent${currentParent}FirstName`]}
                  mode={sectionMode}
                  className="ml-[8px] flex-[1_1_50%]"
                  onStartRequest={onStartRequest}
                  currentRequest={currentRequest}
                  correctionRequest={getCorrectionRequest(requests, `parent${currentParent}FirstName`)}
                  onCorrectionRequestChange={onCorrectionRequestChange}
                  onChange={(value) => onLocalChange(`parent${currentParent}FirstName`, value)}
                  young={young}
                />
              </div>
              <Field
                name={`parent${currentParent}Email`}
                label="Email"
                value={data[`parent${currentParent}Email`]}
                mode={sectionMode}
                className="mb-[16px]"
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, `parent${currentParent}Email`)}
                onCorrectionRequestChange={onCorrectionRequestChange}
                onChange={(value) => onLocalChange(`parent${currentParent}Email`, value)}
                young={young}
                copy={true}
              />
              <PhoneField
                name={`parent${currentParent}Phone`}
                className="mb-[16px]"
                young={young}
                value={data[`parent${currentParent}Phone`]}
                onChange={(value) => onLocalChange(`parent${currentParent}Phone`, value)}
                zoneValue={data[`parent${currentParent}PhoneZone`]}
                onChangeZone={(value) => onLocalChange(`parent${currentParent}PhoneZone`, value)}
                mode={sectionMode}
                placeholder={PHONE_ZONES[data[`parent${currentParent}PhoneZone`]]?.example}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, `parent${currentParent}Phone`)}
                onCorrectionRequestChange={onCorrectionRequestChange}
              />
              <Field
                name={`parent${currentParent}OwnAddress`}
                label="Adresse différente de celle du volontaire"
                value={data[`parent${currentParent}OwnAddress`]}
                transformer={translate}
                mode={sectionMode === "edition" ? "edition" : "readonly"}
                onStartRequest={onStartRequest}
                currentRequest={currentRequest}
                correctionRequest={getCorrectionRequest(requests, `parent${currentParent}OwnAddress`)}
                onCorrectionRequestChange={onCorrectionRequestChange}
                type="select"
                options={booleanOptions}
                onChange={(value) => onLocalChange(`parent${currentParent}OwnAddress`, value)}
                young={young}
              />
              {data[`parent${currentParent}OwnAddress`] === "true" && (
                <FieldsGroup
                  name={`parent${currentParent}Address`}
                  mode={sectionMode === "edition" ? "edition" : "readonly"}
                  title="Adresse"
                  noflex
                  className="mt-[16px]"
                  onStartRequest={onStartRequest}
                  currentRequest={currentRequest}
                  correctionRequest={getCorrectionRequest(requests, `parent${currentParent}Address`)}
                  onCorrectionRequestChange={onCorrectionRequestChange}
                  young={young}>
                  <Field
                    name={`parent${currentParent}Address`}
                    label="Adresse"
                    value={data[`parent${currentParent}Address`] || ""}
                    mode={sectionMode}
                    className="mb-[16px]"
                    onChange={(value) => onLocalChange(`parent${currentParent}Address`, value)}
                    young={young}
                  />
                  <Field
                    name={`parent${currentParent}Zip`}
                    label="Code postal"
                    value={data[`parent${currentParent}Zip`] || ""}
                    mode={sectionMode}
                    className="mr-[8px] mb-[16px] inline-block w-[calc(50%-8px)]"
                    onChange={(value) => onLocalChange(`parent${currentParent}Zip`, value)}
                    young={young}
                  />
                  <Field
                    name={`parent${currentParent}City`}
                    label="Ville"
                    value={data[`parent${currentParent}City`] || ""}
                    mode={sectionMode}
                    className="ml-[8px] mb-[16px] inline-block w-[calc(50%-8px)]"
                    onChange={(value) => onLocalChange(`parent${currentParent}City`, value)}
                    young={young}
                  />
                  <Field
                    name={`parent${currentParent}Country`}
                    label="Pays"
                    value={data[`parent${currentParent}Country`] || ""}
                    mode={sectionMode}
                    className="mb-[16px]"
                    type="select"
                    options={countryOptions}
                    filterOnType
                    onChange={(value) => onLocalChange(`parent${currentParent}Country`, value)}
                    young={young}
                  />
                </FieldsGroup>
              )}
              {data[`parent${currentParent}FromFranceConnect`] === "true" && (
                <div className="mt-[16px] flex items-center rounded-[7px] bg-[#F9FAFB] p-[18px]">
                  <FranceConnect className="mr-[28px] flex-[0_0_100px]" />
                  <div>
                    <div className="text-bold mb-[6px] text-[14px] leading-[20px] text-[#242526]">Attestation des représentants légaux</div>
                    <div className="grow text-[12px] leading-[20px] text-[#000000]">
                      Consentement parental validé via FranceConnect. Les représentants légaux ont utilisé FranceConnect pour s’identifier et consentir, ce qui permet de
                      s’affranchir du formulaire de consentement numérique.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {oldCohort && (
          <div className="mt-[32px] flex">
            <div className="flex-[1_0_50%] pr-[56px]">
              {data.motivations && (
                <div>
                  <div className="">Motivations</div>
                  <div className="">&laquo;&nbsp;{data.motivations}&nbsp;&raquo;</div>
                </div>
              )}
            </div>
            <div className="my-[73px] w-[1px] flex-[0_0_1px] bg-[#E5E7EB]" />
            <div className="flex-[1_0_50%] pl-[56px]">
              <FileField
                mode={sectionMode}
                young={data}
                label="Droit à l'image"
                onChange={onLocalChange}
                statusField="imageRightFilesStatus"
                fileType="imageRightFiles"
                updateYoung={onChange}
              />
              {youngAge && youngAge < 15 && (
                <FileField mode={sectionMode} young={data} label="Accord pour les mineurs de moins de 15 ans" fileType="parentConsentmentFiles" updateYoung={onChange} />
              )}
            </div>
          </div>
        )}
      </Section>
    </SectionContext.Provider>
  );
}

const PARENT_STATUS_NAME = {
  father: "Le père",
  mother: "La mère",
  representant: "Le représentant légal",
};

function SectionConsentements({ young, onChange, readonly = false }) {
  const [youngAge, setYoungAge] = useState("?");
  const [confirmModal, setConfirmModal] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState("");

  useEffect(() => {
    if (young) {
      setYoungAge(getAge(young.birthdateAt));
    } else {
      setYoungAge("?");
    }
  }, [young]);

  const authorizationOptions = [
    { value: "true", label: "J'autorise" },
    { value: "false", label: "Je n'autorise pas" },
  ];

  function parent2RejectSNU() {
    setConfirmModal({
      icon: <Warning />,
      title: "Consentement refusé",
      message: (
        <div>
          Vous vous apprêtez à passer le dossier d&apos;inscription de {young.firstName} {young.lastName} en statut &laquo;non autorisé&raquo;.
          <br />
          {young.firstName} ne pourra pas participer au SNU.
          <br />
          Un email lui sera automatiquement envoyé.
        </div>
      ),
      confirm: confirmParent2Rejection,
    });
  }

  async function confirmParent2Rejection() {
    try {
      setConfirmModal(null);
      await api.put(`/young-edition/${young._id}/parent-allow-snu`, {
        parent: 2,
        allow: false,
      });
      toastr.success("Le refus a été pris en compte. Le jeune a été notifié.");
      onChange && onChange();
    } catch (err) {
      toastr.error("Nous n'avons pas pu enregistrer le refus. Veuillez réessayer dans quelques instants.");
    }
  }

  function confirmImageRightsChange(parentId, event) {
    event.preventDefault();

    const parent = {
      firstName: young[`parent${parentId}FirstName`],
      lastName: young[`parent${parentId}LastName`],
    };

    setConfirmModal({
      title: "Modification de l’accord de droit à l’image",
      message: (
        <div>
          Vous vous apprêtez à envoyer à {parent.firstName} {parent.lastName} une demande de modification de son accord de droit à l&apos;image.
          <br />
          Un email lui sera envoyé. Cela annulera l&apos;ancien accord.
        </div>
      ),
      confirm: () => changeImagesRights(parentId),
    });
  }

  async function changeImagesRights(parentId) {
    try {
      const result = await api.put(`/young-edition/${young._id}/parent-image-rights-reset`, { parentId });
      if (!result.ok) {
        toastr.error("Erreur !", "Nous n'avons pu modifier le droit à l'image pour ce représentant légal. Veuillez réessayer dans quelques instants.");
      } else {
        toastr.success("Le droit à l'image a été remis à zéro. Un email a été envoyé au représentant légal.");
        onChange && onChange(result.data);
      }
    } catch (err) {
      capture(err);
      toastr.error("Erreur !", "Nous n'avons pu modifier le droit à l'image pour ce représentant légal. Veuillez réessayer dans quelques instants.");
    }
  }

  function openParentsAllowSNUModal() {
    setConfirmModal({
      icon: <Warning />,
      title: "Annulation du refus de consentement",
      message: (
        <div>
          Vous vous apprêtez à annuler le refus de consentement des représentants légaux de {young.firstName} {young.lastName}.
          <br />
          Ils recevront un email de relance pour leur demander de confirmer leur consentement.
        </div>
      ),
      confirm: resetParentsAllowSNU,
    });
  }

  async function resetParentsAllowSNU() {
    try {
      let result = await api.put(`/young-edition/${young._id}/parent-allow-snu-reset`);
      if (!result.ok) {
        toastr.error("Erreur !", "Nous n'avons pu réinitialiser le consentement pour les représentants légaux. Veuillez réessayer dans quelques instants.");
      } else {
        toastr.success("Le consentement a été réinitialisé. Un email a été envoyé au représentant légal 1.");
        onChange && onChange(result.data);
      }
    } catch (err) {
      capture(err);
      toastr.error("Erreur !", "Nous n'avons pu réinitialiser le consentement pour ce représentant légal. Veuillez réessayer dans quelques instants.");
    }
  }

  async function downloadImageRightDocument() {
    setPdfDownloading("(en cours...)");
    await downloadPDF({
      url: `/young/${young._id}/documents/droitImage/droitImage`,
      fileName: `${young.firstName} ${young.lastName} - attestation droit image.pdf`,
    });
    setPdfDownloading("");
  }

  return (
    <Section title="Consentements" collapsable>
      <div className="flex-[1_0_50%] pr-[56px]">
        <div className="text-[16px] font-bold leading-[24px] text-[#242526]">
          Le volontaire{" "}
          <span className="font-normal text-[#6B7280]">
            {young.firstName} {young.lastName}
          </span>
        </div>
        <div>
          <CheckRead value={young.acceptCGU === "true"}>
            A lu et accepté les Conditions Générales d&apos;Utilisation (CGU) de la plateforme du Service National Universel.
          </CheckRead>
          <CheckRead value={young.acceptCGU === "true"}>A pris connaissance des modalités de traitement de mes données personnelles.</CheckRead>
          <CheckRead value={young.consentment === "true"}>
            Est volontaire pour effectuer la session 2023 du Service National Universel qui comprend la participation au séjour de cohésion{" "}
            <b>{COHESION_STAY_LIMIT_DATE[young.cohort]}</b> puis la réalisation d&apos;une mission d&apos;intérêt général.
          </CheckRead>
          <CheckRead value={young.consentment === "true"}>S&apos;engage à respecter le règlement intérieur du SNU, en vue de ma participation au séjour de cohésion.</CheckRead>
          <CheckRead value={(young.inscriptionDoneDate !== undefined && young.inscriptionDoneDate !== null) || young.informationAccuracy === "true"}>
            Certifie l&apos;exactitude des renseignements fournis
          </CheckRead>
        </div>
      </div>
      <div className="my-[73px] w-[1px] flex-[0_0_1px] bg-[#E5E7EB]" />
      <div className="flex-[1_0_50%] pl-[56px] pb-[32px]">
        <div className="mb-[16px] flex items-center justify-between text-[16px] font-bold leading-[24px] text-[#242526]">
          <div className="grow">
            {PARENT_STATUS_NAME[young.parent1Status]}{" "}
            <span className="font-normal text-[#6B7280]">
              {young.parent1FirstName} {young.parent1LastName}
            </span>
          </div>
          {young.parent1ValidationDate && (
            <div className="whitespace-nowrap text-[13px] font-normal text-[#1F2937]">{dayjs(young.parent1ValidationDate).locale("fr").format("DD/MM/YYYY HH:mm")}</div>
          )}
        </div>
        <div className="flex items-center gap-8">
          <RadioButton value={young.parentAllowSNU} options={authorizationOptions} readonly />
          {young.parentAllowSNU === "false" && (
            <button onClick={openParentsAllowSNUModal} className="mt-2 mb-6 text-blue-600 underline">
              Annuler le refus de consentement
            </button>
          )}
        </div>
        <div className="my-[16px] text-[14px] leading-[20px] text-[#161616]">
          <b>
            {young.firstName} {young.lastName}
          </b>{" "}
          à participer à la session <b>{COHESION_STAY_LIMIT_DATE[young.cohort]}</b> du Service National Universel qui comprend la participation à un séjour de cohésion et la
          réalisation d&apos;une mission d&apos;intérêt général.
        </div>
        <div>
          <CheckRead value={young.parent1AllowSNU === "true"}>
            Confirme être titulaire de l&apos;autorité parentale/ représentant(e) légal(e) de{" "}
            <b>
              {young.firstName} {young.lastName}
            </b>
          </CheckRead>
          {youngAge < 15 && (
            <CheckRead value={young.parent1AllowSNU === "true"}>
              Accepte la collecte et le traitement des données personnelles de{" "}
              <b>
                {young.firstName} {young.lastName}
              </b>
            </CheckRead>
          )}
          <CheckRead value={young.parent1AllowSNU === "true"}>
            S&apos;engage à remettre sous pli confidentiel la fiche sanitaire ainsi que les documents médicaux et justificatifs nécessaires avant son départ en séjour de cohésion.
          </CheckRead>
          <CheckRead value={young.parent1AllowSNU === "true"}>
            S&apos;engage à ce que{" "}
            <b>
              {young.firstName} {young.lastName}
            </b>{" "}
            soit à jour de ses vaccinations obligatoires, c&apos;est-à-dire anti-diphtérie, tétanos et poliomyélite (DTP), et pour les volontaires résidents de Guyane, la fièvre
            jaune.
          </CheckRead>
          <CheckRead value={young.parent1AllowSNU === "true"}>Reconnait avoir pris connaissance du Règlement Intérieur du SNU.</CheckRead>
        </div>
        <div className="itemx-center mt-[16px] flex justify-between">
          <div className="grow text-[14px] leading-[20px] text-[#374151]">
            <div className="font-bold">Droit à l&apos;image</div>
            <div className="flex items-center">
              <div>Accord : {translate(young.parent1AllowImageRights) || PENDING_ACCORD}</div>
              {(young.parent1AllowImageRights === "true" || young.parent1AllowImageRights === "false") && !readonly && young.parent1Email && (
                <a href="#" className="ml-4 block text-blue-600 underline" onClick={(e) => confirmImageRightsChange(1, e)}>
                  Modifier
                </a>
              )}
            </div>
            {environment !== "production" && (young.parent1AllowImageRights === "true" || young.parent1AllowImageRights === "false") && (
              <ButtonLight className="mt-2" onClick={downloadImageRightDocument}>
                Télécharger le droit à l&apos;image {pdfDownloading}
              </ButtonLight>
            )}
          </div>
          {(young.parent1AllowImageRights === "true" || young.parent1AllowImageRights === "false") && <MiniSwitch value={young.parent1AllowImageRights === "true"} />}
        </div>
        {
          /* lien et relance du droit à l'image du parent 1 si parent1AllowImageRights n'a pas de valeur */
          (young.parent1AllowSNU === "true" || young.parent1AllowSNU === "false") &&
            young.parent1AllowImageRights !== "true" &&
            young.parent1AllowImageRights !== "false" &&
            !readonly && (
              <div className="mt-2 flex items-center justify-between">
                <div
                  className="cursor-pointer italic text-[#1D4ED8]"
                  onClick={() => {
                    copyToClipboard(`${appURL}/representants-legaux/droits-image?token=${young.parent1Inscription2023Token}&parent=1`);
                    toastr.info(translate("COPIED_TO_CLIPBOARD"), "");
                  }}>
                  Copier le lien du formulaire
                </div>
                {young.parent1Email && (
                  <BorderButton
                    mode="blue"
                    onClick={async () => {
                      try {
                        const response = await api.put(`/young-edition/${young._id}/reminder-parent-image-rights`, { parentId: 1 });
                        if (response.ok) {
                          toastr.success(translate("REMINDER_SENT"), "");
                        } else {
                          toastr.error(translate(response.code), "");
                        }
                      } catch (error) {
                        toastr.error(translate(error.code), "");
                      }
                    }}>
                    Relancer
                  </BorderButton>
                )}
              </div>
            )
        }

        {young.parent1AllowSNU === "true" || young.parent1AllowSNU === "false" ? (
          <div className="itemx-center mt-[16px] flex justify-between">
            <div className="grow text-[14px] leading-[20px] text-[#374151]">
              <div className="font-bold">Consentement à la participation</div>
              <div>Accord : {translate(young.parent1AllowSNU) || PENDING_ACCORD}</div>
            </div>
            <MiniSwitch value={young.parent1AllowSNU === "true"} />
          </div>
        ) : (
          !readonly &&
          young.inscriptionDoneDate && (
            <div className="mt-2 flex items-center justify-between">
              <div
                className="cursor-pointer italic text-[#1D4ED8]"
                onClick={() => {
                  copyToClipboard(`${appURL}/representants-legaux/presentation?token=${young.parent1Inscription2023Token}&parent=1`);
                  toastr.info(translate("COPIED_TO_CLIPBOARD"), "");
                }}>
                Copier le lien du formulaire
              </div>
              {young.parent1Email && (
                <BorderButton
                  mode="blue"
                  onClick={async () => {
                    try {
                      const response = await api.get(`/young-edition/${young._id}/remider/1`);
                      if (response.ok) {
                        toastr.success(translate("REMINDER_SENT"), "");
                      } else {
                        toastr.error(translate(response.code), "");
                      }
                    } catch (error) {
                      toastr.error(translate(error.code), "");
                    }
                  }}>
                  Relancer
                </BorderButton>
              )}
            </div>
          )
        )}
        {young.parent2Status && (
          <div className="mt-[24px] border-t-[1px] border-t-[#E5E7EB] pt-[24px]">
            <div className="mb-[16px] flex items-center justify-between text-[16px] font-bold leading-[24px] text-[#242526]">
              <div className="grow">
                {PARENT_STATUS_NAME[young.parent2Status]}{" "}
                <span className="font-normal text-[#6B7280]">
                  {young.parent2FirstName} {young.parent2LastName}
                </span>
              </div>
              {young.parent2ValidationDate && (
                <div className="whitespace-nowrap text-[13px] font-normal text-[#1F2937]">{dayjs(young.parent2ValidationDate).locale("fr").format("DD/MM/YYYY HH:mm")}</div>
              )}
            </div>
            {young.parent1AllowImageRights === "true" && (
              <>
                <div className="mt-[16px] flex items-center justify-between">
                  <div className="grow text-[14px] leading-[20px] text-[#374151]">
                    <div className="font-bold">Droit à l&apos;image</div>
                    <div className="flex items-center">
                      <div>Accord : {translate(young.parent2AllowImageRights) || PENDING_ACCORD}</div>
                      {(young.parent2AllowImageRights === "true" || young.parent2AllowImageRights === "false") && !readonly && young.parent2Email && (
                        <a href="#" className="ml-4 block text-blue-600 underline" onClick={(e) => confirmImageRightsChange(2, e)}>
                          Modifier
                        </a>
                      )}
                    </div>
                    {environment !== "production" && (young.parent2AllowImageRights === "true" || young.parent2AllowImageRights === "false") && (
                      <ButtonLight className="mt-2" onClick={downloadImageRightDocument}>
                        Télécharger le droit à l&apos;image {pdfDownloading}
                      </ButtonLight>
                    )}
                  </div>
                  {(young.parent2AllowImageRights === "true" || young.parent2AllowImageRights === "false") && <MiniSwitch value={young.parent2AllowImageRights === "true"} />}
                </div>
                {
                  /* lien et relance du droit à l'image du parent 2 si parent2AllowImageRights n'a pas de valeur  et que le droit à l'image a été réinitialisé
                   * on envoit alors vers le formulaire de modification du droit à l'image */
                  young.parent2AllowImageRights !== "true" && young.parent2AllowImageRights !== "false" && young.parent2AllowImageRightsReset === "true" && !readonly && (
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="cursor-pointer italic text-[#1D4ED8]"
                        onClick={() => {
                          copyToClipboard(`${appURL}/representants-legaux/droits-image2?token=${young.parent2Inscription2023Token}&parent=2`);
                          toastr.info(translate("COPIED_TO_CLIPBOARD"), "");
                        }}>
                        Copier le lien du formulaire
                      </div>
                      {young.parent2Email && (
                        <BorderButton
                          mode="blue"
                          onClick={async () => {
                            try {
                              const response = await api.put(`/young-edition/${young._id}/reminder-parent-image-rights`, { parentId: 2 });
                              if (response.ok) {
                                toastr.success(translate("REMINDER_SENT"), "");
                              } else {
                                toastr.error(translate(response.code), "");
                              }
                            } catch (error) {
                              toastr.error(translate(error.code), "");
                            }
                          }}>
                          Relancer
                        </BorderButton>
                      )}
                    </div>
                  )
                }
              </>
            )}
            {
              /* lien et relance du consentement (droit à l'image) du parent 2 si parent2AllowImageRights n'a jamais eu de valeur (première demande)
               * on envoit alors vers le formulaire complet de consentement du parent 2 */
              young.parent1AllowSNU === "true" &&
                young.parent1AllowImageRights === "true" &&
                young.parent2AllowSNU !== "false" &&
                !young.parent2AllowImageRights &&
                young.parent2AllowImageRightsReset !== "true" &&
                !readonly && (
                  <div className="mt-2 flex items-center justify-between">
                    <div
                      className="cursor-pointer italic text-[#1D4ED8]"
                      onClick={() => {
                        copyToClipboard(`${appURL}/representants-legaux/presentation-parent2?token=${young.parent2Inscription2023Token}`);
                        toastr.info(translate("COPIED_TO_CLIPBOARD"), "");
                      }}>
                      Copier le lien du formulaire
                    </div>
                    {young.parent2Email && (
                      <BorderButton
                        mode="blue"
                        onClick={async () => {
                          try {
                            const response = await api.get(`/young-edition/${young._id}/remider/2`);
                            if (response.ok) {
                              toastr.success(translate("REMINDER_SENT"), "");
                            } else {
                              toastr.error(translate(response.code), "");
                            }
                          } catch (error) {
                            toastr.error(translate(error.code), "");
                          }
                        }}>
                        Relancer
                      </BorderButton>
                    )}
                  </div>
                )
            }
            {[YOUNG_STATUS.VALIDATED, YOUNG_STATUS.WAITING_VALIDATION, YOUNG_STATUS.WAITING_LIST, YOUNG_STATUS.WAITING_CORRECTION, YOUNG_STATUS.NOT_AUTORISED].includes(
              young.status,
            ) ? (
              <div className="mt-[16px] flex items-center justify-between">
                <div className="flex-column flex grow justify-center text-[14px] leading-[20px] text-[#374151]">
                  <div className="font-bold">Consentement à la participation</div>
                  {young.parent2RejectSNUComment && <div>{young.parent2RejectSNUComment}</div>}
                </div>
                {young.parent2AllowSNU === "true" || young.parent2AllowSNU === "false" ? (
                  <div className="flex items-center gap-2 text-sm text-red-500 ">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Refusé
                  </div>
                ) : (
                  !readonly && (
                    <BorderButton mode="red" onClick={parent2RejectSNU}>
                      Déclarer un refus
                    </BorderButton>
                  )
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
      {confirmModal && (
        <ConfirmationModal
          isOpen={true}
          icon={confirmModal.icon}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmLabel || "Confirmer"}
          confirmMode={confirmModal.confirmColor || "blue"}
          onCancel={() => setConfirmModal(null)}
          onConfirm={confirmModal.confirm}
        />
      )}
    </Section>
  );
}

function SectionOldConsentements({ young }) {
  return (
    <Section title="Consentements" collapsable>
      <div className="flex-[1_0_50%] pr-[56px]">
        <div className="text-[16px] font-medium leading-[24px] text-[#242526]">
          Consentements validés par {young.firstName} {young.lastName}
        </div>
        <div>
          <ul className="ml-[24px] list-outside">
            <li className="mt-[16px]">A lu et accepte les Conditions générales d&apos;utilisation de la plateforme du Service national universel&nbsp;;</li>
            <li className="mt-[16px]">A pris connaissance des modalités de traitement de mes données personnelles&nbsp;;</li>
            <li className="mt-[16px]">
              Est volontaire, sous le contrôle des représentants légaux, pour effectuer la session {young.cohort} du Service National Universel qui comprend la participation au
              séjour de cohésion puis la réalisation d&apos;une mission d&apos;intérêt général&nbsp;;
            </li>
            <li className="mt-[16px]">Certifie l&apos;exactitude des renseignements fournis&nbsp;;</li>
            <li className="mt-[16px]">
              Si en terminale, a bien pris connaissance que si je suis convoqué(e) pour les épreuves du second groupe du baccalauréat entre le 6 et le 8 juillet 2022, je ne pourrai
              pas participer au séjour de cohésion entre le 3 et le 15 juillet 2022(il n’y aura ni dérogation sur la date d’arrivée au séjour de cohésion ni report des épreuves).
            </li>
          </ul>
        </div>
      </div>
      <div className="my-[73px] w-[1px] flex-[0_0_1px] bg-[#E5E7EB]" />
      <div className="flex-[1_0_50%] pl-[56px] pb-[32px]">
        <div className="text-[16px] font-medium leading-[24px] text-[#242526]">Consentements validés par ses représentants légaux</div>
        <div>
          <ul className="ml-[24px] list-outside">
            <li className="mt-[16px]">Confirmation d&apos;être titulaire de l&apos;autorité parentale/le représentant légal du volontaire&nbsp;;</li>
            <li className="mt-[16px]">
              Autorisation du volontaire à participer à la session {young.cohort} du Service National Universel qui comprend la participation au séjour de cohésion puis la
              réalisation d&apos;une mission d&apos;intérêt général&nbsp;;
            </li>
            <li className="mt-[16px]">Engagement à renseigner le consentement relatif aux droits à l&apos;image avant le début du séjour de cohésion&nbsp;;</li>
            <li className="mt-[16px]">Engagement à renseigner l&apos;utilisation d&apos;autotest COVID avant le début du séjour de cohésion&nbsp;;</li>
            <li className="mt-[16px]">
              Engagement à remettre sous pli confidentiel la fiche sanitaire ainsi que les documents médicaux et justificatifs nécessaires à son arrivée au centre de séjour de
              cohésion&nbsp;;
            </li>
            <li className="mt-[16px]">
              Engagement à ce que le volontaire soit à jour de ses vaccinations obligatoires, c&apos;est-à-dire anti-diphtérie, tétanos et poliomyélite (DTP), et pour les
              volontaires résidents de Guyane, la fièvre jaune.
            </li>
          </ul>
        </div>
        {young.parent2Status && <div className="mt-[24px] border-t-[1px] border-t-[#E5E7EB] pt-[24px]"></div>}
      </div>
    </Section>
  );
}

function CheckRead({ value, children }) {
  return (
    <div className="mt-[16px] flex items-center">
      <div className="mr-[24px] flex h-[14px] w-[14px] flex-[0_0_14px] items-center justify-center rounded-[4px] bg-[#E5E5E5] text-[#666666]">
        {value && <Check className="h-[8px] w-[11px]" />}
      </div>
      <div className="grow text-[14px] leading-[19px] text-[#3A3A3A]">{children}</div>
    </div>
  );
}

function Section({ step, title, editable, collapsable, children, mode, onChangeMode, onSave, onCancel, saving = false, containerNoFlex = false }) {
  const [collapsed, setCollapsed] = useState(false);

  function startEdit() {
    // history.push(`/volontaire/${young._id}/edit`);
    onChangeMode && onChangeMode("edition");
  }

  function stopEdit() {
    onChangeMode && onChangeMode("default");
    onCancel && onCancel();
  }

  return (
    <div className="relative mb-[24px] rounded-[8px] bg-[#FFFFFF] shadow-[0px_8px_16px_-3px_rgba(0,0,0,0.05)]">
      <h2 className={`border-[1px] border-[#E5E7EB] py-[28px] text-[18px] font-medium leading-snug ${mode === "edition" ? "pl-[28px] text-left" : "text-center"}`}>
        {step && <span className="text-[#6B7280]">{step} </span>}
        <span className="text-[#242526]">{title}</span>
      </h2>
      {editable && !saving && (
        <>
          {mode === "edition" ? (
            <div className="absolute top-[24px] right-[24px] flex items-center">
              <RoundButton onClick={stopEdit} mode="grey">
                Annuler
              </RoundButton>
              <RoundButton className="ml-[8px]" onClick={onSave}>
                <Pencil stroke="#2563EB" className="mr-[6px] h-[12px] w-[12px]" />
                Enregistrer les changements
              </RoundButton>
            </div>
          ) : (
            <RoundButton className="absolute top-[24px] right-[24px]" onClick={startEdit}>
              <Pencil stroke="#2563EB" className="mr-[6px] h-[12px] w-[12px]" />
              Modifier
            </RoundButton>
          )}
        </>
      )}
      {saving && <div className="absolute top-[30px] right-[24px] text-[14px] text-[#6B7280]">Enregistrement en cours...</div>}
      {collapsable && (
        <div
          className="absolute top-[24px] right-[24px] flex h-[40px] w-[40px] cursor-pointer items-center justify-center text-[#9CA3AF] hover:text-[#242526]"
          onClick={() => setCollapsed(!collapsed)}>
          <ChevronDown className={collapsed ? "" : "rotate-180"} />
        </div>
      )}
      <div className={`p-[32px] ${collapsed ? "hidden" : containerNoFlex ? "block" : "flex"}`}>{children}</div>
    </div>
  );
}

function getCorrectionRequest(requests, field) {
  return requests.find((req) => {
    return req.field === field;
  });
}

function HonorCertificate({ young }) {
  let cniExpired = false;
  if (young && young.cohort && young.latestCNIFileExpirationDate) {
    const cohortDate = START_DATE_SESSION_PHASE1[young.cohort];
    if (cohortDate) {
      cniExpired = new Date(young.latestCNIFileExpirationDate).valueOf() < cohortDate.valueOf();
    }
  }

  async function remind() {
    try {
      await api.post(`/correction-request/${young._id}/remind-cni`, {});
      toastr.success("Le représentant légal a été relancé.");
    } catch (err) {
      toastr.error("Erreur !", "Nous n'avons pas pu envoyer la relance. Veuillez réessayer dans quelques instants.");
    }
  }

  if (cniExpired) {
    return (
      <div className="mt-[8px] flex items-center justify-between">
        <MiniTitle>Attestation sur l&apos;honneur</MiniTitle>
        <div className="flex items-center">
          <div className="rounded-[100px] border-[1px] border-[#CECECE] bg-[#FFFFFF] py-[3px] px-[10px] text-[12px] font-normal">
            {young.parentStatementOfHonorInvalidId === "true" ? "Validée" : "En attente"}
          </div>
          {young.parentStatementOfHonorInvalidId !== "true" && young.parent1Email && (
            <BorderButton className="ml-[8px]" onClick={remind}>
              Relancer
            </BorderButton>
          )}
        </div>
      </div>
    );
  } else {
    return null;
  }
}

function validateEmpty(value, name, errors, message = "Ne peut être vide") {
  // console.log("test ", name, value, !value[name] || validator.isEmpty(value[name], { ignore_whitespace: true }));
  if (!value[name] || validator.isEmpty(value[name], { ignore_whitespace: true })) {
    errors[name] = message;
    return false;
  } else {
    return true;
  }
}
