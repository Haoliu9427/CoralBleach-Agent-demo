# 部署

## 本地完整模式

Node.js20+，运行 npm start；打开 http://127.0.0.1:4173。可通过 PORT 改端口。此服务器仅监听本机。Python3.11+仅在读取TOML配置时使用。网页可直接填写 ModelScope Token；已有服务端配置仍可使用，示例不含有效凭据。

## 静态网站

将 dist/ 全部文件上传到支持静态文件的托管服务。HTML、模块和 land.geojson 必须同目录。无密钥实验在浏览器 Worker 中运行。静态站点不运行 server/。真实大模型通过访客在页面输入的 ModelScope Token 直接调用官方 API，Token 只存在当前页面内存；不要把维护者密钥硬编码进前端。详见 [配置说明](MODELSCOPE_SETUP.md)。

## GitHub Pages 公开演示

演示地址：https://haoliu9427.github.io/CoralBleach-Agent-demo/ 。

仓库 Settings → Pages → Source 使用 GitHub Actions。每次向 main 推送更新，Deploy static demo 工作流会运行测试和静态检查，然后只发布 dist 目录；也可在 Actions 手动运行。无需任何 LLM 密钥。页面使用相对资源路径，适用于仓库子路径。完整 Word 和 Markdown 文档随站点发布。

复用或 Fork 项目时，先在自己的仓库启用 GitHub Actions 作为 Pages 来源，再推送到 main 或手动运行工作流。网址中的用户名和仓库名以自己的仓库为准。

## 发布前

npm test && npm run build。密钥文件放仓库外，.gitignore只是辅助措施。完整运行结果可通过网页下载JSON；不自动上传真实调查资料。若部署可调用模型的公网服务，需要另加身份验证、用量上限、日志脱敏及服务端科研评估隔离。
