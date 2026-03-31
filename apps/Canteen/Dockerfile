# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/Canteen/package.json ./apps/Canteen/
RUN npm ci
COPY shared ./shared
COPY apps/Canteen ./apps/Canteen
ARG VITE_MIDDEN_URL
ENV VITE_MIDDEN_URL=$VITE_MIDDEN_URL
RUN npm run build -w apps/Canteen

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/apps/Canteen/dist /usr/share/nginx/html
COPY apps/Canteen/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]