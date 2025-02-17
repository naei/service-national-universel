import React from "react";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { useSelector } from "react-redux";
import { toastr } from "react-redux-toastr";
import { Link, useHistory } from "react-router-dom";
import { ROLES, getDepartmentNumber, translate } from "snu-lib";
import ArrowUp from "../../../assets/ArrowUp";
import Comment from "../../../assets/comment";
import History from "../../../assets/icons/History";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { ExportComponent, Filters, ResultTable, Save, SelectedFilters } from "../../../components/filters-system-v2";
import Loader from "../../../components/Loader";
import SelectAction from "../../../components/SelectAction";
import { capture } from "../../../sentry";
import api from "../../../services/api";
import { PlainButton } from "../components/Buttons";
import Select from "../components/Select";
import { TabItem, Title, translateStatus } from "../components/commons";
import { exportLigneBus, getTransportIcon } from "../util";
import Excel from "./components/Icons/Excel.png";
import ListPanel from "./modificationPanel/List";

const cohortList = [
  { label: "Séjour du <b>19 Février au 3 Mars 2023</b>", value: "Février 2023 - C" },
  { label: "Séjour du <b>9 au 21 Avril 2023</b>", value: "Avril 2023 - A" },
  { label: "Séjour du <b>16 au 28 Avril 2023</b>", value: "Avril 2023 - B" },
  { label: "Séjour du <b>11 au 23 Juin 2023</b>", value: "Juin 2023" },
  { label: "Séjour du <b>4 au 16 Juillet 2023</b>", value: "Juillet 2023" },
];

export default function List() {
  const { user, sessionPhase1 } = useSelector((state) => state.Auth);
  const urlParams = new URLSearchParams(window.location.search);
  const defaultCohort = user.role === ROLES.HEAD_CENTER && sessionPhase1 ? sessionPhase1.cohort : "Février 2023 - C";
  const [cohort, setCohort] = React.useState(urlParams.get("cohort") || defaultCohort);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasValue, setHasValue] = React.useState(false);
  const history = useHistory();

  const getPlanDetransport = async () => {
    try {
      const { ok, code, data: reponseBus } = await api.get(`/ligne-de-bus/cohort/${cohort}/hasValue`);
      if (!ok) {
        return toastr.error("Oups, une erreur est survenue lors de la récupération du plan de transport", translate(code));
      }
      setHasValue(reponseBus);
      setIsLoading(false);
    } catch (e) {
      capture(e);
      toastr.error("Oups, une erreur est survenue lors de la récupération du bus");
    }
  };

  React.useEffect(() => {
    if (user.role === ROLES.HEAD_CENTER && sessionPhase1) {
      history.push(`/ligne-de-bus?cohort=${sessionPhase1.cohort}`);
      setCohort(sessionPhase1.cohort);
    }
    setIsLoading(true);
    getPlanDetransport();
  }, [cohort]);

  if (isLoading) return <Loader />;

  return (
    <>
      <Breadcrumbs items={[{ label: "Plan de transport" }]} />
      <div className="flex w-full flex-col px-8 pb-8 ">
        <div className="flex items-center justify-between py-8">
          <Title>Plan de transport</Title>
          <Select
            options={cohortList}
            value={cohort}
            disabled={user.role === ROLES.HEAD_CENTER}
            onChange={(e) => {
              setCohort(e);
              history.replace({ search: `?cohort=${e}` });
            }}
          />
        </div>
        {hasValue ? (
          <ReactiveList cohort={cohort} history={history} />
        ) : (
          <div className="m-auto flex w-[450px] flex-col items-center justify-center gap-4 pt-12">
            <img src={Excel} alt="Excel" className="w-32 bg-[#f4f5f7]" />
            <div className="text-2xl font-bold leading-7 text-gray-800">Aucun document importé</div>
            {[ROLES.ADMIN, ROLES.TRANSPORTER].includes(user.role) && (
              <>
                <div className="text-center text-sm leading-5 text-gray-800">
                  Importez votre plan de transport au format .xls (fichier Excel) afin de voir apparaître ici le plan de transport.
                </div>
                <PlainButton className="mt-2" onClick={() => history.push(`/ligne-de-bus/import?cohort=${cohort}`)}>
                  Importer mon fichier
                </PlainButton>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const ReactiveList = ({ cohort, history }) => {
  const { user } = useSelector((state) => state.Auth);
  const [currentTab, setCurrentTab] = React.useState("aller");
  const [panel, setPanel] = React.useState({ open: false, id: null });

  const [data, setData] = React.useState([]);
  const pageId = "plandetransport";
  const [selectedFilters, setSelectedFilters] = React.useState({});
  const [paramData, setParamData] = React.useState({
    page: 0,
  });

  const filterArray = [
    { title: "Numéro de la ligne", name: "busId", parentGroup: "Bus", missingLabel: "Non renseigné" },
    { title: "Date aller", name: "departureString", parentGroup: "Bus", missingLabel: "Non renseigné" },
    { title: "Date retour", name: "returnString", parentGroup: "Bus", missingLabel: "Non renseigné" },
    {
      title: "Taux de remplissage",
      name: "lineFillingRate",
      parentGroup: "Bus",
      missingLabel: "Non renseigné",
      transformData: (value) => transformDataTaux(value),
    },
    { title: "Nom", name: "pointDeRassemblements.name", parentGroup: "Points de rassemblement", missingLabel: "Non renseigné" },
    {
      title: "Région",
      name: "pointDeRassemblements.region",
      parentGroup: "Points de rassemblement",
      missingLabel: "Non renseigné",
      defaultValue: user.role === ROLES.REFERENT_REGION ? [user.region] : [],
    },
    {
      title: "Département",
      name: "pointDeRassemblements.department",
      parentGroup: "Points de rassemblement",
      missingLabel: "Non renseigné",
      defaultValue: user.role === ROLES.REFERENT_DEPARTMENT ? user.department : [],
      translate: (e) => getDepartmentNumber(e) + " - " + e,
    },
    { title: "Ville", name: "pointDeRassemblements.city", parentGroup: "Points de rassemblement", missingLabel: "Non renseigné" },
    { title: "Code", name: "pointDeRassemblements.code", parentGroup: "Points de rassemblement", missingLabel: "Non renseigné" },
    { title: "Nom", name: "centerName", parentGroup: "Centre", missingLabel: "Non renseigné" },
    { title: "Région", name: "centerRegion", parentGroup: "Centre", missingLabel: "Non renseigné" },
    {
      title: "Département",

      name: "centerDepartment",
      parentGroup: "Centre",
      missingLabel: "Non renseigné",
      translate: (e) => getDepartmentNumber(e) + " - " + e,
    },
    { title: "Code", name: "centerCode", parentGroup: "Centre", missingLabel: "Non renseigné" },
    {
      title: "Modification demandée",

      name: "modificationBuses.requestMessage",
      parentGroup: "Modification",
      missingLabel: "Non renseigné",
    },
    {
      title: "Statut de la modification",

      name: "modificationBuses.status",
      parentGroup: "Modification",
      missingLabel: "Non renseigné",
      translate: translateStatus,
    },
    user.role === ROLES.ADMIN
      ? {
          title: "Opinion sur la modification",

          name: "modificationBuses.opinion",
          parentGroup: "Modification",
          missingLabel: "Non renseigné",
          translate: translate,
        }
      : null,
  ].filter((e) => e);

  return (
    <>
      <div className="flex flex-1">
        <TabItem icon={<BsArrowRight />} title="Aller" onClick={() => setCurrentTab("aller")} active={currentTab === "aller"} />
        <TabItem icon={<BsArrowLeft />} title="Retour" onClick={() => setCurrentTab("retour")} active={currentTab === "retour"} />
      </div>
      <div className="mb-8 flex flex-col rounded-lg bg-white py-4">
        <div className="flex items-center justify-between bg-white px-4 pt-2">
          <div className="flex items-center gap-2">
            <Filters
              defaultUrlParam={`cohort=${cohort}`}
              pageId={pageId}
              route="/elasticsearch/plandetransport/search"
              setData={(value) => setData(value)}
              filters={filterArray}
              searchPlaceholder="Rechercher une ligne (numéro, ville, region)"
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              paramData={paramData}
              setParamData={setParamData}
            />
          </div>
          <div className="flex items-center gap-2">
            {user.role !== ROLES.HEAD_CENTER ? (
              <>
                <button
                  className="text-grey-700 flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium"
                  onClick={() => history.push(`/ligne-de-bus/historique?cohort=${cohort}`)}>
                  <History className="text-gray-400" />
                  Historique
                </button>
                <button
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700"
                  onClick={() => history.push(`/ligne-de-bus/demande-de-modification?cohort=${cohort}`)}>
                  Demande de modification
                </button>
              </>
            ) : null}
            <SelectAction
              title="Exporter"
              alignItems="right"
              buttonClassNames="bg-white border border-gray-300 h-10 rounded-md px-3"
              textClassNames="text-grey-700 font-medium text-sm"
              rightIconClassNames="text-gray-300"
              optionsGroup={[
                {
                  items: [
                    {
                      action: async () => {},
                      render: (
                        <ExportComponent
                          title="Plan de transport"
                          exportTitle="Plan_de_transport"
                          route="/elasticsearch/plandetransport/export"
                          filters={filterArray}
                          selectedFilters={selectedFilters}
                          setIsOpen={() => true}
                          css={{
                            override: true,
                            button: `flex items-center gap-2 p-2 px-3 text-gray-700 hover:bg-gray-50 cursor-pointer w-full text-sm text-gray-700`,
                            loadingButton: `text-sm text-gray-700`,
                          }}
                          transform={async (data) => {
                            let all = data;
                            // Get the length of the longest array of PDRs
                            const maxPDRs = all.reduce((max, item) => (item.pointDeRassemblements.length > max ? item.pointDeRassemblements.length : max), 0);

                            return all.map((data) => {
                              let pdrs = {};

                              for (let i = 0; i < maxPDRs; i++) {
                                const pdr = data.pointDeRassemblements?.[i];
                                const num = i + 1;
                                pdrs[`N° DU DEPARTEMENT DU PDR ${num}`] = pdr?.department ? getDepartmentNumber(pdr.department) : "";
                                pdrs[`REGION DU PDR ${num}`] = pdr?.region || "";
                                pdrs[`ID PDR ${num}`] = pdr?.meetingPointId || "";
                                pdrs[`TYPE DE TRANSPORT PDR ${num}`] = pdr?.transportType || "";
                                pdrs[`NOM + ADRESSE DU PDR ${num}`] = pdr?.name ? pdr.name + " / " + pdr.address : "";
                                pdrs[`HEURE ALLER ARRIVÉE AU PDR ${num}`] = pdr?.busArrivalHour || "";
                                pdrs[`HEURE DE CONVOCATION AU PDR ${num}`] = pdr?.meetingHour || "";
                                pdrs[`HEURE DE DEPART DU PDR ${num}`] = pdr?.departureHour || "";
                                pdrs[`HEURE DE RETOUR ARRIVÉE AU PDR ${num}`] = pdr?.returnHour || "";
                              }

                              return {
                                "NUMERO DE LIGNE": data.busId,
                                "DATE DE TRANSPORT ALLER": data.departureString,
                                "DATE DE TRANSPORT RETOUR": data.returnString,
                                ...pdrs,
                                "N° DU DEPARTEMENT DU CENTRE": getDepartmentNumber(data.centerDepartment),
                                "REGION DU CENTRE": data.centerRegion,
                                "ID CENTRE": data.centerId,
                                "NOM + ADRESSE DU CENTRE": data.centerName + " / " + data.centerAddress,
                                "HEURE D'ARRIVEE AU CENTRE": data.centerArrivalTime,
                                "HEURE DE DÉPART DU CENTRE": data.centerDepartureTime,

                                // * followerCapacity !== Total des followers mais c'est la sémantique ici
                                "TOTAL ACCOMPAGNATEURS": data.followerCapacity,

                                "CAPACITÉ VOLONTAIRE TOTALE": data.youngCapacity,
                                "CAPACITÉ TOTALE LIGNE": data.totalCapacity,
                                "PAUSE DÉJEUNER ALLER": data.lunchBreak ? "Oui" : "Non",
                                "PAUSE DÉJEUNER RETOUR": data.lunchBreakReturn ? "Oui" : "Non",
                                "TEMPS DE ROUTE": data.travelTime,
                              };
                            });
                          }}
                        />
                      ),
                    },
                    [ROLES.ADMIN, ROLES.TRANSPORTER, ROLES.REFERENT_DEPARTMENT, ROLES.REFERENT_REGION].includes(user.role)
                      ? {
                          action: async () => {
                            await exportLigneBus(user, cohort);
                          },
                          render: (
                            <div className="flex cursor-pointer items-center gap-2 p-2 px-3 text-gray-700 hover:bg-gray-50">
                              <div className="text-sm text-gray-700">Volontaires par ligne</div>
                            </div>
                          ),
                        }
                      : null,
                  ].filter((x) => x),
                },
              ]}
            />
          </div>
        </div>
        <div className="mt-2 flex flex-row flex-wrap items-center px-4">
          <Save selectedFilters={selectedFilters} filterArray={filterArray} page={paramData?.page} pageId={pageId} />
          <SelectedFilters filterArray={filterArray} selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} paramData={paramData} setParamData={setParamData} />
        </div>
        <ResultTable
          paramData={paramData}
          setParamData={setParamData}
          currentEntryOnPage={data?.length}
          render={
            <div className="mt-6 mb-2 flex w-full flex-col">
              <hr />
              <div className="flex w-full items-center py-3 px-4 text-xs uppercase text-gray-400">
                <div className="w-[30%]">Lignes</div>
                <div className="w-[40%]">Points de rassemblements</div>
                <div className="w-[15%]">Centres de destinations</div>
                <div className="w-[10%]">Taux de remplissage</div>
                <div className="h-1 w-[5%]"></div>
              </div>
              {data?.map((hit) => {
                return <Line key={hit._id} hit={hit} currentTab={currentTab} setPanel={setPanel} />;
              })}
              <hr />
            </div>
          }
        />
      </div>
      <ListPanel busId={panel?.id} open={panel?.open} setOpen={setPanel} />
    </>
  );
};

const Line = ({ hit, currentTab, setPanel }) => {
  const meetingPoints =
    currentTab === "aller"
      ? //sort meetingPoints by departureHour
        hit.pointDeRassemblements.sort((a, b) => a.departureHour.replace(":", "") - b.departureHour.replace(":", ""))
      : hit.pointDeRassemblements.sort((a, b) => a.returnHour.replace(":", "") - b.returnHour.replace(":", ""));

  const hasPendingModification = hit.modificationBuses?.some((modification) => modification.status === "PENDING");

  return (
    <>
      <hr />
      <div className="flex items-center py-6 px-4 hover:bg-gray-50">
        <Link className="w-[30%] cursor-pointer" to={`/ligne-de-bus/${hit._id.toString()}`} target="_blank" rel="noreferrer">
          <div className="flex flex-col">
            <div className="text-sm font-medium">{hit.busId}</div>
            <div className="text-xs text-gray-400">
              {currentTab === "aller" ? `${hit.pointDeRassemblements[0]?.region} > ${hit.centerRegion}` : `${hit.centerRegion} > ${hit.pointDeRassemblements[0]?.region}`}
            </div>
          </div>
        </Link>
        <div className="w-[40%]">
          <div className="flex gap-2">
            {meetingPoints.map((meetingPoint) => {
              return (
                <TooltipMeetingPoint key={meetingPoint.meetingPointId} meetingPoint={meetingPoint} currentTab={currentTab}>
                  <a
                    href={`/point-de-rassemblement/${meetingPoint.meetingPointId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-3xl bg-gray-100 px-2 py-1 text-sm font-normal hover:scale-105">
                    {meetingPoint.city}
                    <ArrowUp />
                  </a>
                </TooltipMeetingPoint>
              );
            })}
          </div>
        </div>
        <div className="w-[15%]">
          <div className="flex gap-2">
            <TooltipCenter key={hit.centerId} name={hit.centerName} region={hit.centerRegion} department={hit.centerDepartment}>
              <a
                href={`/centre/${hit.centerId}`}
                target="_blank"
                rel="noreferrer"
                className="flex cursor-pointer items-center justify-center gap-2 px-2 py-1 text-sm font-normal hover:scale-105">
                {hit.centerCode}
                <ArrowUp />
              </a>
            </TooltipCenter>
          </div>
        </div>
        <div className="flex w-[10%] items-center gap-4">
          <div className="text-sm font-normal">{hit.lineFillingRate}%</div>
          <div className="flex flex-col items-center">
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="40" fill="none" stroke="#F0F0F0" strokeDashoffset={`calc(100 - 0)`} strokeWidth="15" />
              <circle
                className="percent fifty"
                strokeDasharray={100}
                strokeDashoffset={`calc(100 - ${Math.round(hit.lineFillingRate)})`}
                cx="60"
                cy="60"
                r="40"
                fill="none"
                stroke="#1E40AF"
                strokeWidth="15"
                pathLength="100"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="flex w-[5%] justify-center">
          {hit.modificationBuses?.length > 0 ? (
            <div
              className={`flex cursor-pointer rounded-full p-2 ${hasPendingModification ? "bg-orange-500" : "bg-gray-200"}`}
              onClick={() => setPanel({ open: true, id: hit._id })}>
              <Comment stroke={hasPendingModification && "white"} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

const TooltipMeetingPoint = ({ children, meetingPoint, currentTab, ...props }) => {
  if (!meetingPoint) return children;

  return (
    <div className="group relative flex flex-col items-center " {...props}>
      {children}
      <div className="absolute !top-8 left-0 mb-3 hidden items-center group-hover:flex">
        <div className="leading-2 relative z-[500] whitespace-nowrap rounded-lg bg-white p-3 text-xs text-[#414458] shadow-lg">
          <div className="flex w-[524px] items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-medium">
                {currentTab === "aller" ? meetingPoint.departureHour : meetingPoint.returnHour}
              </div>
              <svg id="triangle" viewBox="0 0 100 100" width={10} height={10} className="z-[600]">
                <polygon points="0 0, 100 0, 50 55" transform="rotate(-90 50 50)" fill="#F5F5F5" />
              </svg>
              <div className="ml-1 flex flex-col">
                <div className="text-sm font-medium">{meetingPoint.name}</div>
                <div className="text-xs text-gray-400">{`${meetingPoint.region} • ${meetingPoint.department}`}</div>
              </div>
            </div>
            {getTransportIcon(meetingPoint.transportType)}
          </div>
        </div>
      </div>
    </div>
  );
};

const TooltipCenter = ({ children, name, region, department, ...props }) => {
  return (
    <div className="group relative flex flex-col items-center" {...props}>
      {children}
      <div className="absolute !top-8 left-0 mb-3 hidden flex-col items-center group-hover:flex">
        <div className="leading-2 relative z-[500] whitespace-nowrap rounded-lg bg-white py-3 px-3 text-xs text-[#414458] shadow-lg">
          <div className="flex flex-col">
            <div className="text-sm font-medium">{`${name}`}</div>
            <div className="text-xs text-gray-400">{`${region} • ${department}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const translateLineFillingRate = (e) => {
  if (e == 0) return "Vide";
  if (e == 100) return "Rempli";
  return `${Math.floor(e / 10) * 10}-${Math.floor(e / 10) * 10 + 10}%`;
};
const transformDataTaux = (data) => {
  const newData = [];
  data.map((d) => {
    const dizaine = translateLineFillingRate(parseInt(d.key));
    const val = newData.find((e) => e.key === dizaine);
    if (val) {
      newData[newData.indexOf(val)].doc_count += d.doc_count;
    } else {
      newData.push({ key: dizaine, doc_count: d.doc_count });
    }
  });
  return newData;
};
