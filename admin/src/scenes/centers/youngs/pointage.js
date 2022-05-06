import React, { useState, useEffect } from "react";
import { ReactiveBase, MultiDropdownList, DataSearch } from "@appbaseio/reactivesearch";
import { toastr } from "react-redux-toastr";
import { useParams } from "react-router";

import { apiURL } from "../../../config";
import SelectStatus from "../../../components/selectStatus";
import Badge from "../../../components/Badge";
import FilterSvg from "../../../assets/icons/Filter";
import api from "../../../services/api";
import Panel from "../../volontaires/panel";
import Chevron from "../../../components/Chevron";
import { RegionFilter, DepartmentFilter } from "../../../components/filters";
import Select from "../../volontaires-head-center/components/Select";
import ModalConfirm from "../../../components/modals/ModalConfirm";
import {
  getFilterLabel,
  YOUNG_STATUS_PHASE1,
  translate,
  translatePhase1,
  translatePhase2,
  formatDateFRTimezoneUTC,
  isInRuralArea,
  formatLongDateFR,
  getAge,
  colors,
  getLabelWithdrawnReason,
  confirmMessageChangePhase1Presence,
  ES_NO_LIMIT,
  PHASE1_HEADCENTER_OPEN_ACCESS_CHECK_PRESENCE,
  YOUNG_STATUS_COLORS,
} from "../../../utils";
import Loader from "../../../components/Loader";
import { Filter2, FilterRow, ResultTable } from "../../../components/list";
const FILTERS = ["SEARCH", "STATUS", "COHORT", "DEPARTMENT", "REGION", "STATUS_PHASE_1", "STATUS_PHASE_2", "STATUS_PHASE_3", "STATUS_APPLICATION", "LOCATION", "COHESION_PRESENCE"];
import ReactiveListComponent from "../../../components/ReactiveListComponent";

export default function General({ updateCenter }) {
  const [young, setYoung] = useState();
  const [center, setCenter] = useState(null);
  const [meetingPoints, setMeetingPoints] = useState(null);
  const [focusedSession, setFocusedSession] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const { id, sessionId } = useParams();

  const getDefaultQuery = () => ({
    query: {
      bool: { filter: [{ terms: { "status.keyword": ["VALIDATED", "WITHDRAWN", "WAITING_LIST"] } }, { term: { "sessionPhase1Id.keyword": focusedSession?._id.toString() } }] },
    },
    sort: [{ "lastName.keyword": "asc" }],
    track_total_hits: true,
  });
  const getExportQuery = () => ({ ...getDefaultQuery(), size: ES_NO_LIMIT });

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/meeting-point/all");
      setMeetingPoints(data);
    })();
  }, []);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await api.get(`/cohesion-center/${id}`);
      setCenter(data);
    })();
  }, [id]);
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
                            <th className="">Présence à l&apos;arrivée</th>
                            <th className="">Présence JDM</th>
                            <th className="">Départ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.map((hit) => (
                            <Line key={hit._id} hit={hit} onClick={() => handleClick(hit)} selected={young?._id === hit._id} onChangeYoung={updateCenter} />
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

const Line = ({ hit, onClick, selected, onChangeYoung }) => {
  const [value, setValue] = useState(null);

  useEffect(() => {
    setValue(hit);
  }, [hit._id]);

  if (!value) return <></>;

  const bgColor = selected && "bg-snu-purple-300";
  const mainTextColor = selected ? "text-white" : "text-[#242526]";
  const secondTextColor = selected ? "text-blue-100" : "text-[#738297]";

  return (
    <tr className={`${!selected && "hover:!bg-gray-100"}`} onClick={onClick}>
      <td className={`${bgColor} py-3 pl-4 ml-2 rounded-l-lg`}>
        <div>
          <div className={`font-bold ${mainTextColor} text-[15px]`}>{`${hit.firstName} ${hit.lastName}`}</div>
          <div className={`font-normal text-xs ${secondTextColor}`}>
            {hit.birthdateAt ? `${getAge(hit.birthdateAt)} ans` : null} {`• ${hit.city || ""} (${hit.department || ""})`}
          </div>
        </div>
      </td>
      <td>
        <div className="font-normal text-xs text-[#242526]">{translate(value.cohesionStayPresence)}</div>
      </td>
      <td>
        <div className="font-normal text-xs text-[#242526]">Absent</div>
      </td>
      <td>
        <div className="font-normal text-xs text-[#242526]">ø</div>
      </td>
    </tr>
  );
};
