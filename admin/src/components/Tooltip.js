import React from "react";
import styled from "styled-components";

export default function ElementWithTootip({ children, tooltipContent = "ceci est le tooltip", tooltipPosition = "bottom" }) {
  const [visible, setVisible] = React.useState(false);
  const Tooltip =
    visible && tooltipContent ? (
      <div>
        <TooltipStyle>{tooltipContent}</TooltipStyle>
      </div>
    ) : null;
  return (
    <div>
      {tooltipPosition === "top" ? Tooltip : null}
      <div onMouseOver={() => setVisible(true)} onMouseOut={() => setVisible(false)}>
        {children}
      </div>
      {tooltipPosition === "bottom" ? Tooltip : null}
    </div>
  );
}

const TooltipStyle = styled.div`
  z-index: 999;
  position: absolute;
  background: #ddd;
  border-radius: 3px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  font-size: 0.9rem;
  color: #000;
  opacity: 0.88;
  transition: opacity 0.3s;
`;
