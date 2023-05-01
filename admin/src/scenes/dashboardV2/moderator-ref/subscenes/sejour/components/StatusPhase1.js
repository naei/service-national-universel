import React from "react";
// import StatusText from "./StatusText";
import { getLink as getOldLink } from "../../../../../../utils";
import { Link } from "react-router-dom";

export default function StatusPhase1({ statusPhase1, total, filter }) {
  const WAITING_AFFECTATION = statusPhase1?.WAITING_AFFECTATION || 0;
  const AFFECTED = statusPhase1?.AFFECTED || 0;
  const DONE = statusPhase1?.DONE || 0;
  const NOT_DONE = statusPhase1?.NOT_DONE || 0;
  const EXEMPTED = statusPhase1?.EXEMPTED || 0;

  return (
    <div className="flex h-[220px] w-[70%] flex-col gap-6 rounded-lg bg-white px-8 py-6 shadow-[0_8px_16px_-3px_rgba(0,0,0,0.05)]">
      <p className="text-base font-bold leading-5 text-gray-900">Statut de phase 1</p>
      <div className="flex">
        <div className="flex w-[45%] flex-col gap-2">
          <StatusText
            status="En attente d'affectation"
            nb={WAITING_AFFECTATION}
            percentage={total && WAITING_AFFECTATION ? ((WAITING_AFFECTATION / total) * 100).toFixed(0) : 0}
            filter={filter}
            base="/volontaire"
            filtersUrl={['STATUS_PHASE_1=%5B"WAITING_AFFECTATION"%5D']}
          />
          <StatusText
            status="Affectée"
            nb={AFFECTED || 0}
            percentage={total && AFFECTED ? ((AFFECTED / total) * 100).toFixed(0) : 0}
            filter={filter}
            base="/volontaire"
            filtersUrl={['STATUS_PHASE_1=%5B"AFFECTED"%5D']}
          />
          <StatusText
            status="Validée"
            nb={DONE || 0}
            percentage={total && DONE ? ((DONE / total) * 100).toFixed(0) : 0}
            filter={filter}
            base="/volontaire"
            filtersUrl={['STATUS_PHASE_1=%5B"DONE"%5D']}
          />
        </div>
        <div className="flex w-[10%] items-center justify-center">
          <div className="h-3/5 w-[1px] border-r-[1px] border-gray-300"></div>
        </div>
        <div className="flex w-[45%] flex-col gap-1">
          <StatusText
            status="Non réalisée"
            nb={NOT_DONE || 0}
            percentage={total && NOT_DONE ? ((NOT_DONE / total) * 100).toFixed(0) : 0}
            filter={filter}
            base="/volontaire"
            filtersUrl={['STATUS_PHASE_1=%5B"NOT_DONE"%5D']}
          />
          <StatusText
            status="Dispensée"
            nb={EXEMPTED || 0}
            percentage={total && EXEMPTED ? ((EXEMPTED / total) * 100).toFixed(0) : 0}
            filter={filter}
            base="/volontaire"
            filtersUrl={['STATUS_PHASE_1=%5B"EXEMPTED"%5D']}
          />
        </div>
      </div>
    </div>
  );
}

function StatusText({ status, nb, percentage, filter, filtersUrl, base }) {
  return (
    <Link className="flex items-center justify-between gap-2" to={getOldLink({ base, filter, filtersUrl })} target={"_blank"}>
      <div className="flex w-[80%] items-center justify-start gap-2">
        <span className="w-[20%] text-lg font-bold text-gray-900">{nb}</span>
        <div className="flex w-[80%] items-center text-left text-sm text-gray-600">{status}</div>
      </div>
      <p className="text-sm text-gray-400">({percentage}%)</p>
    </Link>
  );
}

{
  /* <div className="flex w-[80%] items-center justify-start gap-2">
  <span className="w-[20%] text-lg font-bold text-gray-900">{nb}</span>
  <div className="flex w-[80%] items-center text-left text-sm text-gray-600">
    {status}
    {infoPanel && <MoreInfoPanel className="inline-block">{infoPanel}</MoreInfoPanel>}
  </div>
</div>
<p className="text-sm text-gray-400">({percentage}%)</p>
</div> */
}
