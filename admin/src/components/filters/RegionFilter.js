import React from "react";
import MultiDropdownListComponent from "../list/MultiDropdownListComponent";

export const RegionFilter = ({ defaultQuery, filters, dataField = "region.keyword", ...rest }) => (
  <MultiDropdownListComponent
    name="Région"
    defaultQuery={defaultQuery}
    className="dropdown-filter"
    placeholder="Toutes"
    componentId="REGION"
    dataField={dataField}
    title=""
    react={{ and: filters.filter((e) => e !== "REGION") }}
    URLParams={true}
    sortBy="asc"
    showSearch={true}
    searchPlaceholder="Rechercher..."
    {...rest}
  />
);
