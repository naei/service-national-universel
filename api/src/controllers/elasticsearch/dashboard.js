const passport = require("passport");
const express = require("express");
const router = express.Router();
const { capture } = require("../../sentry");
const esClient = require("../../es");
const { ERRORS } = require("../../utils");
const { buildArbitratyNdJson } = require("./utils");
const { sessions2023, ROLES, ES_NO_LIMIT } = require("snu-lib");
const CohortModel = require("../../models/cohort");

router.post("/default", passport.authenticate(["referent"], { session: false, failWithError: true }), async (req, res) => {
  try {
    const cohorts = await CohortModel.find({});
    const cohortsNotFinished = cohorts.filter((c) => new Date(c.dateEnd) > Date.now()).map((e) => e.name);
    const cohortsNotStarted = cohorts.filter((c) => new Date(c.dateStart) > Date.now()).map((e) => e.name);
    const cohortsAssignementOpen = cohorts.filter((c) => Boolean(c.isAssignmentAnnouncementsOpenForYoung) && cohortsNotFinished.includes(c)).map((e) => e.name);
    const cohorts5daysBeforeInscriptionEnd = sessions2023
      .filter((c) => new Date(c.eligibility.instructionEndDate) - Date.now() < 5 * 24 * 60 * 60 * 1000 && new Date(c.eligibility.instructionEndDate) - Date.now() > 0)
      .map((e) => e.name);
    const cohorts5dayBeforepdrChoiceLimitDate = cohorts
      .filter((c) => new Date(c.pdrChoiceLimitDate) - Date.now() < 5 * 24 * 60 * 60 * 1000 && new Date(c.pdrChoiceLimitDate) - Date.now() > 0)
      .map((e) => e.name);
    // // entre 2 semaines avant le 1er jour du séjour et le dernier jour du séjour, alors alerte (1 alerte par session)
    const cohorts2weeksBeforeSessionStart = cohorts
      .filter((c) => new Date(c.dateStart) - Date.now() < 14 * 24 * 60 * 60 * 1000 && new Date(c.dateEnd) - Date.now() > 0)
      .map((e) => e.name);

    function queryFromFilter(filter, { regionField = "region.keyword", departmentField = "department.keyword" } = {}) {
      const body = {
        size: 0,
        track_total_hits: 1000, // We don't need the exact number of hits when more than 1000.
        query: { bool: { must: { match_all: {} }, filter } },
      };
      if (req.user.role === ROLES.REFERENT_REGION) body.query.bool.filter.push({ term: { [regionField]: req.user.region } });
      if (req.user.role === ROLES.REFERENT_DEPARTMENT) body.query.bool.filter.push({ terms: { [departmentField]: req.user.department } });
      return body;
    }

    function withAggs(body, fieldName = "cohort.keyword") {
      return {
        ...body,
        aggs: { [fieldName.replace(".keyword", "")]: { terms: { field: fieldName, size: 1000 } } },
      };
    }

    // Dossier. X dossiers d’inscription en attente de validation pour le séjour de [Février 2023 C] (A instruire)
    // inscription_en_attente_de_validation_cohorte
    async function inscriptionAttenteValidationParCohorte() {
      const cohorts = cohorts5daysBeforeInscriptionEnd;
      if (!cohorts.length) return { inscription_en_attente_de_validation_cohorte: [] };

      const response = await esClient.msearch({
        index: "young",
        body: buildArbitratyNdJson(
          { index: "young", type: "_doc" },
          withAggs(queryFromFilter([{ terms: { "cohort.keyword": cohorts } }, { terms: { "status.keyword": ["WAITING_VALIDATION"] } }]), "cohort.keyword"),
        ),
      });

      return {
        inscription_en_attente_de_validation_cohorte: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    // Droit à l’image (À relancer) X volontaires sans accord renseigné
    // inscription_sans_accord_renseigné
    async function droitImageParCohorte() {
      const cohorts = cohortsAssignementOpen;
      if (!cohorts.length) return { inscription_sans_accord_renseigné: [] };

      const response = await esClient.msearch({
        index: "young",
        body: buildArbitratyNdJson(
          { index: "young", type: "_doc" },
          withAggs(
            queryFromFilter([
              { terms: { "cohort.keyword": cohorts } },
              { terms: { "status.keyword": ["VALIDATED", "WAITING_LIST"] } },
              { bool: { should: [{ term: { parentAllowSNU: "N/A" } }, { bool: { must_not: { exists: { field: "parentAllowSNU" } } } }], minimum_should_match: 1 } },
            ]),
            "cohort.keyword",
          ),
        ),
      });

      return {
        inscription_sans_accord_renseigné: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    // Point de rassemblement (À suivre) X volontaires n’ont pas confirmé leur point de rassemblement
    // sejour_rassemblement_non_confirmé
    async function sejourRassemblementNonConfirmé() {
      const cohorts = cohorts5dayBeforepdrChoiceLimitDate;
      if (!cohorts.length) return { sejour_rassemblement_non_confirmé: [] };

      const response = await esClient.msearch({
        index: "young",
        body: buildArbitratyNdJson(
          { index: "young", type: "_doc" },
          withAggs(
            queryFromFilter([
              { terms: { "cohort.keyword": cohorts } },
              { exists: { field: "sessionId" } },
              { exists: { field: "lineId" } },
              { bool: { should: [{ term: { mettingPointId: "N/A" } }, { bool: { must_not: { exists: { field: "mettingPointId" } } } }], minimum_should_match: 1 } },
            ]),
            "cohort.keyword",
          ),
        ),
      });

      return {
        sejour_rassemblement_non_confirmé: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    // Participation (À suivre) X volontaires n’ont pas confirmé leur participation au séjour de [Février 2023-C]
    // sejour_participation_non_confirmée
    async function sejourParticipationNonConfirmée() {
      const cohorts = cohortsNotStarted.filter((e) => cohortsAssignementOpen.includes(e));
      if (!cohorts.length) return { sejour_participation_non_confirmée: [] };

      const response = await esClient.msearch({
        index: "young",
        body: buildArbitratyNdJson(
          { index: "young", type: "_doc" },
          withAggs(
            queryFromFilter([
              {
                bool: {
                  should: [{ term: { youngPhase1Agreement: "false" } }, { bool: { must_not: { exists: { field: "youngPhase1Agreement" } } } }],
                  minimum_should_match: 1,
                },
              },
              { terms: { "cohort.keyword": cohorts } },
              { terms: { "status.keyword": ["VALIDATED"] } },
              { terms: { "statusPhase1.keyword": ["AFFECTED"] } },
            ]),
          ),
        ),
      });

      return {
        sejour_participation_non_confirmée: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    async function pointDeRassemblementADéclarer() {
      const cohorts = cohortsNotStarted;
      if (!cohorts.length) return { sejour_point_de_rassemblement_à_déclarer: [] };

      // Liste des départements de la table de répartition pour la personne qui regarde et les cohortes concernées
      const q = queryFromFilter([{ terms: { "cohort.keyword": cohorts } }, { bool: { must: { exists: { field: "fromDepartment" } } } }], {
        regionField: "fromRegion",
        departmentField: "fromDepartment",
      });
      q.size = ES_NO_LIMIT;
      const responseRepartition = await esClient.msearch({
        index: "tablederepartition",
        body: buildArbitratyNdJson({ index: "tablederepartition", type: "_doc" }, q),
      });
      // On récupère les points de rassemblement pour chaque cohorte groupés par département
      // Si un département de la cohorte n'a pas de point de rassemblement on l'ajoute dans la liste à signaler.
      const departmentsCohorts = responseRepartition.body.responses[0].hits.hits.map((e) => e._source);
      const response = await esClient.msearch({
        index: "pointderassemblement",
        body: buildArbitratyNdJson(
          ...cohorts.flatMap((cohort) => {
            return [
              { index: "pointderassemblement", type: "_doc" },
              withAggs(
                queryFromFilter([
                  { terms: { "cohort.keyword": [cohort] } },
                  { terms: { "department.keyword": departmentsCohorts.filter((e) => e.cohort === cohort).map((e) => e.fromDepartment) } },
                ]),
                "department.keyword",
              ),
            ];
          }),
        ),
      });
      const sejour_point_de_rassemblement_à_déclarer = [];
      for (const cohort of cohorts) {
        const cohortDepartments = departmentsCohorts.filter((e) => e.cohort === cohort).map((e) => e.fromDepartment);
        // Chaque département doit avoir un point de rassemblement
        for (const department of cohortDepartments) {
          const cohortDepartmentsWithPdr = response.body.responses.filter((e) => e.aggregations).find((e) => e.aggregations.department.buckets.find((e) => e.key === department));
          // Si le département n'a pas de point de rassemblement on l'ajoute dans la liste à signaler.
          if (!cohortDepartmentsWithPdr) {
            if (!sejour_point_de_rassemblement_à_déclarer.find((e) => e.cohort === cohort && e.department === department))
              sejour_point_de_rassemblement_à_déclarer.push({
                cohort,
                department,
              });
          }
        }
      }
      return { sejour_point_de_rassemblement_à_déclarer };
    }

    async function centreADéclarer() {
      return { sejour_centre_à_déclarer: [] };
      // Todo en s'inspirant de pointDeRassemblementADéclarer
    }

    // Emploi du temps (À relancer) X emplois du temps n’ont pas été déposés pour le séjour de [Février 2023 -C].
    // sejour_emploi_du_temps_non_déposé
    async function sejourEmploiDuTempsNonDéposé() {
      const cohorts = cohorts2weeksBeforeSessionStart;
      if (!cohorts.length) return { sejour_emploi_du_temps_non_déposé: [] };

      const response = await esClient.msearch({
        index: "sessionphase1",
        body: buildArbitratyNdJson(
          { index: "sessionphase1", type: "_doc" },
          withAggs(queryFromFilter([{ terms: { "cohort.keyword": cohorts } }, { terms: { "hasTimeSchedule.keyword": ["false"] } }])),
        ),
      });

      return {
        sejour_emploi_du_temps_non_déposé: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    // Contact (À renseigner) Au moins 1 contact de convocation doit être renseigné pour le séjour de [Février 2023-C].
    // sejour_contact_à_renseigner
    async function sejourContactÀRenseigner() {
      const cohorts = cohortsNotStarted; // FIXME
      if (!cohorts.length) return { sejour_contact_à_renseigner: [] };

      // Liste des départements de la table de répartition pour la personne qui regarde et les cohortes concernées
      const q = queryFromFilter([{ terms: { "cohort.keyword": cohorts } }, { bool: { must: { exists: { field: "fromDepartment" } } } }], {
        regionField: "fromRegion",
        departmentField: "fromDepartment",
      });
      q.size = ES_NO_LIMIT;
      const responseRepartition = await esClient.msearch({
        index: "tablederepartition",
        body: buildArbitratyNdJson({ index: "tablederepartition", type: "_doc" }, q),
      });
      // On récupère les entrées de département service pour chaque cohorte groupés par département
      // Si un département de la cohorte n'a pas de contact on l'ajoute dans la liste à signaler.
      const departmentsCohorts = responseRepartition.body.responses[0].hits.hits.map((e) => e._source);
      const response = await esClient.msearch({
        index: "departmentservice",
        body: buildArbitratyNdJson(
          ...cohorts.flatMap((cohort) => {
            return [
              { index: "departmentservice", type: "_doc" },
              withAggs(
                queryFromFilter([
                  {
                    nested: {
                      path: "contacts",
                      query: {
                        bool: {
                          must: [{ terms: { "contacts.cohort.keyword": [cohort] } }],
                        },
                      },
                    },
                  },
                  { terms: { "department.keyword": departmentsCohorts.filter((e) => e.cohort === cohort).map((e) => e.fromDepartment) } },
                ]),
                "department.keyword",
              ),
            ];
          }),
        ),
      });
      const sejour_contact_à_renseigner = [];
      for (const cohort of cohorts) {
        const cohortDepartments = departmentsCohorts.filter((e) => e.cohort === cohort).map((e) => e.fromDepartment);
        // Chaque département doit avoir un contact pour la cohorte
        for (const department of cohortDepartments) {
          const cohortDepartmentsWithContact = response.body.responses
            .filter((e) => e.aggregations)
            .find((e) => e.aggregations.department.buckets.find((e) => e.key === department));
          // Si le département n'a pas de contact pour la cohorte on l'ajoute dans la liste à signaler.
          if (!cohortDepartmentsWithContact) {
            if (!sejour_contact_à_renseigner.find((e) => e.cohort === cohort && e.department === department))
              sejour_contact_à_renseigner.push({
                cohort,
                department,
              });
          }
        }
      }
      return { sejour_contact_à_renseigner };
    }

    // Cas particuliers (À contacter) X volontaires à contacter pour préparer leur accueil pour le séjour de [Février 2023 - C]
    // sejour_volontaires_à_contacter
    async function sejourVolontairesÀContacter() {
      const cohorts = cohortsNotStarted; // FIXME
      if (!cohorts.length) return { sejour_volontaires_à_contacter: [] };

      const response = await esClient.msearch({
        index: "young",
        body: buildArbitratyNdJson(
          { index: "young", type: "_doc" },
          withAggs(
            queryFromFilter([
              { terms: { "cohort.keyword": cohorts } },
              {
                bool: {
                  should: [{ term: { ppsBeneficiary: "true" } }, { term: { paiBeneficiary: "true" } }, { term: { allergies: "true" } }, { term: { handicap: "true" } }],
                  minimum_should_match: 1,
                },
              },
            ]),
            "cohort.keyword",
          ),
        ),
      });

      return {
        sejour_volontaires_à_contacter: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    // Chef de centre (A renseigner) X chefs de centre sont à renseigner pour le séjour de [Février 2023 - C]
    // sejour_chef_de_centre
    async function sejourChefDeCentre() {
      const cohorts = cohortsNotStarted; // FIXME
      if (!cohorts.length) return { sejour_chef_de_centre: [] };

      const response = await esClient.msearch({
        index: "sessionphase1",
        body: buildArbitratyNdJson(
          { index: "sessionphase1", type: "_doc" },
          withAggs(queryFromFilter([{ terms: { "cohort.keyword": cohorts } }, { exists: { field: "headCenterId" } }]), "cohort.keyword"),
        ),
      });

      return {
        sejour_chef_de_centre: response.body.responses[0].aggregations.cohort.buckets.map((e) => {
          return {
            cohort: e.key,
            count: e.doc_count,
          };
        }),
      };
    }

    async function basicInscriptions() {
      const response = await esClient.msearch({
        index: "young",
        body: buildArbitratyNdJson(
          // Dossier (À instruire) X dossiers d’inscriptions sont en attente de validation.
          // inscription_en_attente_de_validation
          { index: "young", type: "_doc" },
          queryFromFilter([
            { terms: { "cohort.keyword": cohortsNotFinished } },
            { terms: { "status.keyword": ["WAITING_VALIDATION"] } },
            { bool: { must_not: { exists: { field: "correctionRequests.keyword" } } } },
          ]),
          // Dossier (À instruire) X dossiers d’inscription corrigés sont à instruire de nouveau.
          // inscription_corrigé_à_instruire_de_nouveau
          { index: "young", type: "_doc" },
          queryFromFilter([
            { terms: { "cohort.keyword": cohortsNotFinished } },
            { terms: { "status.keyword": ["WAITING_VALIDATION"] } },
            { bool: { must: { exists: { field: "correctionRequests.keyword" } } } },
          ]),
          // Dossier (À relancer) X dossiers d’inscription en attente de correction
          // inscription_en_attente_de_correction
          { index: "young", type: "_doc" },
          queryFromFilter([{ terms: { "cohort.keyword": cohortsNotFinished } }, { terms: { "status.keyword": ["WAITING_CORRECTION"] } }]),
        ),
      });
      const results = response.body.responses;
      return {
        inscription_en_attente_de_validation: results[0].hits.total.value,
        inscription_corrigé_à_instruire_de_nouveau: results[1].hits.total.value,
        inscription_en_attente_de_correction: results[2].hits.total.value,
      };
    }

    async function basicEngagement() {
      const response = await esClient.msearch({
        index: "application",
        body: buildArbitratyNdJson(
          // Contrat (À suivre) X contrats d’engagement sont à éditer par la structure d’accueil et à envoyer en signature
          // engagement_contrat_à_éditer
          { index: "application", type: "_doc" },
          queryFromFilter(
            [
              // { terms: { "youngCohort.keyword": cohortsNotFinished } },
              { terms: { "contractStatus.keyword": ["WAITING_VALIDATION"] } },
              { terms: { "status.keyword": ["VALIDATED", "IN_PROGRESS"] } },
            ],
            {
              regionField: "youngRegion",
              departmentField: "youngDepartment",
            },
          ),
          // Contrat (À suivre) X contrats d’engagement sont en attente de signature.
          // engagement_contrat_en_attente_de_signature
          { index: "application", type: "_doc" },
          queryFromFilter([{ terms: { "contractStatus.keyword": ["SENT"] } }, { terms: { "status.keyword": ["VALIDATED", "IN_PROGRESS"] } }], {
            regionField: "youngRegion",
            departmentField: "youngDepartment",
          }),
          // Dossier d’éligibilité (À vérifier)  X dossiers d’éligibilité en préparation militaire sont en attente de vérification.
          // engagement_dossier_militaire_en_attente_de_validation
          { index: "young", type: "_doc" },
          queryFromFilter([{ terms: { "statusMilitaryPreparationFiles.keyword": ["WAITING_VERIFICATION"] } }]),
          // Mission (À instruire) X missions sont en attente de validation
          // engagement_mission_en_attente_de_validation
          { index: "mission", type: "_doc" },
          queryFromFilter([{ terms: { "status.keyword": ["WAITING_VALIDATION"] } }]),
        ),
      });
      const results = response.body.responses;
      return {
        engagement_contrat_à_éditer: results[0].hits.total.value,
        engagement_contrat_en_attente_de_signature: results[1].hits.total.value,
        engagement_dossier_militaire_en_attente_de_validation: results[2].hits.total.value,
        engagement_mission_en_attente_de_validation: results[3].hits.total.value,
      };
    }
    return res.status(200).send({
      ok: true,
      data: {
        inscription: {
          ...(await basicInscriptions()),
          ...(await droitImageParCohorte()),
          ...(await inscriptionAttenteValidationParCohorte()),
        },
        sejour: {
          ...(await sejourRassemblementNonConfirmé()),
          ...(await sejourParticipationNonConfirmée()),
          ...(await pointDeRassemblementADéclarer()),
          ...(await centreADéclarer()),
          ...(await sejourEmploiDuTempsNonDéposé()),
          ...(await sejourContactÀRenseigner()),
          ...(await sejourVolontairesÀContacter()),
          ...(await sejourChefDeCentre()),
        },
        engagement: {
          ...(await basicEngagement()),
        },
      },
    });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR });
  }
});

module.exports = router;
