# Go 编译镜像
ARG GO_IMAGE=swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/golang:alpine-linuxarm64
# 运行镜像：复用已有的 node-alpine 作为最小 Linux 基础（静态二进制，无需 Go/CGO）
ARG RUNTIME_IMAGE=swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:24.14.0-alpine3.22-linuxarm64

FROM ${GO_IMAGE} AS builder
WORKDIR /src
ENV GOPROXY=https://goproxy.cn,direct \
    CGO_ENABLED=0
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -trimpath -ldflags "-s -w" -o /study-quiz .

FROM ${RUNTIME_IMAGE}
WORKDIR /app
ENV GIN_MODE=release
COPY --from=builder /study-quiz /app/study-quiz
EXPOSE 40008
VOLUME ["/app/data"]
ENTRYPOINT ["/app/study-quiz"]
