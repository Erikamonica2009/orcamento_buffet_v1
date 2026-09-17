FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY --from=build /app/vitest.config.ts ./vitest.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/index.html ./index.html
COPY --from=build /app/src ./src
COPY --from=build /app/tests ./tests
EXPOSE 5173
CMD ["npm", "run", "preview"]
