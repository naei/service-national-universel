import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Col, Row } from "reactstrap";
import { Link } from "react-router-dom";
import {
  translate,
  MISSION_STATUS,
  MISSION_STATUS_COLORS,
  MISSION_DOMAINS,
  PERIOD,
  TRANSPORT,
  FORMAT,
  PROFESSIONNAL_PROJECT,
  PROFESSIONNAL_PROJECT_PRECISION,
} from "../../../../utils";

import api from "../../../../services/api";
import CircularLine from "../components/CircularLine";

export default ({ filter }) => {
  const [youngsDomains, setYoungsDomains] = useState({});
  const [youngsPeriod, setYoungsPeriod] = useState({});
  const [youngsFormat, setYoungsFormat] = useState({});
  const [youngsProfessionnalProject, setYoungsProfessionnalProject] = useState({});
  const [youngsProfessionnalProjectPrecision, setYoungsProfessionnalProjectPrecision] = useState({});
  const [youngsEngaged, setYoungsEngaged] = useState({});

  const [missionsStatus, setMissionsStatus] = useState({});
  const [missionsDomains, setMissionsDomains] = useState({});
  const [missionsPeriod, setMissionsPeriod] = useState({});
  const [missionsFormat, setMissionsFormat] = useState({});
  const [missionPlaceTotal, setMissionPlaceTotal] = useState(0);
  const [missionPlaceLeft, setMissionPlaceLeft] = useState(0);

  const [mobilityNearSchool, setMobilityNearSchool] = useState({});
  const [mobilityNearRelative, setMobilityNearRelative] = useState({});
  const [mobilityNearHome, setMobilityNearHome] = useState({});
  const [mobilityTransport, setMobilityTransport] = useState({});

  useEffect(() => {
    async function initStatus() {
      const queries = [];
      queries.push({ index: "mission", type: "_doc" });
      queries.push({
        query: { bool: { must: { match_all: {} }, filter: [] } },
        aggs: {
          status: { terms: { field: "status.keyword" } },
          domains: { terms: { field: "domains.keyword" } },
          period: { terms: { field: "period.keyword" } },
          format: { terms: { field: "format.keyword" } },
          placesTotal: { sum: { field: "placesTotal" } },
          placesLeft: { sum: { field: "placesLeft" } },
        },
        size: 0,
      });

      queries.push({ index: "young", type: "_doc" });
      queries.push({
        query: { bool: { must: { match_all: {} }, filter: [] } },
        aggs: {
          domains: { terms: { field: "domains.keyword" } },
          period: { terms: { field: "period.keyword" } },
          format: { terms: { field: "missionFormat.keyword" } },
          professionnalProject: { terms: { field: "professionnalProject.keyword" } },
          professionnalProjectPrecision: { terms: { field: "professionnalProjectPrecision.keyword" } },
          mobilityNearSchool: { terms: { field: "mobilityNearSchool.keyword" } },
          mobilityNearHome: { terms: { field: "mobilityNearHome.keyword" } },
          mobilityNearRelative: { terms: { field: "mobilityNearRelative.keyword" } },
          mobilityTransport: { terms: { field: "mobilityTransport.keyword" } },
          engaged: { terms: { field: "engaged.keyword" } },
        },
        size: 0,
      });

      if (filter.region) queries[1].query.bool.filter.push({ term: { "region.keyword": filter.region } });
      if (filter.department) queries[1].query.bool.filter.push({ term: { "department.keyword": filter.department } });
      if (filter.region) queries[3].query.bool.filter.push({ term: { "region.keyword": filter.region } });
      if (filter.department) queries[3].query.bool.filter.push({ term: { "department.keyword": filter.department } });

      const { responses } = await api.esQuery(queries);
      setStateAccumulated(setMissionsStatus, responses[0], "status");
      setStateAccumulated(setMissionsDomains, responses[0], "domains");
      setStateAccumulated(setMissionsPeriod, responses[0], "period");
      setStateAccumulated(setMissionsFormat, responses[0], "format");
      setMissionPlaceTotal(responses[0].aggregations.placesTotal.value);
      setMissionPlaceLeft(responses[0].aggregations.placesLeft.value);
      setStateAccumulated(setMobilityNearSchool, responses[1], "mobilityNearSchool");
      setStateAccumulated(setMobilityNearHome, responses[1], "mobilityNearHome");
      setStateAccumulated(setMobilityNearRelative, responses[1], "mobilityNearRelative");
      setStateAccumulated(setYoungsDomains, responses[1], "domains");
      setStateAccumulated(setYoungsPeriod, responses[1], "period");
      setStateAccumulated(setYoungsProfessionnalProject, responses[1], "professionnalProject");
      setStateAccumulated(setYoungsEngaged, responses[1], "engaged");
      setStateAccumulated(setYoungsProfessionnalProjectPrecision, responses[1], "professionnalProjectPrecision");
      setStateAccumulated(setYoungsFormat, responses[1], "format");
      setStateAccumulated(setMobilityTransport, responses[1], "mobilityTransport");
    }
    initStatus();
  }, [JSON.stringify(filter)]);

  const setStateAccumulated = (f, r, a) => {
    f(r.aggregations[a].buckets.reduce((acc, c) => ({ ...acc, [c.key]: c.doc_count }), {}));
  };

  const replaceSpaces = (v) => v.replace(/\s+/g, "+");

  const getLink = (link) => {
    if (filter.region) link += `&REGION=%5B"${replaceSpaces(filter.region)}"%5D`;
    if (filter.department) link += `&DEPARTMENT=%5B"${replaceSpaces(filter.department)}"%5D`;
    return link;
  };

  return (
    <React.Fragment>
      <ProposedPlaces getLink={getLink} missionPlaceLeft={missionPlaceLeft} missionPlaceTotal={missionPlaceTotal} />

      <Status getLink={getLink} data={missionsStatus} />
      <MissionDetail missionsDomains={missionsDomains} youngsDomains={youngsDomains} />
      <Period youngsPeriod={youngsPeriod} missionsPeriod={missionsPeriod} />
      <Format youngsFormat={youngsFormat} missionsFormat={missionsFormat} />
      <ProfessionalProject youngsProfessionnalProject={youngsProfessionnalProject} youngsProfessionnalProjectPrecision={youngsProfessionnalProjectPrecision} />
      <Mobility mobilityNearHome={mobilityNearHome} mobilityNearRelative={mobilityNearRelative} mobilityNearSchool={mobilityNearSchool} mobilityTransport={mobilityTransport} />
      <Volonteer youngsEngaged={youngsEngaged} />
    </React.Fragment>
  );
};

const ProposedPlaces = ({ missionPlaceLeft, missionPlaceTotal, getLink }) => {
  return (
    <React.Fragment>
      <CardSubtitle>Places proposées par les structures</CardSubtitle>
      <Row>
        <Col md={6} xl={4} key="total">
          <Link to={getLink(`/mission`)}>
            <Card borderBottomColor="#372F78">
              <CardTitle>Places totales</CardTitle>
              <CardValueWrapper>
                <CardValue>{missionPlaceTotal}</CardValue>
                {/* <CardPercentage>
                  100%
                  <CardArrow />
                </CardPercentage> */}
              </CardValueWrapper>
            </Card>
          </Link>
        </Col>
        <Col md={6} xl={4} key="occupied">
          <Link to={getLink(`/mission`)}>
            <Card borderBottomColor="#FEB951">
              <CardTitle>Places occupées</CardTitle>
              <CardValueWrapper>
                <CardValue>{missionPlaceTotal - missionPlaceLeft}</CardValue>
                {/* <CardPercentage>
                  {`${missionPlaceTotal ? (((missionPlaceTotal - missionPlaceLeft) * 100) / missionPlaceTotal).toFixed(0) : `0`}%`}
                  <CardArrow />
                </CardPercentage> */}
              </CardValueWrapper>
            </Card>
          </Link>
        </Col>
        <Col md={6} xl={4} key="available">
          <Link to={getLink(`/mission`)}>
            <Card borderBottomColor="#6BC763">
              <CardTitle>Places disponibles</CardTitle>
              <CardValueWrapper>
                <CardValue>{missionPlaceLeft}</CardValue>
                {/* <CardPercentage>
                  {`${missionPlaceTotal ? ((missionPlaceLeft * 100) / missionPlaceTotal).toFixed(0) : `0`}%`}
                  <CardArrow />
                </CardPercentage> */}
              </CardValueWrapper>
            </Card>
          </Link>
        </Col>
      </Row>
    </React.Fragment>
  );
};

const Status = ({ data, getLink }) => {
  const total = Object.keys(data).reduce((acc, a) => acc + data[a], 0);

  return (
    <React.Fragment>
      <CardSubtitle>Statut des missions proposées par les structures</CardSubtitle>
      <Row>
        {Object.values(MISSION_STATUS).map((l, k) => {
          return (
            <Col md={6} xl={3} key={k}>
              <Link to={getLink(`/mission?STATUS=%5B"${l}"%5D`)}>
                <Card borderBottomColor={MISSION_STATUS_COLORS[l]}>
                  <CardTitle>{translate(l)}</CardTitle>
                  <CardValueWrapper>
                    <CardValue>{data[l] || 0}</CardValue>
                    <CardPercentage>{total ? `${(((data[l] || 0) * 100) / total).toFixed(0)}%` : `0%`}</CardPercentage>
                  </CardValueWrapper>
                </Card>
              </Link>
            </Col>
          );
        })}
      </Row>
    </React.Fragment>
  );
};

const MissionDetail = ({ youngsDomains, missionsDomains, getLink }) => {
  const totalMissions = Object.keys(missionsDomains).reduce((acc, a) => acc + missionsDomains[a], 0);
  const totalYoungs = Object.keys(youngsDomains).reduce((acc, a) => acc + youngsDomains[a], 0);

  return (
    <React.Fragment>
      <CardSubtitle>Dans le détail des missions</CardSubtitle>
      <Box>
        <Row>
          <Col md={6} xl={6} key="1">
            <BoxTitle>Domaine d'action des missions validées</BoxTitle>
          </Col>
          <Col md={6} xl={6} key="2">
            <BoxTitle>Selon les préférences des volontaires</BoxTitle>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={6} xl={6} key="1">
            {Object.values(MISSION_DOMAINS).map((l, k) => (
              <CircularLine index={`${k + 1}.`} key={k} value={missionsDomains[l]} total={totalMissions} title={translate(l)} subtitle={`${missionsDomains[l] || 0} missions`} />
            ))}
          </Col>
          <Col md={6} xl={6} key="2">
            {Object.values(MISSION_DOMAINS).map((l, k) => (
              <CircularLine
                index={`${k + 1}.`}
                key={k}
                value={youngsDomains[l]}
                total={totalYoungs}
                title={translate(l)}
                subtitle={`D'après ${youngsDomains[l] || 0} volontaires`}
              />
            ))}
          </Col>
        </Row>
      </Box>
    </React.Fragment>
  );
};

const Period = ({ youngsPeriod, missionsPeriod }) => {
  const totalMissions = Object.keys(missionsPeriod).reduce((acc, a) => acc + missionsPeriod[a], 0);
  const totalYoungs = Object.keys(youngsPeriod).reduce((acc, a) => acc + youngsPeriod[a], 0);

  return (
    <React.Fragment>
      <Box>
        <Row>
          <Col md={6} xl={6} key="1">
            <BoxTitle>Période pour réaliser la mission</BoxTitle>
          </Col>
          <Col md={6} xl={6} key="2">
            <BoxTitle>Selon les préférences des volontaires</BoxTitle>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={6} xl={6} key="1">
            {Object.values(PERIOD).map((l, k) => (
              <CircularLine index={`${k + 1}.`} key={k} value={missionsPeriod[l]} total={totalMissions} title={translate(l)} subtitle={`${missionsPeriod[l] || 0} missions`} />
            ))}
          </Col>
          <Col md={6} xl={6} key="2">
            {Object.values(PERIOD).map((l, k) => (
              <CircularLine index={`${k + 1}.`} key={k} value={youngsPeriod[l]} total={totalYoungs} title={translate(l)} subtitle={`D'après ${youngsPeriod[l] || 0} volontaires`} />
            ))}
          </Col>
        </Row>
      </Box>
    </React.Fragment>
  );
};

const ProfessionalProject = ({ youngsProfessionnalProjectPrecision, youngsProfessionnalProject }) => {
  const total1 = Object.keys(youngsProfessionnalProject).reduce((acc, a) => acc + youngsProfessionnalProject[a], 0);
  const total2 = Object.keys(youngsProfessionnalProjectPrecision).reduce((acc, a) => acc + youngsProfessionnalProjectPrecision[a], 0);

  return (
    <React.Fragment>
      <Box>
        <Row>
          <Col md={12} xl={12} key="1">
            <BoxTitle>Projet professionel selon les préférences des volontaires</BoxTitle>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={12} xl={12} key="1">
            {Object.values(PROFESSIONNAL_PROJECT).map((l, k) => {
              if (l !== "OTHER")
                return (
                  <CircularLine
                    index={`${k + 1}.`}
                    key={k}
                    value={youngsProfessionnalProject[l]}
                    total={total1}
                    title={translate(l)}
                    subtitle={`D'après ${youngsProfessionnalProject[l] || 0} volontaires`}
                  />
                );
              return (
                <Row key={k}>
                  <Col md={4}>
                    <CircularLine
                      index={`${k + 1}.`}
                      value={youngsProfessionnalProject[l]}
                      total={total1}
                      title={translate(l)}
                      subtitle={`D'après ${youngsProfessionnalProject[l] || 0} volontaires`}
                    />
                  </Col>
                  <div style={{ border: "1px solid #F2F1F1" }} />
                  {Object.values(PROFESSIONNAL_PROJECT_PRECISION).map((m, i) => {
                    return (
                      <Col md={2} key={i}>
                        <CircularLine
                          value={youngsProfessionnalProjectPrecision[m]}
                          total={total2}
                          title={translate(m)}
                          subtitle={`D'après ${youngsProfessionnalProjectPrecision[m] || 0} volontaires`}
                        />
                      </Col>
                    );
                  })}
                </Row>
              );
            })}
          </Col>
        </Row>
      </Box>
    </React.Fragment>
  );
};

const Format = ({ youngsFormat, missionsFormat }) => {
  const totalMissions = Object.keys(missionsFormat).reduce((acc, a) => acc + missionsFormat[a], 0);
  const totalYoungs = Object.keys(youngsFormat).reduce((acc, a) => acc + youngsFormat[a], 0);

  return (
    <React.Fragment>
      <Box>
        <Row>
          <Col md={6} xl={6} key="1">
            <BoxTitle>Format de la mission</BoxTitle>
          </Col>
          <Col md={6} xl={6} key="2">
            <BoxTitle>Selon les préférences des volontaires</BoxTitle>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={6} xl={6} key="1">
            {Object.values(FORMAT).map((l, k) => (
              <CircularLine index={`${k + 1}.`} key={k} value={missionsFormat[l]} total={totalMissions} title={translate(l)} subtitle={`${missionsFormat[l] || 0} missions`} />
            ))}
          </Col>
          <Col md={6} xl={6} key="2">
            {Object.values(FORMAT).map((l, k) => (
              <CircularLine index={`${k + 1}.`} key={k} value={youngsFormat[l]} total={totalYoungs} title={translate(l)} subtitle={`D'après ${youngsFormat[l] || 0} volontaires`} />
            ))}
          </Col>
        </Row>
      </Box>
    </React.Fragment>
  );
};

const Mobility = ({ mobilityNearHome, mobilityNearRelative, mobilityNearSchool, mobilityTransport }) => {
  const totalNearHome = Object.keys(mobilityNearHome).reduce((acc, a) => acc + mobilityNearHome[a], 0);
  const totalNearRelative = Object.keys(mobilityNearRelative).reduce((acc, a) => acc + mobilityNearRelative[a], 0);
  const totalNearSchool = Object.keys(mobilityNearSchool).reduce((acc, a) => acc + mobilityNearSchool[a], 0);
  const totalMobilityTransport = Object.keys(mobilityTransport).reduce((acc, a) => acc + mobilityTransport[a], 0);

  return (
    <React.Fragment>
      <Box>
        <Row>
          <Col md={6} xl={6} key="1">
            <BoxTitle>Mobilités géographiques selon les préférences des volontaires</BoxTitle>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={6} xl={6} key="1">
            <div>Mission à proximité de </div>
            <CircularLine index="1." value={mobilityNearHome["true"]} total={totalNearHome} title="Leurs domiciles" subtitle={`D'après ${totalNearHome || 0} volontaires`} />
            <CircularLine
              index="2."
              value={mobilityNearSchool["true"]}
              total={totalNearSchool}
              title="Leurs établissements"
              subtitle={`D'après ${totalNearSchool || 0} volontaires`}
            />
            <CircularLine
              index="3."
              value={mobilityNearRelative["true"]}
              total={totalNearRelative}
              title="Hébergement chez un proche"
              subtitle={`D'après ${totalNearRelative || 0} volontaires`}
            />
          </Col>
          <Col md={6} xl={6} key="2">
            <div>Moyen(s) de transport privilégié</div>
            {Object.values(TRANSPORT).map((l, k) => (
              <CircularLine
                key={k}
                index={`${k + 1}.`}
                value={mobilityTransport[l]}
                total={totalMobilityTransport}
                title={translate(l)}
                subtitle={`D'après ${mobilityTransport[l] || 0} volontaires`}
              />
            ))}
          </Col>
        </Row>
      </Box>
    </React.Fragment>
  );
};

const Volonteer = ({ youngsEngaged }) => {
  const total = Object.keys(youngsEngaged).reduce((acc, a) => acc + youngsEngaged[a], 0);

  return (
    <React.Fragment>
      <Box>
        <Row>
          <Col md={12} xl={12} key="1">
            <BoxTitle>Engagement parallèle comme bénévole selon les préférences des volontaires</BoxTitle>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={6} xl={6} key="1">
            <CircularLine index="1." value={youngsEngaged["false"]} total={total} title="Non" subtitle={`D'après ${total} volontaires`} />
          </Col>
          <Col md={6} xl={6} key="2">
            <CircularLine index="2." value={youngsEngaged["true"]} total={total} title="Oui" subtitle={`D'après ${total} volontaires`} />
          </Col>
        </Row>
      </Box>
    </React.Fragment>
  );
};

const CardSubtitle = styled.h3`
  color: #242526;
  font-size: 26px;
  margin-bottom: 20px;
  font-weight: normal;
`;

const Card = styled.div`
  /* max-width: 325px; */
  padding: 22px 15px;
  border-bottom: 7px solid ${(props) => props.borderBottomColor};
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  margin-bottom: 33px;
`;
const CardTitle = styled.h3`
  color: #171725;
  font-size: 16px;
  font-weight: bold;
`;

const Box = styled.div`
  background-color: #fff;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.05));
  margin-bottom: 33px;
  border-radius: 8px;
  padding: 30px;
`;

const BoxTitle = styled.h2`
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  line-height: 18px;
  letter-spacing: 0.1px;

  color: #171725;
`;

const CardValueWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
`;
const CardValue = styled.span`
  font-size: 28px;
`;
const CardPercentage = styled.span`
  font-size: 22px;
  color: #a8a8b1;
  display: flex;
  align-items: center;
  font-weight: 100;
`;
