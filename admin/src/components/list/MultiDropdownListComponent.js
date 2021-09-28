import React from "react";
import styled from "styled-components";
import { MultiDropdownList } from "@appbaseio/reactivesearch";
import { colors } from "../../utils";

export default ({ name, ...rest }) => {
  return (
    <Container>
      <Label>{name}</Label>
      <Item {...rest} />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Item = styled(MultiDropdownList)`
  margin: 0;
  button {
    background-color: #fff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border: 0;
    border-radius: 6px;
    padding: 0.5rem;
    font-size: 0.9rem;
    color: #242526;
    min-width: 150px;
    margin-right: 15px;
    cursor: pointer;
    div {
      width: 100%;
      overflow: visible;
    }
  }
`;

const Label = styled.div`
  text-transform: uppercase;
  font-size: 0.6rem;
  font-weight: 600;
  color: ${colors.grey};
`;
