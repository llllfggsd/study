# Study Quiz · 学习题库练习系统

一个面向个人/小团队的在线题库练习系统：登录后创建学习分类，导入 XLSX 题库，进行顺序练习、随机练习、考试，自动生成错题集，并可分享题库、查看排名。

## 功能特性

- **用户系统**：注册、登录（JWT 鉴权），数据按用户隔离
- **学习分类**：创建/删除分类，生成分享码，他人凭分享码加入，成员管理
- **题目导入**：上传 XLSX，**表头驱动**解析，自动区分单选 / 多选题
- **练习**：顺序练习、随机练习，支持进度续做，答题用时异常防作弊
- **考试**：题量自选；单选与多选并存时按 **单选 3 : 多选 2** 抽题；统一交卷判分，逐题回看
- **错题集**：答错自动收录，支持错题专项练习与一键清空
- **排名**：基于**考试成绩**统计最高 / 最低 / 平均分与次数

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 + Vite 8、React Router 7、Axios |
| 后端 | Go + Gin、GORM、JWT、bcrypt、excelize（XLSX） |
| 数据库 | SQLite（`glebarez/sqlite`，纯 Go，无需 CGO） |
| 部署 | Docker + docker-compose |

## 目录结构

```text
study/
├── backend/                # Go 后端
│   ├── main.go             # 路由与启动（监听 :40008）
│   ├── handlers/           # 业务处理（auth/category/question/practice/exam/wrong/ranking）
│   ├── models/             # 数据模型
│   ├── middleware/         # JWT 鉴权中间件
│   ├── database/           # 数据库初始化、迁移、种子账号
│   ├── data/               # SQLite 数据文件（已 gitignore）
│   └── Dockerfile
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/          # 页面（登录/分类/导入/练习/考试/错题/排名…）
│   │   ├── api/            # axios 封装（baseURL=/api）
│   │   ├── utils/          # 选项/题型工具
│   │   └── components/     # 公共组件
│   ├── vite.config.js      # 端口与 /api 代理
│   └── Dockerfile
├── docker-compose.yml
├── 题库可导入模板.xlsx       # 导入模板
└── README.md
```

## 快速开始（本地开发）

前置：Go（与 `go.mod` 版本匹配）、Node.js。

```bash
# 后端（监听 :40008）
cd backend
go run .

# 前端（监听 0.0.0.0:40007，/api 代理到 0.0.0.0:40008）
cd frontend
npm install
npm run dev
```

浏览器访问 http://0.0.0.0:40007 （或用本机 IP，如 http://<宿主IP>:40007）。

## Docker 部署

```bash
docker compose up -d --build
```

- 前端入口：`http://<宿主IP>:40007`
- 后端直连：`http://<宿主IP>:40008`
- SQLite 数据持久化在命名卷 `backend-data`

镜像通过构建参数配置（默认使用华为云 SWR 镜像，可用 `.env` 覆盖）：

```bash
GO_IMAGE=...golang:alpine-linuxarm64 \
NODE_IMAGE=...node:24.14.0-alpine3.22-linuxarm64 \
docker compose up -d --build
```

容器内前端用 `vite preview` 托管静态产物，并经环境变量 `VITE_API_TARGET=http://backend:40008` 把 `/api` 代理到后端（自动去除 `/api` 前缀）。

## 默认账号

系统首次启动会自动创建管理员账号：

```text
用户名：jialin
密码：  jialin123
```

## 题库导入格式（XLSX）

第一行必须是标题行，**按表头识别列**（列顺序、选项数量均可灵活变化）：

| 列 | 说明 |
| --- | --- |
| `问题` / `题目` | 题干（必填） |
| 单个大写字母列 `A` `B` `C` `D` `E`… | 选项（必填至少 2 个，可超过 4 个） |
| `答案` | 正确答案（必填） |
| `解析` | 答案解析（可空） |

**单选 / 多选自动区分**：

- 答案为单个字母（如 `C`）→ 单选题
- 答案为多个字母（如 `ABD`，可用逗号 / 顿号分隔）→ 多选题
- 系统对答案自动转大写、去重、排序；答案字母必须落在选项范围内，否则该行跳过

示例见根目录 `题库可导入模板.xlsx`。

## API 概览

> 前端经 `/api` 前缀调用，代理转发时去除前缀；以下为后端实际路径。除注册/登录外均需 `Authorization: Bearer <token>`。

| 方法 & 路径 | 说明 |
| --- | --- |
| `POST /register` `POST /login` | 注册 / 登录 |
| `GET /me` | 当前用户 |
| `GET/POST /categories` | 分类列表 / 新建 |
| `POST /categories/join` | 按分享码加入 |
| `GET/DELETE /categories/:id` | 分类详情 / 删除 |
| `POST /categories/:id/leave` | 退出分类 |
| `GET /categories/:id/members` `DELETE /categories/:id/members/:uid` | 成员管理 |
| `GET /categories/:id/ranking` | 排名（考试成绩） |
| `POST /categories/:id/import` | 导入题目（XLSX） |
| `GET /categories/:id/questions` `DELETE /questions/:id` | 题目列表 / 删除 |
| `GET/POST/PUT/DELETE /categories/:id/practice/*` | 练习进度 / 开始 / 完成 |
| `POST /questions/:id/answer` | 提交答案 |
| `POST /categories/:id/exam/start` `POST /categories/:id/exam/submit` | 开始考试 / 交卷判分 |
| `GET /categories/:id/wrong-questions` | 错题列表 |
| `POST /questions/:id/remove-wrong` `DELETE /categories/:id/wrong-records` | 移除错题 / 清空错题 |

## 端口说明

| 服务 | 端口 |
| --- | --- |
| 前端 | `40007` |
| 后端 | `40008` |

修改端口需同步：`backend/main.go`、各 `Dockerfile`、`frontend/vite.config.js`、`docker-compose.yml`。
