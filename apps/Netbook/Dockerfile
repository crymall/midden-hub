# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/Netbook/package.json ./apps/Netbook/
RUN npm ci
COPY shared ./shared
COPY apps/Netbook ./apps/Netbook
RUN npm run build -w apps/Netbook

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/apps/Netbook/dist /usr/share/nginx/html
COPY apps/Netbook/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
