# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/Midden/package.json ./apps/Midden/
RUN npm ci
COPY shared ./shared
COPY apps/Midden ./apps/Midden
ARG VITE_CANTEEN_URL
ENV VITE_CANTEEN_URL=$VITE_CANTEEN_URL
RUN npm run build -w apps/Midden

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/apps/Midden/dist /usr/share/nginx/html
COPY apps/Midden/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]