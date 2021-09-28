import React from "react";
import styled from "styled-components";
import { DataSearch } from "@appbaseio/reactivesearch";
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
  flex: 1;
`;

const Item = styled(DataSearch)`
  margin: 0;
  .searchbox {
    display: block;
    width: 100%;
    background-color: #fff;
    min-width: 20rem;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    color: #767676;
    border: 0;
    outline: 0;
    padding: 15px 20px;
    border-radius: 6px;
    margin-right: 15px;
    margin-bottom: 15px;
    ::placeholder {
      color: #767676;
    }
  }
`;

const Label = styled.div`
  text-transform: uppercase;
  font-size: 0.6rem;
  font-weight: 600;
  color: ${colors.grey};
`;
