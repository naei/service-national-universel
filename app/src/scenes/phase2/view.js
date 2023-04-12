import React from "react";
import DesktopView from "./desktop";
import MobileView from "./mobile";
import { useSelector } from "react-redux";

export default function View() {
  const young = useSelector((state) => state.Auth.young);

  return (
    <>
      <div className="hidden md:flex flex-1">
        <DesktopView young={young} />
      </div>
      <div className="flex md:hidden ">
        <MobileView young={young} />
      </div>
    </>
  );
}
