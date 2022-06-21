import React from "react";
import { ReactiveBase, ReactiveList, DataSearch, MultiDropdownList } from "@appbaseio/reactivesearch";
import styled from "styled-components";
import { useSelector } from "react-redux";

import CardMission from "./components/CardMission";
import { apiURL } from "../../../../config";
import { translate, getLimitDateForPhase2, getFilterLabel, ENABLE_PM, ES_NO_LIMIT, MISSION_PERIOD_DURING_HOLIDAYS, MISSION_PERIOD_DURING_SCHOOL } from "../../../../utils";
import api from "../../../../services/api";
import Loader from "../../../../components/Loader";
import FilterGeoloc from "../../components/FilterGeoloc";
import Sante from "../../../../assets/mission-domaines/sante";
import Solidarite from "../../../../assets/mission-domaines/solidarite";
import Citoyennete from "../../../../assets/mission-domaines/citoyennete";
import Education from "../../../../assets/mission-domaines/education";
import Sport from "../../../../assets/mission-domaines/sport";
import DefenseEtMemoire from "../../../../assets/mission-domaines/defense-et-memoire";
import Environment from "../../../../assets/mission-domaines/environment";
import Securite from "../../../../assets/mission-domaines/securite";
import Culture from "../../../../assets/mission-domaines/culture";
import PreparationMilitaire from "../../../../assets/mission-domaines/preparation-militaire";
import AcademicCap from "../../../../assets/icons/AcademicCap";
import Sun from "../../../../assets/icons/Sun";
import Calendar from "../../../../assets/icons/Calendar";
import Search from "../../../../assets/icons/Search";
import { Link } from "react-router-dom";
import { HiOutlineAdjustments } from "react-icons/hi";
import PietonSvg from "../../assets/Pieton";
import VeloSvg from "../../assets/Velo";
import VoitureSvg from "../../assets/Voiture";
import TrainSvg from "../../assets/Train";
import FuseeSvg from "../../assets/Fusee";

const FILTERS = ["DOMAINS", "SEARCH", "STATUS", "GEOLOC", "DATE", "PERIOD", "RELATIVE", "MILITARY_PREPARATION"];

export default function List() {
  const young = useSelector((state) => state.Auth.young);
  const [filter, setFilter] = React.useState({ DOMAINS: [], DISTANCE: 50 });
  const [dropdownControlDistanceOpen, setDropdownControlDistanceOpen] = React.useState(false);
  const [dropdownControlWhenOpen, setDropdownControlWhenOpen] = React.useState(false);
  const [focusedAddress, setFocusedAddress] = React.useState();
  const DISTANCE_MAX = 1000;
  const refDropdownControlDistance = React.useRef(null);
  const refDropdownControlWhen = React.useRef(null);

  const getCoordinates = async ({ q, postcode }) => {
    try {
      let url = `https://api-adresse.data.gouv.fr/search/?q=${q || postcode}`;
      if (postcode) url += `&postcode=${postcode}`;
      const res = await fetch(url).then((response) => response.json());
      const lon = res?.features[0]?.geometry?.coordinates[0] || null;
      const lat = res?.features[0]?.geometry?.coordinates[1] || null;
      return lon && lat && { lat, lon };
    } catch (e) {
      console.log("error", e);
      return null;
    }
  };

  const getDefaultQuery = () => {
    let body = {
      query: {
        bool: {
          must: [],
          filter: [
            {
              range: {
                endAt: {
                  gte: "now",
                },
              },
            },
            { term: { "status.keyword": "VALIDATED" } },
            {
              range: {
                placesLeft: {
                  gt: 0,
                },
              },
            },
          ],
        },
      },
      sort: [
        {
          _geo_distance: {
            location: filter?.LOCATION || [young.location?.lon, young.location?.lat],
            order: "asc",
            unit: "km",
            mode: "min",
          },
        },
      ],
      track_total_hits: true,
      size: 20,
    };

    if (filter?.SEARCH) {
      body.query.bool.must.push({
        bool: {
          should: [
            {
              multi_match: {
                query: filter?.SEARCH,
                fields: ["name^10", "structureName^5", "description", "actions", "city"],
                type: "cross_fields",
                operator: "and",
              },
            },
            {
              multi_match: {
                query: filter?.SEARCH,
                fields: ["name^10", "structureName^5", "description", "actions", "city"],
                type: "phrase",
                operator: "and",
              },
            },
            {
              multi_match: {
                query: filter?.SEARCH,
                fields: ["name^10", "structureName^5", "description", "actions", "city"],
                type: "phrase_prefix",
                operator: "and",
              },
            },
          ],
          minimum_should_match: "1",
        },
      });
    }

    if (filter?.DISTANCE) {
      // todo : make it work
      body.query.bool.filter.push({
        geo_distance: {
          distance: `${filter?.DISTANCE}km`,
          location: young.location,
        },
      });
    }

    if (filter?.DOMAINS?.length) body.query.bool.filter.push({ terms: { "domains.keyword": filter.DOMAINS } });
    if (filter?.PERIOD?.length) body.query.bool.filter.push({ terms: { "period.keyword": filter.PERIOD } });
    if (filter?.MILITARY_PREPARATION) body.query.bool.filter.push({ term: { "isMilitaryPreparation.keyword": filter?.MILITARY_PREPARATION } });
    if (filter?.START_DATE && Object.keys(filter?.START_DATE).length) {
      body.query.bool.filter?.push({ range: { startAt: filter.START_DATE } });
    }
    if (filter?.END_DATE && Object.keys(filter?.END_DATE).length) {
      body.query.bool.filter.push({ range: { endAt: filter.END_DATE } });
    }
    return body;
  };

  const handleToggleChangeDomain = (domain) => {
    setFilter((prev) => {
      const newFilter = { ...prev };
      if (newFilter?.DOMAINS?.includes(domain)) {
        newFilter.DOMAINS = newFilter.DOMAINS.filter((d) => d !== domain);
      } else {
        newFilter.DOMAINS = [...(newFilter.DOMAINS || []), domain];
      }
      return newFilter;
    });
  };

  const handleToggleChangePeriod = (period) => {
    setFilter((prev) => {
      const newFilter = { ...prev };
      if (newFilter?.PERIOD?.includes(period)) {
        newFilter.PERIOD = newFilter.PERIOD.filter((d) => d !== period);
      } else {
        newFilter.PERIOD = [...(newFilter.PERIOD || []), period];
      }
      return newFilter;
    });
  };

  const search = (e) => {
    e.preventDefault();
    setFilter((prev) => ({ ...prev, SEARCH: e.target.value }));
  };

  const getLabelWhen = (when) => {
    switch (when) {
      case "SCOLAIRE":
        return "Période scolaire";
      case "VACANCES":
        return "Pendant les vacances";
      case "CUSTOM":
        return "Choisir une période";
      default:
        return "N'importe quand";
    }
  };

  React.useEffect(() => {
    let range;
    const fromDate = filter?.FROM;
    const toDate = filter?.TO;
    //If just the from date is filled
    if (fromDate && !toDate) {
      range = {
        startDate: {
          gte: fromDate,
        },
        endDate: {
          gte: fromDate,
        },
      };
      //If just the to date is filled
    } else if (!fromDate && toDate) {
      range = {
        startDate: {
          lte: toDate,
        },
        endDate: {
          lte: toDate,
        },
      };
      //If both date are filled
    } else if (fromDate && toDate) {
      range = {
        startDate: {
          lte: toDate,
        },
        endDate: {
          gte: fromDate,
        },
      };
      //If none of the dates is filled, reset filter
    } else {
      range = { startDate: {}, endDate: {} };
    }
    setFilter((prev) => ({ ...prev, START_DATE: range.startDate, END_DATE: range.endDate }));
  }, [filter?.FROM, filter?.TO]);

  React.useEffect(() => {
    if (!focusedAddress) return setFilter((prev) => ({ ...prev, LOCATION: undefined }));
    (async () => {
      let location;
      location = await getCoordinates({ q: focusedAddress.address, postcode: focusedAddress.zip });
      if (!location) location = await getCoordinates({ postcode: focusedAddress.address });
      setFilter((prev) => ({ ...prev, LOCATION: location }));
    })();
  }, [focusedAddress]);

  React.useEffect(() => {
    if (!refDropdownControlDistance) return;
    const handleClickOutside = (event) => {
      if (refDropdownControlDistance?.current && !refDropdownControlDistance.current.contains(event.target)) {
        setDropdownControlDistanceOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  React.useEffect(() => {
    if (!refDropdownControlWhen) return;
    const handleClickOutside = (event) => {
      if (refDropdownControlWhen?.current && !refDropdownControlWhen.current.contains(event.target)) {
        setDropdownControlWhenOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return (
    <div className="bg-white pb-12 rounded-lg w-full">
      {/* BEGIN HEADER */}
      <div className="flex justify-between mb-4 p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Trouvez une mission d&apos;intérêt général</h1>
          <div className="text-sm font-normal text-gray-700">
            Vous devez réaliser vos 84 heures de mission dans l&apos;année qui suit votre séjour de cohésion.
            <br />
            Pour plus d&apos;informations,{" "}
            <a
              className="underline hover:underline font-medium hover:text-gray-700"
              href="https://support.snu.gouv.fr/base-de-connaissance/de-combien-de-temps-je-dispose-pour-realiser-ma-mig"
              target="_blank"
              rel="noreferrer">
              cliquez-ici
            </a>
            .
          </div>
        </div>
      </div>
      {/* END HEADER */}

      {/* BEGIN CONTROL */}
      <form onSubmit={search} className="w-full bg-white rounded-lg space-y-6">
        {/* search bar recherche */}

        <div className="flex gap-4 px-4 overflow-x-scroll">
          <DomainFilter Icon={Sante} name="HEALTH" label="Santé" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("HEALTH")} />
          <DomainFilter Icon={Solidarite} name="SOLIDARITY" label="Solidarité" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("SOLIDARITY")} />
          <DomainFilter Icon={Citoyennete} name="CITIZENSHIP" label="Citoyenneté" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("CITIZENSHIP")} />
          <DomainFilter Icon={Education} name="EDUCATION" label="Éducation" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("EDUCATION")} />
          <DomainFilter Icon={Sport} name="SPORT" label="Sport" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("SPORT")} />
          <DomainFilter Icon={DefenseEtMemoire} name="DEFENSE" label="Défense et mémoire" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("DEFENSE")} />
          <DomainFilter Icon={Environment} name="ENVIRONMENT" label="Environment" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("ENVIRONMENT")} />
          <DomainFilter Icon={Securite} name="SECURITY" label="Sécurité" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("SECURITY")} />
          <DomainFilter Icon={Culture} name="CULTURE" label="Culture" onClick={handleToggleChangeDomain} active={(filter?.DOMAINS || []).includes("CULTURE")} />
          <DomainFilter
            Icon={PreparationMilitaire}
            label="Préparations militaires"
            active={filter?.MILITARY_PREPARATION === "true"}
            onClick={() =>
              setFilter((prev) => {
                const newFilter = { ...prev };
                if (newFilter?.MILITARY_PREPARATION === "true") newFilter.MILITARY_PREPARATION = "false";
                else newFilter.MILITARY_PREPARATION = "true";
                return newFilter;
              })
            }
          />
        </div>
      </form>
      {/* END CONTROL */}

      <ReactiveBase url={`${apiURL}/es`} app="mission" headers={{ Authorization: `JWT ${api.getToken()}` }}>
        <Missions>
          <ReactiveList
            defaultQuery={getDefaultQuery}
            componentId="result"
            react={{ and: FILTERS }}
            pagination={true}
            paginationAt="bottom"
            size={25}
            showLoader={true}
            loader="Chargement..."
            innerClass={{ pagination: "pagination" }}
            dataField="created_at"
            renderResultStats={({ numberOfResults }) => {
              return <div className="text-gray-700 my-3 text-sm">{`${numberOfResults} mission${numberOfResults > 1 ? "s" : ""}`}</div>;
            }}
            render={({ data }) => {
              return data.map((e) => {
                const tags = [];
                e.city && tags.push(e.city + (e.zip ? ` - ${e.zip}` : ""));
                // tags.push(e.remote ? "À distance" : "En présentiel");
                e.domains.forEach((d) => tags.push(translate(d)));
                return <CardMission key={e._id} mission={e} />;
              });
            }}
            renderNoResults={() => <div className="text-gray-700 mb-3 text-sm">Aucune mission ne correspond à votre recherche</div>}
          />
        </Missions>
      </ReactiveBase>
    </div>
  );
}

const DomainFilter = ({ Icon, name, label, onClick, active }) => {
  return (
    <div className="flex basis-20 flex-col items-center justify-start space-y-2 cursor-pointer" onClick={() => onClick(name)}>
      <div className={`${active ? "bg-[#212B44]" : "bg-gray-200"} w-9 h-9 flex justify-center items-center rounded-xl transition duration-200 ease-in`}>
        <Icon className="text-white" />
      </div>
      <div className="text-xs text-gray-700 text-center">{label}</div>
    </div>
  );
};

const PeriodeTab = ({ Icon, name, label, onClick, active }) => {
  return (
    <div className="group flex flex-1 flex-col items-center justify-start space-y-2 cursor-pointer" onClick={() => onClick(name)}>
      {active ? (
        <div className="flex border-b-2 border-blue-600 pb-2 font-bold gap-2 items-center">
          {label}
          {Icon ? <Icon className="text-gray-500" /> : null}
        </div>
      ) : (
        <div className="flex pb-2 font-medium hover:border-b-2 hover:border-blue-600 gap-2 items-center">
          {label}
          {Icon ? <Icon className="text-gray-500" /> : null}
        </div>
      )}
    </div>
  );
};

const PeriodeItem = ({ name, onClick, active }) => {
  return active ? (
    <div
      className="group flex flex-col items-center justify-center cursor-pointer rounded-full py-1 px-4 border-[1px] text-blue-600 border-blue-600 hover:border-blue-500 text-xs"
      onClick={() => onClick(name)}>
      <div className="">{translate(name)}</div>
    </div>
  ) : (
    <div
      className="group flex flex-col items-center justify-center cursor-pointer rounded-full py-1 px-4 border-[1px] text-gray-700 border-gray-200 hover:border-gray-300 text-xs"
      onClick={() => onClick(name)}>
      <div className="">{translate(name)}</div>
    </div>
  );
};

const Missions = styled.div`
  padding: 1rem;
  .pagination {
    display: flex;
    justify-content: flex-end;
    padding: 10px 25px;
    margin: 0;
    background: #fff;
    a {
      background: #f7fafc;
      color: #242526;
      padding: 3px 10px;
      font-size: 12px;
      margin: 0 5px;
    }
    a.active {
      font-weight: 700;
      /* background: #5245cc;
      color: #fff; */
    }
    a:first-child {
      background-image: url(${require("../../../../assets/left.svg")});
    }
    a:last-child {
      background-image: url(${require("../../../../assets/right.svg")});
    }
    a:first-child,
    a:last-child {
      font-size: 0;
      height: 24px;
      width: 30px;
      background-position: center;
      background-repeat: no-repeat;
      background-size: 8px;
    }
  }
`;
