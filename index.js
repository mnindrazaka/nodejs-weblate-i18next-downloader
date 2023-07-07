const axios = require("axios").default;
const AdmZip = require("adm-zip");
const fs = require("fs-extra");
const path = require("path");

const PROJECT_NAME = "karirlab-frontend";
const EXCLUDED_NAMESPACE = "glossary";
const LOCALES_PATH = path.join(__dirname, "public", "locales");
const WEBLATE_EXTRACT_PATH = path.join(LOCALES_PATH, PROJECT_NAME);
const DOWNLOAD_URL = `http://localhost/download/${PROJECT_NAME}`;

async function downloadAndExtractZip(url, outputPath) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const zip = new AdmZip(response.data);
    zip.extractAllTo(outputPath, true);
  } catch (err) {
    throw err;
  }
}

function getNameSpaces() {
  return fs
    .readdirSync(WEBLATE_EXTRACT_PATH)
    .filter((namespace) => namespace !== EXCLUDED_NAMESPACE);
}

function getLanguages(namespaces) {
  const languagesMap = {};
  namespaces.forEach((namespace) => {
    const namespaceLanguages = fs.readdirSync(
      path.join(WEBLATE_EXTRACT_PATH, namespace, namespace)
    );
    namespaceLanguages.forEach((languageKey) => {
      const language = languageKey.split(".")[0];
      languagesMap[language] = true;
    });
  });

  const languages = Object.keys(languagesMap);
  return languages;
}

function restructureFile(languages, namespaces) {
  languages.forEach((language) => {
    if (!fs.existsSync(path.join(LOCALES_PATH, language))) {
      fs.mkdirSync(path.join(LOCALES_PATH, language));
    }

    namespaces.forEach((namespace) => {
      const data = fs.readFileSync(
        path.join(
          WEBLATE_EXTRACT_PATH,
          namespace,
          namespace,
          language + ".json"
        )
      );
      fs.writeFileSync(
        path.join(LOCALES_PATH, language, namespace + ".json"),
        data
      );
    });
  });
}

function main() {
  downloadAndExtractZip(DOWNLOAD_URL, LOCALES_PATH);
  const namespaces = getNameSpaces();
  const languages = getLanguages(namespaces);
  restructureFile(languages, namespaces);
}

main();
