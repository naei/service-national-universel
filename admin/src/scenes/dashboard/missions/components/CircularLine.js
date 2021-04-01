import React from "react";
import styled from "styled-components";
import CircularProgress from "../../components/CircularProgress";

export default ({ value, total, title, subtitle, index }) => (
  <CircularLine>
    <CircularLineIndex>{index}</CircularLineIndex>
    <CircularProgress circleProgressColor="#1B7BBF" percentage={((value * 100) / total).toFixed(1)} title={title} subtitle={subtitle} />
  </CircularLine>
);

const CircularLine = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
`;
const CircularLineIndex = styled.div`
  margin-right: 30px;
  color: #9a9a9a;
  font-size: 16px;
`;
