<p align="center">
   <img src="./front/src/favicon.png" width="192px" />
</p>

# MicroCRM

[![CI](https://github.com/manooweb/projet7/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/manooweb/projet7/actions/workflows/ci.yml)

Back :<br/> [![Quality gate back](https://sonarcloud.io/api/project_badges/measure?project=manooweb_projet7_back&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=manooweb_projet7_back) [![Couverture back](https://sonarcloud.io/api/project_badges/measure?project=manooweb_projet7_back&metric=coverage)](https://sonarcloud.io/summary/new_code?id=manooweb_projet7_back)<br/>
Front :<br/> [![Quality gate front](https://sonarcloud.io/api/project_badges/measure?project=manooweb_projet7_front&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=manooweb_projet7_front) [![Couverture front](https://sonarcloud.io/api/project_badges/measure?project=manooweb_projet7_front&metric=coverage)](https://sonarcloud.io/summary/new_code?id=manooweb_projet7_front)<br/>
DORA :<br/> [![Fréquence de déploiement](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmanooweb%2Fprojet7%2Fmetriques%2Ffrequence-deploiement.json)](https://github.com/manooweb/projet7/blob/metriques/metriques.md) [![Délai de livraison](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmanooweb%2Fprojet7%2Fmetriques%2Fdelai-livraison.json)](https://github.com/manooweb/projet7/blob/metriques/metriques.md) [![Taux d'échec des changements](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmanooweb%2Fprojet7%2Fmetriques%2Ftaux-echec.json)](https://github.com/manooweb/projet7/blob/metriques/metriques.md) [![Temps de rétablissement](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fmanooweb%2Fprojet7%2Fmetriques%2Fmttr.json)](https://github.com/manooweb/projet7/blob/metriques/metriques.md)

MicroCRM est une application full-stack (API Spring Boot, interface Angular), construite, testée, analysée et publiée par une chaîne d'intégration et de déploiement continus ([voir plus bas](#intégration-et-déploiement-continus)).

L'application MicroCRM est une implémentation simplifiée d'un ["CRM" (Customer Relationship Management)](https://fr.wikipedia.org/wiki/Gestion_de_la_relation_client). Les fonctionnalités sont limitées à la création, édition et la visualisations des individus liés à des organisations.

![Page d'accueil](./misc/screenshots/screenshot_1.png)
![Édition de la fiche d'un individu](./misc/screenshots/screenshot_2.png)

## Code source

### Organisation

Ce [monorepo](https://en.wikipedia.org/wiki/Monorepo) contient les 2 composantes du projet "MicroCRM":

- La partie serveur (ou "backend"), en Java SpringBoot 3;
- La partie cliente (ou "frontend"), en Angular 17.

### Démarrer avec les sources

#### Serveur

##### Dépendances

- [OpenJDK](https://openjdk.org/) 17 à 21 : Gradle 8.7 ne s'exécute pas au-delà de Java 21. La CI et les images utilisent Java 21.

##### Procédure

1. Se positionner dans le répertoire `back` avec une invite de commande:

   ```shell
   cd back
   ```

2. Construire le JAR:

   ```shell
   # Sur Linux
   ./gradlew build

   # Sur Windows
   gradlew.bat build
   ```

3. Démarrer le service:

   ```shell
   java -jar build/libs/microcrm-0.0.1-SNAPSHOT.jar
   ```

Puis ouvrir l'URL http://localhost:8080 dans votre navigateur.

#### Client

##### Dépendances

- [NPM >= 10.2.4](https://www.npmjs.com/)

##### Procédure

1. Se positionner dans le répertoire `front` avec une invite de commande:

   ```shell
   cd front
   ```

2. (La première fois seulement) Installer les dépendances NodeJS:

   ```shell
   npm install
   ```

3. Démarrer le service de développement:

   ```shell
   npx @angular/cli serve
   ```

Puis ouvrir l'URL http://localhost:4200 dans votre navigateur.

### Exécution des tests

#### Client

**Dépendances**

- Google Chrome ou Chromium

Dans votre terminal:

```shell
cd front
CHROME_BIN=</path/to/google/chrome> npm test
```

#### Serveur

Dans votre terminal:

```shell
cd back
./gradlew test
```

### Lancer avec Docker Compose

C'est la façon recommandée de lancer l'application complète : les images sont construites à partir des cibles `back` et `front` du `Dockerfile`, les mêmes que celles publiées par la CI.

#### Dépendances

- [Docker](https://docs.docker.com/get-docker/) avec le plugin Compose (`docker compose version`)
- Ports 80, 443 et 8080 libres sur le poste

#### Procédure

1. Construire les images et démarrer les services, depuis la racine du dépôt :

   ```shell
   docker compose up --build --wait
   ```

   `--wait` rend la main une fois le back déclaré sain par son healthcheck et le front démarré (mode détaché implicite).

2. Vérifier l'état des services :

   ```shell
   docker compose ps
   ```

L'application est disponible sur https://localhost et l'API sur http://localhost:8080.

#### Avec les images publiées (sans build)

La CI publie les images sur GitHub Container Registry à chaque push sur `main` : `ghcr.io/manooweb/microcrm-back` et `ghcr.io/manooweb/microcrm-front`, taguées par le SHA du commit. `latest` ne pointe sur ces images qu'une fois le test de fumée réussi.

```shell
docker compose pull                   # dernières images validées (latest)
docker compose up -d --no-build --wait

MICROCRM_TAG=<sha> docker compose pull && MICROCRM_TAG=<sha> docker compose up -d --no-build --wait   # une version précise
```

#### Certificat HTTPS local

Caddy génère sa propre autorité de certification, conservée dans le volume `caddy_data`. Pour que le navigateur fasse confiance à https://localhost, importer cette autorité une seule fois :

```shell
docker compose cp front:/data/caddy/pki/authorities/local/root.crt ~/caddy-root.crt
```

- Firefox : _Paramètres > Vie privée et sécurité > Sécurité logicielle et des connexions > Certificats > Gérer les certificats > Autorités > Importer_, puis cocher « Confirmer cette AC pour identifier des sites web ».
- Chrome / Chromium (Linux, paquet `libnss3-tools`) :

  ```shell
  certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "Caddy local" -i ~/caddy-root.crt
  ```

Tant que le volume `caddy_data` est conservé, l'autorité reste la même et l'import n'est pas à refaire.

#### Arrêter

```shell
docker compose down      # conserve les volumes, donc l'autorité de certification
docker compose down -v   # supprime aussi les volumes : l'autorité sera régénérée et à réimporter
```

### Monitoring local avec ELK

Centralise les logs du back et du front lancés avec Docker Compose, et les affiche dans un tableau de bord Kibana : volume, erreurs, durée des requêtes de l'API.

| Composant | Rôle |
|---|---|
| Filebeat | Lit les logs des conteneurs MicroCRM écrits par Docker |
| Logstash | Les structure (`elk/logstash/logstash.conf`) |
| Elasticsearch | Les stocke, un index par jour (`microcrm-logs-AAAA.MM.JJ`) |
| Kibana | Les affiche ; tableau de bord importé au démarrage (`elk/kibana/tableau-de-bord.ndjson`) |

Formats des logs : le back écrit en JSON grâce au profil Spring `docker`, activé dans l'image (`application-docker.properties`) ; Caddy écrit le journal des requêtes du front en JSON.

#### Dépendances

- Docker Engine sous Linux : Filebeat lit `/var/lib/docker/containers`.
- Environ 4 Go de mémoire libre (limites : Elasticsearch 2 Go, Logstash 1 Go, Kibana 1 Go, Filebeat 256 Mo).

#### Procédure

1. Lancer l'application, puis la stack ELK (projet Compose distinct, `microcrm-elk`) :

    ```shell
    docker compose up -d --build --wait
    docker compose -f docker-compose-elk.yml up -d
    ```

2. Après environ une minute, ouvrir le tableau de bord *MicroCRM – logs de l'application* : http://localhost:5601/app/dashboards#/view/microcrm-tableau-de-bord

3. Pour alimenter le tableau de bord, générer du trafic de démonstration (requêtes normales, 404, 500) :

    ```shell
    elk/generer-trafic.sh 60
    ```

La sécurité d'Elasticsearch est désactivée (ni mot de passe ni TLS) : les ports 9200 et 5601 ne sont ouverts que sur `127.0.0.1`. Cette configuration est réservée au poste de développement.

#### Arrêter

```shell
docker compose -f docker-compose-elk.yml down      # conserve les logs indexés
docker compose -f docker-compose-elk.yml down -v   # supprime aussi les logs indexés
```

### Métriques DORA et KPI du pipeline

Les badges en tête de ce README donnent les 4 métriques DORA ; ils renvoient au rapport complet (DORA, délai de livraison par pull request, KPI du pipeline).

- `scripts/metriques-ci.mjs` (Node 22, sans dépendance) calcule ces métriques à partir de l'historique du workflow CI, lu par l'API de GitHub. Les définitions retenues (déploiement, échec, rétablissement, délai de livraison) sont en tête du script.
- Le workflow `Métriques` le lance après chaque run CI sur `main`, chaque lundi et à la demande. Il affiche le rapport dans le récapitulatif du run et publie le rapport et les fichiers des badges sur la branche `metriques`, réécrite à chaque calcul.

Pour calculer les métriques en local :

```shell
node scripts/metriques-ci.mjs --cache /tmp/metriques-ci > metriques.md
```

- Sans jeton, l'API de GitHub accepte 60 requêtes par heure, et un calcul en consomme environ 50. La variable `GITHUB_TOKEN` relève cette limite.
- `--cache` garde les réponses sur disque : un second calcul ne fait plus aucune requête. Vider le dossier pour prendre en compte les nouveaux runs.

### Images Docker

#### Client

##### Construire l'image

```shell
docker build --target front -t orion-microcrm-front:latest .
```

##### Exécuter l'image

```shell
docker run -it --rm -p 80:80 -p 443:443 orion-microcrm-front:latest
```

L'application sera disponible sur https://localhost.

#### Serveur

##### Construire l'image

```shell
docker build --target back -t orion-microcrm-back:latest .
```

##### Exécuter l'image

```shell
docker run -it --rm -p 8080:8080 orion-microcrm-back:latest
```

L'API sera disponible sur http://localhost:8080.

#### Tout en un

```shell
docker build --target standalone -t orion-microcrm-standalone:latest .
```

##### Exécuter l'image

```shell
docker run -it --rm -p 8080:8080 -p 80:80 -p 443:443 orion-microcrm-standalone:latest
```

L'application sera disponible sur https://localhost et l'API sur http://localhost:8080.

## Intégration et déploiement continus

### Pipeline

Le workflow `CI` (`.github/workflows/ci.yml`) se déclenche sur une pull request vers `main`, un push sur `main`, chaque nuit (02:23 UTC) et à la demande (onglet *Actions*, *Run workflow*).

| Job | Quand | Rôle |
|---|---|---|
| Back | Toujours | Build Gradle, tests JUnit, couverture JaCoCo, analyse SonarQube Cloud |
| Front | Toujours | `npm ci`, tests Karma (Chrome headless), couverture lcov, build Angular, analyse SonarQube Cloud |
| Image back, Image front | Toujours, après Back et Front | Build de l'image, rapport Trivy ; publication sur GHCR (tag du SHA) sur un push vers `main` seulement |
| Test de fumée | Push sur `main` | Démarre les images publiées avec `docker-compose.yml`, interroge l'API et le front |
| Promotion latest | Push sur `main`, après le test de fumée | Fait pointer `latest` sur les images testées (même digest) |

Le récapitulatif de chaque run donne la synthèse Trivy des deux images ; les rapports de tests et de couverture sont conservés 14 jours en artefacts.

### Choix techniques

- **Ce qui bloque** : un échec du build ou des tests. Une règle de protection de `main` impose une pull request et exige que les jobs Back, Front et Images aient réussi.
- **Ce qui rend compte sans bloquer** : la quality gate SonarQube et le scan Trivy. Ils mesurent la dette de l'application existante, traitée par le plan de mise à jour, sans arrêter la livraison. Une faille acceptée faute de correctif est inscrite, justifiée et datée, dans `.trivyignore.yaml`.
- **`latest` ne désigne que des images testées** : il n'avance qu'après le test de fumée. Une image publiée mais défaillante n'est jamais récupérée par défaut.
- **Actions fixées par SHA de commit**, version en commentaire : un tag peut être déplacé, un SHA non.
- **Permissions minimales** : lecture seule par défaut ; écriture des paquets pour les seuls jobs Images et Promotion ; écriture dans le dépôt pour le seul workflow `Métriques`, sur sa branche `metriques`.
- **Exécution nocturne** : elle révèle ce qui change sans nouveau commit (faille publiée après coup, dépendance ou image de base modifiée). Elle ne publie rien.

### Secrets

| Secret | Usage |
|---|---|
| `SONAR_TOKEN_BACK`, `SONAR_TOKEN_FRONT` | Un jeton SonarQube Cloud par projet, à créer dans *Settings > Secrets and variables > Actions* |
| `GITHUB_TOKEN` | Fourni par GitHub à chaque run : publication sur GHCR, écriture de la branche `metriques` |

Sans jeton SonarQube (pull request d'un fork ou de Dependabot), l'analyse est sautée et le reste du pipeline s'exécute. Aucun secret n'est écrit dans le code, les images ou les logs.

### Mises à jour des dépendances

Dependabot (`.github/dependabot.yml`) propose chaque semaine les mises à jour des actions GitHub, des dépendances npm et Gradle et des images du `Dockerfile`, groupées par écosystème (une pull request par image Docker). Il attend 7 jours avant de proposer une version tout juste publiée, et écarte les montées de version majeure de npm, Gradle et des images, qui relèvent du plan de mise à jour. Chaque pull request passe la CI comme un changement de code.

### Métriques

Le workflow `Métriques` calcule les métriques DORA et les KPI du pipeline après chaque run CI sur `main` : voir [Métriques DORA et KPI du pipeline](#métriques-dora-et-kpi-du-pipeline).
