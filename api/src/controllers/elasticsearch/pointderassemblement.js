const passport = require("passport");
const express = require("express");
const router = express.Router();
const { capture } = require("../../sentry");
const esClient = require("../../es");
const { ERRORS } = require("../../utils");
const { allRecords } = require("../../es/utils");
const { joiElasticSearch, buildNdJson, buildRequestBody } = require("./utils");

router.post("/:action(search|export)", passport.authenticate(["referent"], { session: false, failWithError: true }), async (req, res) => {
  try {
    // Configuration
    const searchFields = ["name", "address", "region", "department", "code", "city", "zip"];
    const filterFields = ["cohorts.keyword", "region.keyword", "department.keyword"];
    const sortFields = [];

    // Body params validation
    const { queryFilters, page, sort, error } = joiElasticSearch({ filterFields, sortFields, body: req.body });
    if (error) return res.status(400).send({ ok: false, code: ERRORS.INVALID_PARAMS });

    // Context filters
    let contextFilters = [];

    // Build request body
    const { hitsRequestBody, aggsRequestBody } = buildRequestBody({ searchFields, filterFields, queryFilters, page, sort, contextFilters });

    if (req.params.action === "export") {
      const response = await allRecords("pointderassemblement", hitsRequestBody.query);
      return res.status(200).send({ ok: true, data: response });
    } else {
      const response = await esClient.msearch({
        index: "pointderassemblement",
        body: buildNdJson({ index: "pointderassemblement", type: "_doc" }, hitsRequestBody, aggsRequestBody),
      });
      return res.status(200).send(response.body);
    }
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: ERRORS.SERVER_ERROR });
  }
});

module.exports = router;
