const express = require("express");
const { initializeSchema } = require("./db/schema");
const { all, dbPath } = require("./db/connection");

const PORT = process.env.PORT || 3000;
const tables = ["etudiants", "bibliothecaires", "categories", "livres", "emprunts"];

const fetchCounts = async () => {
  const counts = {};
  for (const table of tables) {
    const rows = await all(`SELECT COUNT(*) AS total FROM ${table}`);
    counts[table] = rows[0].total;
  }
  return counts;
};

const startServer = async () => {
  try {
    await initializeSchema();
    const counts = await fetchCounts();

    console.log("\nResume de la base de donnees:");
    tables.forEach((table) => {
      console.log(`- ${table}: ${counts[table]} enregistrements`);
    });
    console.log(`\nFichier SQLite: ${dbPath}`);
    console.log("Utilise scripts/init-db.js pour initialiser ou reinitialiser la base.");

    const app = express();

    app.get("/", (_req, res) => {
      res.json({ message: "Hello World depuis l'API Bibliotheque" });
    });

    app.get("/stats", async (_req, res) => {
      try {
        const latestCounts = await fetchCounts();
        res.json({ counts: latestCounts });
      } catch (error) {
        res.status(500).json({ error: "Impossible de recuperer les statistiques." });
      }
    });

    app.listen(PORT, () => {
      console.log(`Serveur API pret sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Erreur lors de la preparation de la base:", err.message);
    process.exit(1);
  }
};

startServer();
