FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend ci
COPY backend ./backend
COPY frontend ./frontend
COPY public ./public
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
