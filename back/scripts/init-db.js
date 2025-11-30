const { initializeSchema } = require("../db/schema");
const { dbPath } = require("../db/connection");

(async () => {
  try {
    await initializeSchema();
    console.log(`Base de données initialisée: ${dbPath}`);
    process.exit(0);
  } catch (err) {
    console.error("Échec de l'initialisation de la base:", err.message);
    process.exit(1);
  }
})();

