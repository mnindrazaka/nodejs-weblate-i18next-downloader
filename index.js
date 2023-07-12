const axios = require("axios").default;
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();

const apiClient = axios.create({
  baseURL: process.env.API_URL,
  headers: { Authorization: `Token ${process.env.API_KEY}` },
});

const PROJECT_NAME = process.env.PROJECT_NAME;

function getLanguages() {
  return apiClient
    .get(`/projects/${PROJECT_NAME}/languages/?format=json`)
    .then((response) => response.data);
}

function getComponents() {
  return apiClient
    .get(`/projects/${PROJECT_NAME}/components/?format=json`)
    .then((response) =>
      response.data.results.filter((component) => component.slug !== "glossary")
    );
}

function downloadTranslationFile({ componentSlug, languageCode }) {
  apiClient
    .get(
      `/translations/${PROJECT_NAME}/${componentSlug}/${languageCode}/file/`,
      { responseType: "stream" }
    )
    .then((response) => {
      const writer = fs.createWriteStream(
        path.join(
          __dirname,
          "public",
          "locales",
          languageCode,
          `${componentSlug}.json`
        )
      );
      response.data.pipe(writer);
    });
}

async function main() {
  const LOCALES_PATH = path.join(__dirname, "public", "locales");
  fs.emptyDirSync(LOCALES_PATH);

  const languages = await getLanguages();
  const components = await getComponents();

  languages.forEach((language) => {
    fs.mkdirSync(path.join(LOCALES_PATH, language.code), {
      recursive: true,
    });

    components.forEach((component) => {
      console.log(
        `[translation] Downloading ${language.code}/${component.slug}.json`
      );
      downloadTranslationFile({
        componentSlug: component.slug,
        languageCode: language.code,
      });
    });
  });
}

main();
