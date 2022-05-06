import React, { useState, useEffect } from "react";
import { ReactiveBase, MultiDropdownList, DataSearch } from "@appbaseio/reactivesearch";
import { useParams } from "react-router";
import { toastr } from "react-redux-toastr";

import { apiURL } from "../../../config";
import FilterSvg from "../../../assets/icons/Filter";
import api from "../../../services/api";
import Panel from "../../volontaires/panel";
import { RegionFilter, DepartmentFilter } from "../../../components/filters";
import ModalPointageFicheSanitaire from "../components/modals/ModalPointageFicheSanitaire";
import { getFilterLabel, translate, translatePhase1, getAge } from "../../../utils";
import Loader from "../../../components/Loader";
import { Filter2, FilterRow, ResultTable } from "../../../components/list";
const FILTERS = ["SEARCH", "STATUS", "COHORT", "DEPARTMENT", "REGION", "STATUS_PHASE_1", "STATUS_PHASE_2", "STATUS_PHASE_3", "STATUS_APPLICATION", "LOCATION", "COHESION_PRESENCE"];
import ReactiveListComponent from "../../../components/ReactiveListComponent";

export default function FicheSanitaire() {
  const [young, setYoung] = useState();
  const [focusedSession, setFocusedSession] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const { sessionId } = useParams();

  const getDefaultQuery = () => ({
    query: {
      bool: { filter: [{ terms: { "status.keyword": ["VALIDATED", "WITHDRAWN", "WAITING_LIST"] } }, { term: { "sessionPhase1Id.keyword": focusedSession?._id.toString() } }] },
    },
    sort: [{ "lastName.keyword": "asc" }],
    track_total_hits: true,
  });

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data } = await api.get(`/session-phase1/${sessionId}`);
      setFocusedSession(data);
    })();
  }, [sessionId]);

  const handleClick = async (young) => {
    const { ok, data } = await api.get(`/referent/young/${young._id}`);
    if (ok) setYoung(data);
  };

  if (!focusedSession) return <Loader />;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: "1" }}>
        <div>
          <ReactiveBase url={`${apiURL}/es`} app={`sessionphase1young/${focusedSession._id}`} headers={{ Authorization: `JWT ${api.getToken()}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", width: "100%", height: "100%" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Filter2>
                  <div className="flex items-center mb-2 gap-2">
                    <DataSearch
                      defaultQuery={getDefaultQuery}
                      showIcon={false}
                      placeholder="Rechercher par prénom, nom, email, ville, code postal..."
                      componentId="SEARCH"
                      dataField={["email.keyword", "firstName.folded", "lastName.folded", "city.folded", "zip"]}
                      react={{ and: FILTERS.filter((e) => e !== "SEARCH") }}
                      // fuzziness={2}
                      innerClass={{ input: "searchbox" }}
                      autosuggest={false}
                      queryFormat="and"
                    />
                    <div
                      className="flex gap-2 items-center px-3 py-2 rounded-lg bg-gray-100 text-[14px] font-medium text-gray-700 cursor-pointer hover:underline"
                      onClick={() => setFilterVisible((e) => !e)}>
                      <FilterSvg className="text-gray-400" />
                      Filtres
                    </div>
                  </div>
                  <FilterRow visible={filterVisible}>
                    <RegionFilter defaultQuery={getDefaultQuery} filters={FILTERS} />
                    <DepartmentFilter defaultQuery={getDefaultQuery} filters={FILTERS} />
                    <MultiDropdownList
                      defaultQuery={getDefaultQuery}
                      className="dropdown-filter"
                      componentId="STATUS"
                      dataField="status.keyword"
                      react={{ and: FILTERS.filter((e) => e !== "STATUS") }}
                      renderItem={(e, count) => {
                        return `${translate(e)} (${count})`;
                      }}
                      title=""
                      URLParams={true}
                      showSearch={false}
                      renderLabel={(items) => getFilterLabel(items, "Statut")}
                    />
                    <MultiDropdownList
                      defaultQuery={getDefaultQuery}
                      className="dropdown-filter"
                      componentId="STATUS_PHASE_1"
                      dataField="statusPhase1.keyword"
                      react={{ and: FILTERS.filter((e) => e !== "STATUS_PHASE_1") }}
                      renderItem={(e, count) => {
                        return `${translatePhase1(e)} (${count})`;
                      }}
                      title=""
                      URLParams={true}
                      showSearch={false}
                      renderLabel={(items) => getFilterLabel(items, "Statut phase 1")}
                    />
                    <MultiDropdownList
                      defaultQuery={getDefaultQuery}
                      className="dropdown-filter"
                      componentId="COHESION_PRESENCE"
                      dataField="cohesionStayPresence.keyword"
                      react={{ and: FILTERS.filter((e) => e !== "COHESION_PRESENCE") }}
                      renderItem={(e, count) => {
                        return `${translate(e)} (${count})`;
                      }}
                      title=""
                      URLParams={true}
                      showSearch={false}
                      renderLabel={(items) => getFilterLabel(items, "Participations au séjour de cohésion")}
                      showMissing
                      missingLabel="Non renseigné"
                    />
                  </FilterRow>
                </Filter2>
                <ResultTable>
                  <ReactiveListComponent
                    defaultQuery={getDefaultQuery}
                    react={{ and: FILTERS }}
                    dataField="lastName.keyword"
                    sortBy="asc"
                    paginationAt="bottom"
                    showTopResultStats={false}
                    render={({ data }) => (
                      <table className="w-full">
                        <thead className="">
                          <tr className="text-xs uppercase text-gray-400 border-y-[1px] border-gray-100">
                            <th className="py-3 pl-4">Volontaire</th>
                            <th className="">Fiche Sanitaire</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.map((hit) => (
                            <Line key={hit._id} hit={hit} onClick={() => handleClick(hit)} selected={young?._id === hit._id} />
                          ))}
                        </tbody>
                      </table>
                    )}
                  />
                </ResultTable>
              </div>
            </div>
          </ReactiveBase>
        </div>
      </div>
      <Panel
        value={young}
        onChange={() => {
          setYoung(null);
        }}
      />
    </div>
  );
}

const Line = ({ hit, onClick, selected }) => {
  const [value, setValue] = useState(null);
  const [modalPointageFicheSanitaire, setModalPointageFicheSanitaire] = useState({ isOpen: false });

  useEffect(() => {
    setValue(hit);
  }, [hit._id]);

  if (!value) return <></>;

  const bgColor = selected && "bg-snu-purple-300";
  const mainTextColor = selected ? "text-white" : "text-[#242526]";
  const secondTextColor = selected ? "text-blue-100" : "text-[#738297]";

  const ficheSanitaireBgColor = value.cohesionStayMedicalFileReceived === "false" && "bg-gray-100";
  const ficheSanitaireTextColor = !value.cohesionStayMedicalFileReceived && "text-gray-400";

  const onSubmit = async (v) => {
    // todo route api expres pour changer les présences de phase1
    const { data, ok, code } = await api.put(`/referent/young/${value._id}`, v);
    if (!ok) return toastr.error("Oups, une erreur s'est produite", translate(code));
    setValue(data);
    setModalPointageFicheSanitaire({ isOpen: false, value: null });
  };

  return (
    <>
      <tr className={`${!selected && "hover:!bg-gray-100"}`} onClick={onClick}>
        <td className={`${bgColor} py-3 pl-4 ml-2 rounded-l-lg`}>
          <div>
            <div className={`font-bold ${mainTextColor} text-[15px]`}>{`${hit.firstName} ${hit.lastName}`}</div>
            <div className={`font-normal text-xs ${secondTextColor}`}>
              {hit.birthdateAt ? `${getAge(hit.birthdateAt)} ans` : null} {`• ${hit.city || ""} (${hit.department || ""})`}
            </div>
          </div>
        </td>
        <td className={`${bgColor}`}>
          <div className="font-normal text-xs text-[#242526]" onClick={(e) => e.stopPropagation()}>
            <select
              className={`border-[1px] border-gray-200 rounded-lg text-black py-2 px-3 cursor-pointer ${ficheSanitaireBgColor} ${ficheSanitaireTextColor}`}
              value={value.cohesionStayMedicalFileReceived || ""}
              onChange={(e) => {
                setModalPointageFicheSanitaire({
                  isOpen: true,
                  value: e.target.value,
                });
              }}
              style={{ fontFamily: "Marianne" }}>
              <option disabled label="Fiche sanitaire">
                Présence à l&apos;arrivée
              </option>
              {[
                { label: "Non renseignée", value: "", disabled: true, hidden: true },
                { label: "Réceptionnée", value: "true" },
                { label: "Non réceptionnée", value: "false" },
              ].map((option, i) => (
                <option key={i} value={option.value} label={option.label} disabled={option.disabled} hidden={option.hidden}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </td>
      </tr>
      <ModalPointageFicheSanitaire
        isOpen={modalPointageFicheSanitaire?.isOpen}
        onCancel={() => setModalPointageFicheSanitaire({ isOpen: false, value: null })}
        onSubmit={onSubmit}
        value={modalPointageFicheSanitaire?.value}
        young={value}
      />
    </>
  );
};
