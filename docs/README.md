# Documentation de la chaîne CI/CD

| Fichier | Contenu |
|---|---|
| [documentation-ci-cd.pdf](documentation-ci-cd.pdf) | Documentation technique : pipeline, conteneurisation et déploiement, tests, sécurité, monitoring et métriques, sauvegarde, mises à jour |

## Captures

Les captures illustrent les annexes de la documentation (§ 10.3).

| Capture | Contenu |
|---|---|
| [github-run-ci.png](captures/github-run-ci.png) | Run CI sur `main` : enchaînement des jobs et durées |
| [github-run-trivy.png](captures/github-run-trivy.png) | Synthèse Trivy des images dans le récapitulatif du run |
| [sonar-overall-code-back.png](captures/sonar-overall-code-back.png) | SonarQube Cloud, back : quality gate et dette existante |
| [sonar-overall-code-front.png](captures/sonar-overall-code-front.png) | SonarQube Cloud, front : quality gate et dette existante |
| [kibana-tableau-de-bord.png](captures/kibana-tableau-de-bord.png) | Tableau de bord Kibana de l'application |
| [microcrm-readme-badges.png](captures/microcrm-readme-badges.png) | En-tête du README : badges CI, SonarQube et DORA |
| [github-rapport-metriques.png](captures/github-rapport-metriques.png) | Rapport du workflow Métriques : DORA et KPI du pipeline |

Les valeurs à jour des métriques sont dans les badges du [README](../README.md) et sur la branche [`metriques`](https://github.com/manooweb/projet7/blob/metriques/metriques.md).
