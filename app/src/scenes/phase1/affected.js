import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";

import NextStep from "./nextStep";

export default () => {
  return (
    <>
      <Hero>
        <div className="content">
          <h1>
            <strong>Mon séjour de cohésion</strong>
          </h1>
          <p>
            Le SNU vous donne l'opportunité de découvrir la vie collective au sein d'un centre accueillant environ 200 jeunes de votre région pour créer ainsi des liens nouveaux et
            développer votre culture de l’engagement et ainsi affirmer votre place dans la société.
          </p>
          <Separator />
          <p>
            <strong>Votre convocation</strong>
            <br />
            Vous êtes actuellement affecté(e) à un centre de cohésion.
          </p>
        </div>
        <div className="thumb" />
      </Hero>
      <NextStep />
    </>
  );
};

const Separator = styled.hr`
  margin: 2.5rem 0;
  height: 1px;
  border-style: none;
  background-color: #e5e7eb;
`;

const Hero = styled.div`
  border-radius: 0.5rem;
  margin: 0 auto;
  max-width: 80rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  .content {
    width: 65%;
    @media (max-width: 768px) {
      width: 100%;
    }
    padding: 60px 30px 60px 50px;
    position: relative;
    background-color: #fff;
    > * {
      position: relative;
      z-index: 2;
    }
  }
  h1 {
    font-size: 3rem;
    @media (max-width: 768px) {
      font-size: 1.8rem;
    }
    color: #161e2e;
    margin-bottom: 20px;
    font-weight: 500;
    line-height: 1;
  }
  p {
    color: #6b7280;
    font-size: 1.25rem;
    @media (max-width: 768px) {
      font-size: 1rem;
    }
    font-weight: 400;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .thumb {
    min-height: 400px;
    background: url(${require("../../assets/phase3.jpg")}) no-repeat center;
    background-size: cover;
    flex: 1;
  }
`;
