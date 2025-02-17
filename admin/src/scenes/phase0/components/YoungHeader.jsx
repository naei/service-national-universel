import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toastr } from "react-redux-toastr";
import { useHistory } from "react-router-dom";
import {
  canViewEmailHistory,
  canViewNotes,
  ROLES,
  SENDINBLUE_TEMPLATES,
  translate,
  translateInscriptionStatus,
  WITHRAWN_REASONS,
  YOUNG_PHASE,
  YOUNG_STATUS,
  YOUNG_STATUS_PHASE1,
} from "snu-lib";
import Bin from "../../../assets/Bin";
import ChevronDown from "../../../assets/icons/ChevronDown";
import History from "../../../assets/icons/History";
import TakePlace from "../../../assets/icons/TakePlace";
import Warning from "../../../assets/icons/Warning";
import Badge from "../../../components/Badge";
import TabList from "../../../components/views/TabList";
import Title from "../../../components/views/Title";
import { appURL } from "../../../config";
import api from "../../../services/api";
import plausibleEvent from "../../../services/plausible";
import { Button } from "./Buttons";
import { ChangeCohortPen } from "./ChangeCohortPen";
import ConfirmationModal from "./ConfirmationModal";
import Field from "./Field";
import Tab from "./Tab";
import PhaseStatusSelector from "./PhaseStatusSelector";
import NoteIcon from "../../volontaires/view/notes/components/NoteIcon";
import { PHASE_1, PHASE_2, PHASE_3, PHASE_INSCRIPTION } from "../../volontaires/view/notes/utils";
import NoteDisplayModal from "../../volontaires/view/notes/components/NoteDisplayModal";
import ModalConfirmDeleteYoung from "../../../components/modals/young/ModalConfirmDeleteYoung";

const blueBadge = { color: "#66A7F4", backgroundColor: "#F9FCFF" };
const greyBadge = { color: "#9A9A9A", backgroundColor: "#F6F6F6" };

export default function YoungHeader({ young, tab, onChange, phase = YOUNG_PHASE.INSCRIPTION, isStructure = false, applicationId = null }) {
  const user = useSelector((state) => state.Auth.user);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [viewedNotes, setVieweNotes] = useState([]);
  const history = useHistory();
  const [statusOptions, setStatusOptions] = useState([]);
  const [withdrawn, setWithdrawn] = useState({ reason: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (young) {
      let options = [];
      if (user.role === ROLES.ADMIN) {
        options = Object.keys(YOUNG_STATUS).filter((status) => status !== young.status && status !== YOUNG_STATUS.DELETED);
      } else {
        switch (young.status) {
          case YOUNG_STATUS.WAITING_LIST:
            if ([ROLES.REFERENT_DEPARTMENT, ROLES.REFERENT_REGION].includes(user.role)) {
              options = [YOUNG_STATUS.WITHDRAWN];
            } else {
              options = [YOUNG_STATUS.VALIDATED, YOUNG_STATUS.WITHDRAWN];
            }
            break;
          case YOUNG_STATUS.WITHDRAWN:
            if (user.role === ROLES.ADMIN) {
              options = [YOUNG_STATUS.VALIDATED, YOUNG_STATUS.WAITING_LIST];
            }
            break;
          case YOUNG_STATUS.VALIDATED:
            options = [YOUNG_STATUS.WITHDRAWN];
            break;
        }
      }
      setStatusOptions(options.map((opt) => ({ value: opt, label: translateInscriptionStatus(opt) })));
    } else {
      setStatusOptions([]);
    }
  }, [young]);

  const setViewedNoteParPhase = (phase) => () => {
    setVieweNotes(getNotesByPhase(phase));
  };

  const handleDeleteYoung = () => {
    setIsConfirmDeleteModalOpen(true);
  };

  const handleCancelDeleteYoung = () => {
    setIsConfirmDeleteModalOpen(false);
  };

  const handleDeleteYoungSuccess = () => {
    setIsConfirmDeleteModalOpen(false);
    history.push(`/volontaire/${young._id}`);
  };

  const onSelectStatus = (status) => {
    setWithdrawn({ reason: "", message: "", error: null });
    setConfirmModal({
      icon: <Warning className="h-[36px] w-[36px] text-[#D1D5DB]" />,
      title: "Modification de statut",
      message: `Êtes-vous sûr(e) de vouloir modifier le statut de ce profil? Un email sera automatiquement envoyé à l'utlisateur.`,
      type: status,
    });
  };

  const withdrawnReasonOptions = [
    <option key="none" value="">
      Motif
    </option>,
    ...WITHRAWN_REASONS.filter((r) => !r.cohortOnly || r.cohortOnly.includes(young.cohort)).map((reason) => (
      <option key={reason.value} value={reason.value}>
        {reason.label}
      </option>
    )),
  ];

  const onConfirmStatus = async () => {
    if (confirmModal.type === YOUNG_STATUS.WITHDRAWN) {
      if (withdrawn.reason === "") {
        setWithdrawn({ ...withdrawn, error: "Vous devez obligatoirement sélectionner un motif." });
        return;
      } else if (withdrawn.reason === "other" && withdrawn.message.trim().length === 0) {
        setWithdrawn({ ...withdrawn, error: "Pour le motif 'Autre', vous devez précisez un message." });
        return;
      } else {
        setWithdrawn({ ...withdrawn, error: null });
      }
      await changeStatus(confirmModal.type, { withdrawnReason: withdrawn.reason, withdrawnMessage: withdrawn.message });
    } else {
      await changeStatus(confirmModal.type);
    }
  };

  async function changeStatus(status, values = {}) {
    const prevStatus = young.status;
    if (status === "WITHDRAWN") {
      young.historic.push({
        phase,
        userName: `${user.firstName} ${user.lastName}`,
        userId: user._id,
        status,
        note: WITHRAWN_REASONS.find((r) => r.value === values?.withdrawnReason)?.label + " " + values?.withdrawnMessage,
      });
    } else {
      young.historic.push({ phase, userName: `${user.firstName} ${user.lastName}`, userId: user._id, status, note: values?.note });
    }
    young.status = status;
    const now = new Date();
    young.lastStatusAt = now.toISOString();
    if (status === "WITHDRAWN" && (values?.withdrawnReason || values?.withdrawnMessage)) {
      young.withdrawnReason = values?.withdrawnReason;
      young.withdrawnMessage = values?.withdrawnMessage || "";
    }
    if (status === "WAITING_CORRECTION" && values?.note) young.inscriptionCorrectionMessage = values?.note;
    if (status === "REFUSED" && values?.note) young.inscriptionRefusedMessage = values?.note;
    if (status === YOUNG_STATUS.VALIDATED && phase === YOUNG_PHASE.INTEREST_MISSION) young.phase = YOUNG_PHASE.CONTINUE;
    try {
      // we decided to let the validated youngs in the INSCRIPTION phase
      // referents use the export and need ALL the youngs of the current year
      // we'll pass every youngs currently in INSCRIPTION in COHESION_STAY once the campaign is done (~20 april 2021)

      // if (status === YOUNG_STATUS.VALIDATED && young.phase === YOUNG_PHASE.INSCRIPTION) {
      //   young.phase = YOUNG_PHASE.COHESION_STAY;
      // }

      const { lastStatusAt, withdrawnMessage, phase, inscriptionCorrectionMessage, inscriptionRefusedMessage, withdrawnReason } = young;

      const { ok, code } = await api.put(`/referent/young/${young._id}`, {
        status: young.status,
        lastStatusAt,
        withdrawnMessage,
        phase,
        inscriptionCorrectionMessage,
        inscriptionRefusedMessage,
        withdrawnReason,
      });
      if (!ok) return toastr.error("Une erreur s'est produite :", translate(code));

      if (status === YOUNG_STATUS.VALIDATED && phase === YOUNG_PHASE.INSCRIPTION) {
        if (prevStatus === "WITHDRAWN") await api.post(`/young/${young._id}/email/${SENDINBLUE_TEMPLATES.young.INSCRIPTION_REACTIVATED}`);
        else await api.post(`/young/${young._id}/email/${SENDINBLUE_TEMPLATES.young.INSCRIPTION_VALIDATED}`);
      }
      if (status === YOUNG_STATUS.WAITING_LIST) {
        await api.post(`/young/${young._id}/email/${SENDINBLUE_TEMPLATES.young.INSCRIPTION_WAITING_LIST}`);
      }

      onChange && onChange();
      toastr.success("Mis à jour!");
    } catch (e) {
      console.log(e);
      toastr.error("Oups, une erreur est survenue :", translate(e.code));
    }
  }

  const getNotesByPhase = (phase) => {
    if (!young.notes) return [];
    return young.notes.filter((note) => note.phase === phase);
  };

  const canYoungChangeCohort = () => {
    if (young.status === YOUNG_STATUS.DELETED || user.role === ROLES.HEAD_CENTER) {
      return false;
    }
    if (young.statusPhase1 === YOUNG_STATUS_PHASE1.DONE && [ROLES.REFERENT_REGION, ROLES.REFERENT_DEPARTMENT].includes(user.role)) {
      return false;
    }
    return true;
  };

  return (
    <div className="flex items-end justify-end border-b-[1px] border-b-[#E5E7EB] px-[30px] pt-[15px]">
      <NoteDisplayModal notes={viewedNotes} isOpen={viewedNotes.length > 0} onClose={() => setVieweNotes([])} user={user} />
      <div className={`flex w-full flex-row flex-wrap-reverse items-end justify-end ${user.role === ROLES.HEAD_CENTER ? "pt-[57px]" : ""}`}>
        <div className="grow self-start">
          <Title>
            <div className="mr-[15px]">
              <div className="flex items-center">
                {user.role !== ROLES.HEAD_CENTER && getNotesByPhase("").length > 0 && <NoteIcon className="mr-1" onClick={setViewedNoteParPhase("")} />}
                {young.status === YOUNG_STATUS.DELETED ? "Compte supprimé" : young.firstName + " " + young.lastName}
              </div>
            </div>
            <Badge {...(young.status === YOUNG_STATUS.DELETED ? greyBadge : blueBadge)} text={young.cohort} />
            {canYoungChangeCohort() && (
              <>
                <ChangeCohortPen young={young} onChange={onChange} />
                {young.originalCohort && <Badge {...greyBadge} text={young.originalCohort} tooltipText={`Anciennement ${young.originalCohort}`} style={{ cursor: "default" }} />}
              </>
            )}
          </Title>
          {isStructure ? (
            <TabList className="mt-[30px]">
              {young.status !== YOUNG_STATUS.WAITING_CORRECTION && young.status !== YOUNG_STATUS.WAITING_VALIDATION && user.role !== ROLES.HEAD_CENTER && (
                <Tab isActive={tab === "candidature"} onClick={() => history.push(`/volontaire/${young._id}/phase2/application/${applicationId}`)}>
                  <div className="flex items-center">
                    Candidature{getNotesByPhase(PHASE_2).length > 0 && <NoteIcon id={PHASE_2} className="ml-1 block" onClick={setViewedNoteParPhase(PHASE_2)} />}
                  </div>
                </Tab>
              )}
              <Tab isActive={tab === "dossier"} onClick={() => history.push(`/volontaire/${young._id}/phase2/application/${applicationId}/dossier`)}>
                <div className="flex items-center">
                  Dossier d&apos;inscription
                  {user.role !== ROLES.HEAD_CENTER && getNotesByPhase(PHASE_INSCRIPTION).length > 0 && (
                    <NoteIcon id={PHASE_INSCRIPTION} className="ml-1 block" onClick={setViewedNoteParPhase(PHASE_INSCRIPTION)} />
                  )}
                </div>
              </Tab>
            </TabList>
          ) : (
            <TabList className="mt-[30px]">
              <Tab isActive={tab === "file"} onClick={() => history.push(`/volontaire/${young._id}`)}>
                <div className="flex items-center">
                  Dossier d&apos;inscription
                  {user.role !== ROLES.HEAD_CENTER && getNotesByPhase(PHASE_INSCRIPTION).length > 0 && (
                    <NoteIcon id={PHASE_INSCRIPTION} className="ml-1 block" onClick={setViewedNoteParPhase(PHASE_INSCRIPTION)} />
                  )}
                </div>
              </Tab>
              {young.status !== YOUNG_STATUS.WAITING_CORRECTION && young.status !== YOUNG_STATUS.WAITING_VALIDATION && (
                <>
                  <Tab isActive={tab === "phase1"} onClick={() => history.push(`/volontaire/${young._id}/phase1`)}>
                    <div className="flex items-center">
                      Phase 1{getNotesByPhase(PHASE_1).length > 0 && <NoteIcon id={PHASE_1} className="ml-1 block" onClick={setViewedNoteParPhase(PHASE_1)} />}
                    </div>
                  </Tab>
                  {user.role !== ROLES.HEAD_CENTER && (
                    <>
                      <Tab isActive={tab === "phase2"} onClick={() => history.push(`/volontaire/${young._id}/phase2`)}>
                        <div className="flex items-center">
                          Phase 2{getNotesByPhase(PHASE_2).length > 0 && <NoteIcon id={PHASE_2} className="ml-1 block" onClick={setViewedNoteParPhase(PHASE_2)} />}
                        </div>
                      </Tab>
                      <Tab isActive={tab === "phase3"} onClick={() => history.push(`/volontaire/${young._id}/phase3`)}>
                        <div className="flex items-center">
                          Phase 3{getNotesByPhase(PHASE_3).length > 0 && <NoteIcon id={PHASE_3} className="ml-1 block" onClick={setViewedNoteParPhase(PHASE_3)} />}
                        </div>
                      </Tab>
                    </>
                  )}
                </>
              )}
              {user.role !== ROLES.HEAD_CENTER && (
                <Tab isActive={tab === "historique"} onClick={() => history.push(`/volontaire/${young._id}/historique`)}>
                  <div className="flex items-center">
                    <History className="mr-[4px] block flex-[0_0_18px]" fill={tab === "historique" ? "#3B82F6" : "#9CA3AF"} />
                    Historique
                  </div>
                </Tab>
              )}
              {canViewEmailHistory(user) ? (
                <Tab isActive={tab === "notifications"} onClick={() => history.push(`/volontaire/${young._id}/notifications`)}>
                  Notifications
                </Tab>
              ) : null}
              {user.role !== ROLES.HEAD_CENTER && canViewNotes(user) && (
                <Tab isActive={tab === "notes"} onClick={() => history.push(`/volontaire/${young._id}/notes`)}>
                  {`(${young.notes?.length || 0}) Notes internes`}
                </Tab>
              )}
            </TabList>
          )}
        </div>
        {!isStructure && user.role !== ROLES.HEAD_CENTER && (
          <div className="w-[300px] self-end">
            <div className="relative mb-[15px]">
              <div className="absolute top-[-45px]">
                {young.status === YOUNG_STATUS.VALIDATED && user.role === ROLES.ADMIN && <PhaseStatusSelector young={young} onChange={onChange} />}
              </div>
            </div>
            <Field
              mode="edition"
              name="status"
              label={translate(phase)}
              value={translateInscriptionStatus(young.status)}
              transformer={translate}
              type="select"
              options={statusOptions}
              onChange={onSelectStatus}
              className={young.status === YOUNG_STATUS.DELETED ? "my-[15px]" : ""}
            />
            {young.status !== YOUNG_STATUS.DELETED && (
              <div className="my-[15px] flex items-center justify-between">
                <Button icon={<Bin fill="red" />} onClick={handleDeleteYoung}>
                  Supprimer
                </Button>
                <Button
                  className="ml-[8px]"
                  icon={<TakePlace className="text-[#6B7280]" />}
                  href={`${appURL}/auth/connect?token=${api.getToken()}&young_id=${young._id}`}
                  onClick={() => plausibleEvent("Volontaires/CTA - Prendre sa place")}>
                  Prendre sa place
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <ModalConfirmDeleteYoung isOpen={isConfirmDeleteModalOpen} young={young} onCancel={handleCancelDeleteYoung} onConfirm={handleDeleteYoungSuccess} />
      {confirmModal && (
        <ConfirmationModal
          isOpen={true}
          loading={loading}
          icon={confirmModal.icon}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmLabel || "Confirmer"}
          loadingText={confirmModal.loadingText}
          confirmMode={confirmModal.confirmColor || "blue"}
          onCancel={() => setConfirmModal(null)}
          onConfirm={confirmModal.type ? onConfirmStatus : () => {}}>
          {confirmModal.type === YOUNG_STATUS.WITHDRAWN && (
            <div className="mt-[24px]">
              <div className="mb-[16px] flex w-[100%] items-center rounded-[6px] border-[1px] border-[#D1D5DB] bg-white pr-[15px]">
                <select
                  value={withdrawn.reason}
                  onChange={(e) => {
                    setWithdrawn({ ...withdrawn, reason: e.target.value });
                  }}
                  className="block grow appearance-none bg-[transparent] p-[15px]">
                  {withdrawnReasonOptions}
                </select>
                <ChevronDown className="flex-[0_0_16px] text-[#6B7280]" />
              </div>
              <textarea
                value={withdrawn.message}
                onChange={(e) => {
                  setWithdrawn({ ...withdrawn, message: e.target.value });
                }}
                className="w-[100%] rounded-[6px] border-[1px] border-[#D1D5DB] bg-white p-[15px]"
                rows="5"
                placeholder="Précisez la raison de votre refus ici"
              />
              {withdrawn.error && <div className="text-[#EF4444]">{withdrawn.error}</div>}
            </div>
          )}
        </ConfirmationModal>
      )}
    </div>
  );
}
