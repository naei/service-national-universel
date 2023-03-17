import React from "react";
import ChevronRight from "../../../assets/icons/ChevronRight";

const ExternalLinkPrimary = ({ title = "Primary Link", href = "#", className = "", ...rest }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`d-flex gap-2 items-center text-blue-600 text-xs ${className}`} {...rest}>
      {title} <ChevronRight className="mt-1" />
    </a>
  );
};

export default ExternalLinkPrimary;
