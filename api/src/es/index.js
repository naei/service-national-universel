const { Client } = require("@elastic/elasticsearch");
const fs = require("fs");
const { ES_ENDPOINT, LOG_ALL_ES_QUERIES } = require("../config");

const cyrb53 = function (str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

let esClient;

if (ES_ENDPOINT) {
  esClient = new Client({ node: `https://${ES_ENDPOINT}` });
  if (LOG_ALL_ES_QUERIES) {
    esClient.originalMsearch = esClient.msearch;
    esClient.msearch = async (...params) => {
      const { body, index } = params[0];
      const fileName = __dirname + `/../__tests__/es-snapshots/${index}-${cyrb53(body)}.ndjson`;
      const fileContent = body;
      const fileExists = fs.existsSync(fileName);
      if (!fileExists) {
        fs.writeFileSync(fileName, fileContent);
      }
      return esClient.originalMsearch(...params);
    };
  }
} else {
  console.log("Can't initialize ES. Missing envs");
}

module.exports = esClient;
