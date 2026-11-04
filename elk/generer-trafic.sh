#!/usr/bin/env bash
# Génère du trafic de démonstration sur MicroCRM lancé avec docker compose, pour alimenter le tableau de bord Kibana.
# Usage : elk/generer-trafic.sh [nombre de tours, 20 par défaut]
set -euo pipefail

TOURS="${1:-20}"
API="http://localhost:8080"
FRONT="https://localhost"

for ((i = 1; i <= TOURS; i++)); do
  curl -sk -o /dev/null "$FRONT/"                       # page du front (Caddy)
  curl -s -o /dev/null "$API/persons"                   # lecture normale
  curl -s -o /dev/null "$API/organizations"
  curl -s -o /dev/null "$API/persons/1"
  if ((i % 4 == 0)); then curl -s -o /dev/null "$API/persons/9999"; fi   # 404 : ressource absente
  if ((i % 7 == 0)); then curl -s -o /dev/null "$API/persons/abc"; fi    # 500 : identifiant invalide
  if ((i % 10 == 0)); then                                               # avertissement SQL côté back
    curl -s -o /dev/null -X POST -H 'Content-Type: text/uri-list' -d "$API/persons/9999" "$API/organizations/1/persons"
  fi
  sleep 1
done
echo "Trafic généré : $TOURS tours."
