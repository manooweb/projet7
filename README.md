<p align="center">
   <img src="./front/src/favicon.png" width="192px" />
</p>

# MicroCRM (P7 - Développeur Full-Stack - Java et Angular - Mettez en œuvre l'intégration et le déploiement continu d'une application Full-Stack)

MicroCRM est une application de démonstration basique ayant pour être objectif de servir de socle pour le module "P7 - Développeur Full-Stack".

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

- [OpenJDK >= 17](https://openjdk.org/)

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

La CI publie les images sur GitHub Container Registry à chaque push sur `main` : `ghcr.io/manooweb/microcrm-back` et `ghcr.io/manooweb/microcrm-front`, taguées par le SHA du commit et `latest`.

```shell
docker compose pull                   # dernières images publiées (latest)
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
