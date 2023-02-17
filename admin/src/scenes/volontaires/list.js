import React, { useEffect, useState } from "react";
import { translate } from "snu-lib";
import api from "../../services/api";

import Select from "../centersV2/components/Select";

export default function VolontaireList() {
  const [data, setData] = useState([]);
  console.log("🚀 ~ file: list.js:99 ~ VolontaireList ~ data", data);
  // Filters
  // const filters = [
  //   { label: "status", value: { term: { status: statusFilter } } },
  //   { label: "cohort", value: { term: { cohort: cohortFilter } } },
  // ];

  const [statusFilter, setStatusFilter] = useState({ field: "status.keyword", value: [] });
  console.log("🚀 ~ file: list.js:17 ~ VolontaireList ~ statusFilter", statusFilter);
  const statusOptions = data[0]?.aggregations?.status.buckets.map((e) => ({ label: `${translate(e.key)} - ${e.doc_count}`, value: e.key })) || [];
  console.log("🚀 ~ file: list.js:108 ~ VolontaireList ~ statusOptions", statusOptions);
  const [cohortFilter, setCohortFilter] = useState({});
  const filters = [statusFilter, cohortFilter];

  const baseQuery = {
    query: {
      bool: {
        must: {},
      },
    },
    aggs: {
      status: { terms: { field: "status.keyword" } },
      cohort: { terms: { field: "cohort.keyword" } },
    },
    track_total_hits: true,
  };
  const queryWithFilters = addFiltersToQuery(baseQuery, filters);

  function addFiltersToQuery(baseQuery, filters) {
    let query = baseQuery;

    if (statusFilter.value.length === 0) {
      console.log("WEEEEEEESH");
      query.query.bool.must = { match_all: {} };
      console.log("🚀 ~ file: list.js:162 ~ addFiltersToQuery ~ query", query);
      return query;
    }

    const terms = { [statusFilter.field]: [statusFilter.value.value] };
    // for (const f of filters) {
    //   console.log("🚀 ~ file: list.js:49 ~ addFiltersToQuery ~ f", f);
    //   if (f.value?.length) terms.push({ [f.field]: f.value });
    // }
    query.query.bool.must = { terms: terms };
    console.log("🚀 ~ file: list.js:140 ~ addFiltersToQuery ~ query", query);
    return query;
  }

  // Results
  useEffect(() => {
    async function fetchData() {
      const { responses } = await api.esQuery("young", queryWithFilters);
      setData(responses);
    }
    fetchData();
  }, [statusFilter]);

  return (
    <div className="bg-white rounded-xl shadow-sm m-8 p-8">
      <p>Filters</p>
      <Select options={statusOptions} label="Statut" selected={statusFilter.value} setSelected={(f) => setStatusFilter({ ...statusFilter, value: f })} />
      <div>{data.length && data[0]?.hits.total.value} résultats</div>
    </div>
  );
}
