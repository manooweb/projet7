# Métriques du pipeline – manooweb/projet7

Calcul du 14/11/2026 09:13 UTC sur 58 runs CI (64 tentatives). Déploiement continu depuis le 03/11/2026 06:40 UTC (11,1 jours).

## DORA

| Métrique | Valeur | Détail |
|---|---|---|
| Fréquence de déploiement | 1,2 par jour | 13 déploiements en 11,1 jours |
| Délai de livraison (médiane) | 1,1 h | 11 PR, de 10,9 min à 17,4 h |
| Taux d'échec des changements | 0 % depuis le déploiement continu | 0 sur 13 ; 13 % sur tout l'historique (2 sur 16) |
| Temps de rétablissement (MTTR) | 1,6 h | 1 incident(s) sur main |

## Délai de livraison par PR

| PR | Total | Commit → PR | Revue (PR → fusion) | Fusion → déploiement |
|---|---|---|---|---|
| #4 ci: publication des images sur GHCR avec scan Trivy, test de | 17,4 h | 16,9 h | 25,1 min | 4,2 min |
| #5 build(deps-dev): bump node-forge from 1.3.1 to 1.4.2 in /fro | 1,3 h | 0,1 min | 1,2 h | 4,5 min |
| #6 build(deps): bump SonarSource/sonarqube-scan-action from 8.3 | 1,1 h | 0,1 min | 1,0 h | 4,2 min |
| #13 ci: latest n'avance qu'après le test de fumée des images pub | 13,9 h | 13,8 h | 4,1 min | 4,7 min |
| #14 ci: quality gate Sonar et scan Trivy en rapport, sans blocag | 23,4 min | 7,8 min | 11,1 min | 4,5 min |
| #16 feat: monitoring local avec la stack ELK | 16,7 h | 16,5 h | 4,0 min | 4,2 min |
| #17 feat: métriques DORA et KPI du pipeline, affichées en badges | 28,4 min | 19,9 min | 3,6 min | 4,8 min |
| #18 docs: badges CI et SonarQube en tête du README | 28,4 min | 16,9 min | 6,8 min | 4,6 min |
| #19 docs: corrige une erreur d'alignement dans le README sur le  | 10,9 min | 1,3 min | 5,5 min | 4,1 min |
| #20 docs: README avec la chaîne CI/CD | 32,3 min | 8,9 min | 19,0 min | 4,3 min |
| #22 docs: documentation CI/CD, captures et index dans docs/ | 1,8 h | 1,7 h | 4,9 min | 3,9 min |

## KPI du pipeline

| KPI | Valeur (médiane ou taux) | Mesures |
|---|---|---|
| Durée d'un run sur main (déploiement) | 4,4 min | 13 |
| Durée d'un run de PR | 3,7 min | 13 |
| Job back (build, tests, analyse) | 1,0 min | 44 |
| Job front (build, tests, analyse) | 1,4 min | 38 |
| Étape build et tests back (Gradle) | 0,4 min | 44 |
| Étape tests front (Karma) | 0,3 min | 38 |
| Images (build, Trivy, publication) | 1,6 min | 26 |
| Test de fumée | 0,4 min | 13 |
| Runs de PR réussis (équipe) | 100 % | 13 |
| Runs de PR réussis (Dependabot) | 63 % | 16 |
| Runs planifiés (nuit) réussis | 93 % | 14 |
