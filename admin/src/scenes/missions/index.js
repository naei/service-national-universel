import React from "react";
import { Switch, Route, Routes } from "react-router-dom";

import List from "./list";
import Edit from "./edit";
import View from "./view";

export default function Index() {
  return (
    <Routes>
      <Route path="/mission/create/:structureId" element={<Edit />} />
      <Route path="/mission/create" element={<Edit />} />
      <Route path="/mission/:id/edit" element={<Edit />} />
      <Route path="/mission/:id" element={<View />} />
      <Route path="/mission" element={<List />} />
    </Routes>
  );
}
