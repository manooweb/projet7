// Métriques DORA et KPI du pipeline, calculés à partir de l'historique GitHub Actions du workflow CI.
//
// Usage : node scripts/metriques-ci.mjs [--cache DOSSIER] [--badges DOSSIER] > metriques.md
// - Node 22, sans dépendance. Lit l'API de GitHub : 60 requêtes par heure sans jeton ; la variable GITHUB_TOKEN,
//   si elle existe, relève cette limite (c'est le cas dans le workflow « Métriques »).
// - --cache garde les réponses sur disque pour relancer le calcul sans nouvelles requêtes.
// - --badges écrit un fichier JSON par métrique DORA, au format des badges « endpoint » de shields.io.
//
// Définitions (MicroCRM n'a pas de plateforme d'exploitation : la « production » est le registre GHCR) :
// - déploiement : run déclenché par un push sur main, dont les jobs de publication des images ont réussi ;
// - échec d'un changement : push sur main dont le run a échoué au moins une fois (relances comprises) ;
// - rétablissement : de la fin d'une tentative en échec sur main à la fin de la tentative réussie suivante ;
// - délai de livraison : du premier commit d'une pull request à la fin du déploiement de sa fusion.

import fs from "node:fs";
import path from "node:path";

const DEPOT = "manooweb/projet7";
const API = `https://api.github.com/repos/${DEPOT}`;
const WORKFLOW = "ci.yml";
const JOB_PUBLICATION = "Image"; // préfixe des jobs qui construisent et publient les images

const option = (nom) => (process.argv.includes(nom) ? process.argv[process.argv.indexOf(nom) + 1] : null);
const cache = option("--cache");
const dossierBadges = option("--badges");

// --- Accès à l'API GitHub, avec cache facultatif sur disque
async function get(chemin) {
  const fichier = cache ? path.join(cache, chemin.replace(/[/?&=]/g, "_") + ".json") : null;
  if (fichier && fs.existsSync(fichier)) return JSON.parse(fs.readFileSync(fichier, "utf8"));

  const entetes = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) entetes.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const reponse = await fetch(`${API}/${chemin}`, { headers: entetes });
  if (!reponse.ok) throw new Error(`${reponse.status} sur ${chemin} : ${await reponse.text()}`);
  const donnees = await reponse.json();

  if (fichier) {
    fs.mkdirSync(cache, { recursive: true });
    fs.writeFileSync(fichier, JSON.stringify(donnees));
  }
  return donnees;
}

// --- Petits outils de calcul et d'affichage
const minutes = (debut, fin) => (new Date(fin) - new Date(debut)) / 60000;
const nombre = (x, decimales = 1) => x.toFixed(decimales).replace(".", ",");
const pourcent = (n, total) => (total ? `${Math.round((100 * n) / total)} %` : "–");

function duree(min) {
  if (min == null) return "–";
  if (min < 60) return `${nombre(min)} min`;
  if (min < 48 * 60) return `${nombre(min / 60)} h`;
  return `${nombre(min / 1440)} j`;
}

function mediane(valeurs) {
  if (!valeurs.length) return null;
  const v = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(v.length / 2);
  return v.length % 2 ? v[milieu] : (v[milieu - 1] + v[milieu]) / 2;
}

const moyenne = (valeurs) => (valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : null);

// --- 1. Runs terminés du workflow CI, page par page (100 par page)
const runs = [];
for (let page = 1; ; page++) {
  const { workflow_runs } = await get(`actions/workflows/${WORKFLOW}/runs?status=completed&per_page=100&page=${page}`);
  runs.push(...workflow_runs);
  if (workflow_runs.length < 100) break;
}
runs.sort((a, b) => a.created_at.localeCompare(b.created_at));

// --- 2. Chaque tentative (relance comprise) compte, avec ses jobs
const tentatives = [];
for (const run of runs) {
  for (let n = 1; n <= run.run_attempt; n++) {
    const tentative = n === run.run_attempt ? run : await get(`actions/runs/${run.id}/attempts/${n}`);
    const { jobs } = await get(`actions/runs/${run.id}/attempts/${n}/jobs?per_page=50`);
    tentatives.push({
      run: run.id, evenement: run.event, branche: run.head_branch, sha: run.head_sha,
      conclusion: tentative.conclusion, debut: tentative.run_started_at, fin: tentative.updated_at, jobs,
    });
  }
}

const surMain = tentatives.filter((t) => t.evenement === "push" && t.branche === "main");
const publie = (t) => t.jobs.some((j) => j.name.startsWith(JOB_PUBLICATION) && j.conclusion === "success");
const deploiements = surMain.filter((t) => t.conclusion === "success" && publie(t));
if (!deploiements.length) throw new Error("Aucun déploiement trouvé : rien à calculer.");

// --- 3. Fréquence de déploiement, depuis le premier déploiement (mise en place du déploiement continu)
const debutCD = deploiements.map((t) => t.debut).sort()[0];
const finPeriode = tentatives.map((t) => t.fin).sort().at(-1);
const periodeJours = minutes(debutCD, finPeriode) / 1440;
const frequence = deploiements.length / periodeJours;

// --- 4. Taux d'échec : un changement = un run de push sur main ; il échoue si une de ses tentatives a échoué
function changements(liste) {
  const parRun = new Map();
  for (const t of liste) parRun.set(t.run, [...(parRun.get(t.run) ?? []), t.conclusion]);
  const echecs = [...parRun.values()].filter((conclusions) => conclusions.includes("failure")).length;
  return { total: parRun.size, echecs };
}
const depuisCD = changements(surMain.filter((t) => t.debut >= debutCD));
const historique = changements(surMain);

// --- 5. Temps de rétablissement : d'une tentative en échec sur main à la tentative réussie suivante
const retablissements = [];
let enPanneDepuis = null;
for (const t of [...surMain].sort((a, b) => a.fin.localeCompare(b.fin))) {
  if (t.conclusion === "failure" && !enPanneDepuis) enPanneDepuis = t.fin;
  else if (t.conclusion === "success" && enPanneDepuis) {
    retablissements.push(minutes(enPanneDepuis, t.fin));
    enPanneDepuis = null;
  }
}
const mttr = moyenne(retablissements);

// --- 6. Délai de livraison : premier commit de la PR -> fin du déploiement du commit de fusion
const finDeploiement = new Map(deploiements.map((t) => [t.sha, t.fin]));
const delais = [];
for (const pr of await get("pulls?state=closed&per_page=100")) {
  const fin = finDeploiement.get(pr.merge_commit_sha);
  if (!pr.merged_at || !fin) continue;
  const commits = await get(`pulls/${pr.number}/commits?per_page=100`);
  const premierCommit = commits.map((c) => c.commit.author.date).sort()[0];
  delais.push({
    numero: pr.number, titre: pr.title,
    total: minutes(premierCommit, fin),
    avantPR: minutes(premierCommit, pr.created_at),
    revue: minutes(pr.created_at, pr.merged_at),
    pipeline: minutes(pr.merged_at, fin),
  });
}
delais.sort((a, b) => a.numero - b.numero);
const delaiMedian = mediane(delais.map((d) => d.total));

// --- 7. KPI : durées des runs, des jobs et des étapes de tests ; taux de réussite
const runsPR = tentatives.filter((t) => t.evenement === "pull_request");
const runsDependabot = runsPR.filter((t) => t.branche.startsWith("dependabot/"));
const runsEquipe = runsPR.filter((t) => !t.branche.startsWith("dependabot/"));
const runsPlanifies = tentatives.filter((t) => t.evenement === "schedule");
const reussis = (liste) => liste.filter((t) => t.conclusion === "success").length;

const jobsReussis = (liste, prefixe) =>
  liste.flatMap((t) => t.jobs).filter((j) => j.name.startsWith(prefixe) && j.conclusion === "success" && j.completed_at);
const dureesJobs = (liste, prefixe) => jobsReussis(liste, prefixe).map((j) => minutes(j.started_at, j.completed_at));
const dureesEtape = (liste, prefixe, etape) =>
  jobsReussis(liste, prefixe)
    .flatMap((j) => j.steps)
    .filter((s) => s.name.includes(etape) && s.completed_at)
    .map((s) => minutes(s.started_at, s.completed_at));

const tous = [...surMain, ...runsPR];
const kpi = [
  ["Durée d'un run sur main (déploiement)", deploiements.map((t) => minutes(t.debut, t.fin))],
  ["Durée d'un run de PR", runsEquipe.filter((t) => t.conclusion === "success").map((t) => minutes(t.debut, t.fin))],
  ["Job back (build, tests, analyse)", dureesJobs(tous, "Back")],
  ["Job front (build, tests, analyse)", dureesJobs(tous, "Front")],
  ["Étape build et tests back (Gradle)", dureesEtape(tous, "Back", "tests et couverture")],
  ["Étape tests front (Karma)", dureesEtape(tous, "Front", "Tests et couverture")],
  ["Images (build, Trivy, publication)", dureesJobs(surMain, JOB_PUBLICATION)],
  ["Test de fumée", dureesJobs(surMain, "Test de fumée")],
];

// --- 8. Rapport Markdown
const date = (iso) => new Date(iso).toLocaleString("fr-FR", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" });
const lignes = [
  `# Métriques du pipeline – ${DEPOT}`,
  "",
  `Calcul du ${date(new Date().toISOString())} UTC sur ${runs.length} runs CI (${tentatives.length} tentatives). ` +
    `Déploiement continu depuis le ${date(debutCD)} UTC (${nombre(periodeJours)} jours).`,
  "",
  "## DORA",
  "",
  "| Métrique | Valeur | Détail |",
  "|---|---|---|",
  `| Fréquence de déploiement | ${nombre(frequence)} par jour | ${deploiements.length} déploiements en ${nombre(periodeJours)} jours |`,
  `| Délai de livraison (médiane) | ${duree(delaiMedian)} | ${delais.length} PR, de ${duree(Math.min(...delais.map((d) => d.total)))} à ${duree(Math.max(...delais.map((d) => d.total)))} |`,
  `| Taux d'échec des changements | ${pourcent(depuisCD.echecs, depuisCD.total)} depuis le déploiement continu | ` +
    `${depuisCD.echecs} sur ${depuisCD.total} ; ${pourcent(historique.echecs, historique.total)} sur tout l'historique (${historique.echecs} sur ${historique.total}) |`,
  `| Temps de rétablissement (MTTR) | ${duree(mttr)} | ${retablissements.length} incident(s) sur main |`,
  "",
  "## Délai de livraison par PR",
  "",
  "| PR | Total | Commit → PR | Revue (PR → fusion) | Fusion → déploiement |",
  "|---|---|---|---|---|",
  ...delais.map((d) => `| #${d.numero} ${d.titre.slice(0, 60)} | ${duree(d.total)} | ${duree(d.avantPR)} | ${duree(d.revue)} | ${duree(d.pipeline)} |`),
  "",
  "## KPI du pipeline",
  "",
  "| KPI | Valeur (médiane ou taux) | Mesures |",
  "|---|---|---|",
  ...kpi.map(([libelle, valeurs]) => `| ${libelle} | ${duree(mediane(valeurs))} | ${valeurs.length} |`),
  `| Runs de PR réussis (équipe) | ${pourcent(reussis(runsEquipe), runsEquipe.length)} | ${runsEquipe.length} |`,
  `| Runs de PR réussis (Dependabot) | ${pourcent(reussis(runsDependabot), runsDependabot.length)} | ${runsDependabot.length} |`,
  `| Runs planifiés (nuit) réussis | ${pourcent(reussis(runsPlanifies), runsPlanifies.length)} | ${runsPlanifies.length} |`,
];
console.log(lignes.join("\n"));

// --- 9. Badges : un fichier JSON par métrique, lu par shields.io (https://shields.io/badges/endpoint-badge)
if (dossierBadges) {
  const badges = {
    "frequence-deploiement": ["déploiements", `${nombre(frequence)} / jour`],
    "delai-livraison": ["délai de livraison", duree(delaiMedian)],
    "taux-echec": ["taux d'échec", pourcent(depuisCD.echecs, depuisCD.total)],
    "mttr": ["MTTR", duree(mttr)],
  };
  fs.mkdirSync(dossierBadges, { recursive: true });
  for (const [fichier, [label, message]] of Object.entries(badges)) {
    const badge = { schemaVersion: 1, label, message, color: "blue" };
    fs.writeFileSync(path.join(dossierBadges, `${fichier}.json`), JSON.stringify(badge) + "\n");
  }
}
