import React from "react";

const SectionTitle = ({ children = null, className = "" }) => <h2 className={`text-xs font-medium text-gray-900 m-0 mb-2 ${className}`}>{children}</h2>;

export default SectionTitle;
