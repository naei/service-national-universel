import React from "react";
import { SelectedFilters } from "@appbaseio/reactivesearch";

export default function DeleteFilters() {
  return (
    <SelectedFilters
      render={(props) => {
        const { selectedValues, setValue } = props;
        const clearFilter = () => {
          Object.keys(selectedValues).map((component) => {
            setValue(component, null);
          });
        };
        if (!Object.values(selectedValues).some((filter) => filter.value?.length)) return null;
        return (
          <div className="underline text-xs text-coolGray-600 cursor-pointer hover:scale-105" onClick={clearFilter}>
            Supprimer la sélection
          </div>
        );
      }}
    />
  );
}
