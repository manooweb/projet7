# Images officielles, minimales (Alpine) et à version fixe. Les tests sont exécutés par la CI, pas pendant le build des images.
# Les images d'exécution appliquent les correctifs Alpine publiés depuis la construction de leur image de base (apk upgrade).

# ---- Build du front ----
FROM node:22-alpine3.24 AS front-build

WORKDIR /src

# Dépendances d'abord : cette couche reste en cache tant que package*.json ne change pas
COPY front/package.json front/package-lock.json ./
RUN npm ci

COPY front/ ./
RUN npx @angular/cli build --optimization

# ---- Build du back ----
FROM eclipse-temurin:21-jdk-alpine-3.24 AS back-build

WORKDIR /src

COPY back/ ./
# bootJar produit le seul JAR exécutable, sans relancer les tests ; renommé pour ne pas dépendre de la version
RUN ./gradlew bootJar --no-daemon \
    && cp build/libs/*.jar /src/microcrm.jar

# ---- Build de Caddy : dépendances Go corrigées ----
# Caddy 2.11.7 embarque des versions vulnérables de x/net et go-jose ; on le recompile avec la version de Go
# de l'image officielle de build et les versions qui corrigent ces failles. À retirer quand une version de Caddy les intégrera.
FROM caddy:2.11-builder-alpine AS caddy-build

RUN xcaddy build v2.11.7 \
    --replace github.com/go-jose/go-jose/v4=github.com/go-jose/go-jose/v4@v4.1.6 \
    --replace golang.org/x/net=golang.org/x/net@v0.60.0 \
    && apk add --no-cache libcap-setcap \
    && setcap cap_net_bind_service=+ep /usr/bin/caddy

# ---- Front : Caddy sert l'application Angular ----
# Alpine nue plutôt que l'image officielle de Caddy, qui embarquerait en plus son propre binaire (non corrigé) et curl ;
# reprend de l'image officielle ce qui sert ici : certificats, types MIME (mailcap), dossiers et variables XDG.
FROM alpine:3.24 AS front

# Utilisateur non-root, qui écoute sur 80 et 443 grâce à la capacité cap_net_bind_service (posée à l'étape de build, conservée par COPY) ;
# /data contient l'autorité de certification locale de Caddy (à conserver dans un volume)
RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates mailcap \
    && mkdir -p /config/caddy /data/caddy /etc/caddy \
    && addgroup -S caddy && adduser -S -G caddy caddy \
    && chown -R caddy:caddy /config /data

COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy
COPY misc/docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=front-build /src/dist/microcrm/browser /app/front

ENV XDG_CONFIG_HOME=/config \
    XDG_DATA_HOME=/data

USER caddy

EXPOSE 80 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

# ---- Back : JRE seul ----
FROM eclipse-temurin:21-jre-alpine-3.24 AS back

RUN apk upgrade --no-cache \
    && addgroup -S microcrm && adduser -S -G microcrm microcrm

COPY --from=back-build /src/microcrm.jar /app/back/microcrm.jar

WORKDIR /app
USER microcrm

# Profil docker : logs en JSON et journal des requêtes, collectés par ELK (application-docker.properties)
ENV SPRING_PROFILES_ACTIVE=docker

EXPOSE 8080

CMD ["java", "-jar", "/app/back/microcrm.jar"]

# ---- Standalone : front et back dans un seul conteneur (non publié) ----
FROM alpine:3.24 AS standalone

RUN apk upgrade --no-cache \
    && apk add --no-cache caddy openjdk21-jre-headless supervisor

COPY --from=front-build /src/dist/microcrm/browser /app/front
COPY misc/docker/Caddyfile /app/Caddyfile
COPY --from=back-build /src/microcrm.jar /app/back/microcrm.jar
COPY misc/docker/supervisor.ini /app/supervisor.ini

WORKDIR /app

CMD ["/usr/bin/supervisord", "-c", "/app/supervisor.ini"]
