# Images officielles, minimales (Alpine) et à version fixe. Les tests sont exécutés par la CI, pas pendant le build des images.

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

# ---- Front : Caddy sert l'application Angular ----
FROM caddy:2.11-alpine AS front

COPY misc/docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=front-build /src/dist/microcrm/browser /app/front

# Utilisateur non-root ; /data contient l'autorité de certification locale de Caddy (à conserver dans un volume)
RUN addgroup -S caddy && adduser -S -G caddy caddy \
    && chown -R caddy:caddy /data /config
USER caddy

EXPOSE 80 443

# ---- Back : JRE seul ----
FROM eclipse-temurin:21-jre-alpine-3.24 AS back

RUN addgroup -S microcrm && adduser -S -G microcrm microcrm

COPY --from=back-build /src/microcrm.jar /app/back/microcrm.jar

WORKDIR /app
USER microcrm

EXPOSE 8080

CMD ["java", "-jar", "/app/back/microcrm.jar"]

# ---- Standalone : front et back dans un seul conteneur (non publié) ----
FROM alpine:3.24 AS standalone

RUN apk add --no-cache caddy openjdk21-jre-headless supervisor

COPY --from=front-build /src/dist/microcrm/browser /app/front
COPY misc/docker/Caddyfile /app/Caddyfile
COPY --from=back-build /src/microcrm.jar /app/back/microcrm.jar
COPY misc/docker/supervisor.ini /app/supervisor.ini

WORKDIR /app

CMD ["/usr/bin/supervisord", "-c", "/app/supervisor.ini"]
