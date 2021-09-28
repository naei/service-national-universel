import React from "react";
import MultiDropdownListComponent from "../list/MultiDropdownListComponent";
import { getDepartmentNumber } from "../../utils";

export const DepartmentFilter = ({ defaultQuery, filters, dataField = "department.keyword", ...rest }) => (
  <MultiDropdownListComponent
    name="Départements"
    defaultQuery={defaultQuery}
    className="dropdown-filter"
    placeholder="Tous"
    componentId="DEPARTMENT"
    dataField={dataField}
    title=""
    react={{ and: filters.filter((e) => e !== "DEPARTMENT") }}
    URLParams={true}
    sortBy="asc"
    showSearch={true}
    searchPlaceholder="Rechercher..."
    renderItem={(e, count) => {
      return `${getDepartmentNumber(e)} - ${e} (${count})`;
    }}
    size={150}
    {...rest}
  />
);
