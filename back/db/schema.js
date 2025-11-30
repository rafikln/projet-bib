const { run } = require("./connection");

const initializeSchema = async () => {
  await run("PRAGMA foreign_keys = ON;");

  await run(
    `
      CREATE TABLE IF NOT EXISTS etudiants (
        id_etudiant INTEGER PRIMARY KEY AUTOINCREMENT,
        identifiant_unique TEXT NOT NULL UNIQUE,
        mot_de_passe_initial TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        filiere TEXT
      );
    `
  );

  await run(
    `
      CREATE TABLE IF NOT EXISTS bibliothecaires (
        id_bibliothecaire INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        mot_de_passe_hash TEXT NOT NULL,
        nom TEXT
      );
    `
  );

  await run(
    `
      CREATE TABLE IF NOT EXISTS categories (
        id_categorie INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL UNIQUE
      );
    `
  );

  await run(
    `
      CREATE TABLE IF NOT EXISTS livres (
        id_livre INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        auteur TEXT NOT NULL,
        categorie_id INTEGER,
        nb_exemplaires INTEGER NOT NULL DEFAULT 1 CHECK (nb_exemplaires >= 0),
        nb_disponibles INTEGER NOT NULL DEFAULT 1 CHECK (nb_disponibles >= 0),
        FOREIGN KEY (categorie_id)
          REFERENCES categories(id_categorie)
          ON UPDATE CASCADE
          ON DELETE SET NULL
      );
    `
  );

  await run(
    `
      CREATE TABLE IF NOT EXISTS emprunts (
        id_emprunt INTEGER PRIMARY KEY AUTOINCREMENT,
        id_etudiant INTEGER NOT NULL,
        id_livre INTEGER NOT NULL,
        date_emprunt TEXT NOT NULL DEFAULT (DATE('now')),
        date_retour_prevue TEXT,
        date_retour_reelle TEXT,
        statut TEXT NOT NULL DEFAULT 'en_cours',
        FOREIGN KEY (id_etudiant)
          REFERENCES etudiants(id_etudiant)
          ON UPDATE CASCADE
          ON DELETE CASCADE,
        FOREIGN KEY (id_livre)
          REFERENCES livres(id_livre)
          ON UPDATE CASCADE
          ON DELETE CASCADE
      );
    `
  );

  console.log("Schéma SQLite créé / vérifié.");
};

module.exports = { initializeSchema };

