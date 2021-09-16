import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { toastr } from "react-redux-toastr";
import styled from "styled-components";

//! This component isn't finished.

export default () => {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("http://localhost:8283/young", {
          method: "GET",
          mode: "cors",
          headers: {
            "Accept": "application/json"
          }
        });
        if (!response.ok) return console.log('Request failed', response);
        const data = await response.json();
        console.log(data);
        setArticles(data);
      } catch (error) {
        console.log(error);
      }
    }
    fetchArticles();
  }, []);

  return (
    <HeroContainer>
      <Container>
        <section className="help-section">
          <h2>Besoin d'aide ?</h2>
          <p style={{ color: "#6B7280", margin: "1.3rem" }}>Vous rencontrez un problème technique ou souhaitez en savoir plus sur les phases de votre parcours volontaire ? N'hésitez pas à consulter notre base de connaissance !</p>
          <LinkButton href="https://support.selego.co/help/fr-fr" target="_blank">
            Base de connaissance
          </LinkButton>
        </section>
        <Card>
          <h4 style={{ marginLeft: "0.5rem" }}>
            Quelques articles pour vous aider :
          </h4>
          <div className="division">
            <div className="block">
              <section>
                <h5>{articles?.[39]?.title}</h5>
                <p>Connectez vous à l'espace d'inscription structure, entrez vos informations et cliquez sur "Continuer"...</p>
              </section>
              <a className="block-link" href="https://support.selego.co/help/fr-fr/8-mon-compte/45-je-cree-ma-structure" target="_blank">Lire la suite</a>
            </div>
            <div className="block">
              <section>
                <h5>{articles?.[17]?.title}</h5>
                <p>Vous pouvez ajouter d'autres responsables à votre structure en les invitant depuis votre profil...</p>
              </section>
              <a className="block-link" href="https://support.selego.co/help/fr-fr/8-mon-compte/20-j-invite-un-nouveau-responsable-pour-ma-structure" target="_blank">Lire la suite</a>
            </div>
            <div className="block">
              <section>
                <h5>{articles?.[44]?.title}</h5>
                <p>Après validation de ma MIG par le référent départemental phase 2 , celle-ci est automatiquement...</p>
              </section>
              <a className="block-link" href="https://support.selego.co/help/fr-fr/9-mes-mig/49-je-traite-les-candidatures" target="_blank">Lire la suite</a>
            </div>
          </div>
        </Card>
      </Container>
    </HeroContainer>
  )
}

export const HeroContainer = styled.div`
  flex: 1;
  padding: 1rem;
  @media (max-width: 768px) {
    padding: 1rem 0;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .help-section {
    text-align: center;
    max-width: 600px;
    margin: 0 20px;
  }
`;

const LinkButton = styled.a`
  background-color: #5245cc;
  border: none;
  border-radius: 5px;
  padding: 12px 30px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  transition: opacity 0.3s;
  :hover {
    color: #fff;
    background: #463bad;
  }
`;

const Card = styled.div`
  margin-top: 0.5rem;
  padding: 3rem;
  .division {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-top: 1rem;
  }
  .block {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2rem;
    margin: 0.5rem;
    height: 170px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-radius: 0.5rem;
  }
  .block-link {
    color: blue;
  }

  @media (min-width: 1024px) {
    .division {
      flex-direction: row;
    }
    .block {
      height: auto;
      width: 240px;
    }
  }

`
