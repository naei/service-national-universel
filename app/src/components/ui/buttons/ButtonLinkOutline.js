import React from "react";

const ExternalLinkOutline = ({ className = "", children, ...rest }) => (
  <a
    className={`flex justify-center items-center gap-2 px-3 py-2 rounded-md disabled:opacity-60 transition border-[1px] border-blue-600 text-blue-600 hover:border-blue-700 hover:text-blue-700 disabled:hover:border-blue-600 ${className}`}
    target="_blank"
    rel="noopener noreferrer"
    {...rest}>
    {children}
  </a>
);

export default ExternalLinkOutline;
