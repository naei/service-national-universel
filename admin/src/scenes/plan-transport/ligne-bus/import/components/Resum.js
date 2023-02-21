import React from "react";
import { PlainButton } from "../../../components/Buttons";
import { capture } from "../../../../../sentry";
import { toastr } from "react-redux-toastr";
import api from "../../../../../services/api";
import { useHistory } from "react-router-dom";

export default function Resum({ summary, cohort }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const history = useHistory();

  async function onSubmit() {
    setIsLoading(true);
    try {
      const { ok } = await api.post(`/plan-de-transport/import/${summary._id}/execute`, {});
      if (!ok) {
        toastr.error("Impossible d(importer le plan de transport. Veuillez réessayer dans quelques instants.");
      } else {
        toastr.success("Import réussi.");
        history.push(`/ligne-de-bus?cohort=${cohort}`);
      }
    } catch (err) {
      capture(err);
      toastr.error("Une erreur interne est survenue pendant l'import. Veuillez réessayer dans quelques instants.");
    }
    setIsLoading(false);
  }

  return (
    <>
      <div className="flex flex-col w-full rounded-xl bg-white mt-8 pt-12 pb-24 px-8 gap-6">
        <div className="text-xl leading-7 font-medium text-gray-900 text-center pb-4">Vous vous apprêtez à importer...</div>
        <div className="flex items-stretch justify-center gap-6 pt-6 pb-12">
          <div className="flex flex-col px-4 rounded-xl bg-gray-100 w-52 h-32 justify-center">
            <div className="text-[42px] leading-[120%] font-extrabold text-gray-800">{summary.busLineCount}</div>
            <dic className="text-xs leading-5 font-medium text-gray-800">lignes de transport</dic>
          </div>
          <div className="flex flex-col px-4 rounded-xl bg-gray-100 w-52 h-32 justify-center">
            <div className="text-[42px] leading-[120%] font-extrabold text-gray-800">{summary.centerCount}</div>
            <dic className="text-xs leading-5 font-medium text-gray-800">centres de cohésion</dic>
          </div>
          <div className="flex flex-col px-4 rounded-xl bg-gray-100 w-52 h-32 justify-center">
            <div className="text-[42px] leading-[120%] font-extrabold text-gray-800">{summary.pdrCount}</div>
            <dic className="text-xs leading-5 font-medium text-gray-800">points de rassemblement</dic>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <PlainButton className="w-52" disabled={isLoading} spinner={isLoading} onClick={onSubmit}>
          Importer
        </PlainButton>
      </div>
    </>
  );
}
