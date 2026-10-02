#!/bin/sh
set -e

# Em hospedagens como o Render só existe a URL do dono do banco (DATABASE_URL_OWNER).
# A URL da aplicação é montada a partir dela com o usuário restrito (menor privilégio).
# No docker-compose local DATABASE_URL já vem pronta e este bloco é ignorado.
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL=$(node -e '
    const url = new URL(process.env.DATABASE_URL_OWNER);
    url.username = process.env.APP_DB_USER;
    url.password = process.env.APP_DB_PASSWORD;
    console.log(url.toString());
  ')
  export DATABASE_URL
fi

# Migrations e preparação do banco rodam como dono; o servidor HTTP, como usuário restrito.
DATABASE_URL="$DATABASE_URL_OWNER" npx prisma migrate deploy
node dist/scripts/setupDatabase.js

# Sem acesso a shell no plano gratuito, o admin inicial é criado na subida (upsert idempotente).
if [ "$SEED_ON_START" = "true" ]; then
  npx prisma db seed
fi

exec node dist/main.js
