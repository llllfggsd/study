ARG NODE_IMAGE=swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:24.14.0-alpine3.22-linuxarm64

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV npm_config_registry=https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ${NODE_IMAGE}
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/vite.config.js ./vite.config.js
ENV VITE_API_TARGET=http://backend:40008
EXPOSE 40007
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "40007"]
