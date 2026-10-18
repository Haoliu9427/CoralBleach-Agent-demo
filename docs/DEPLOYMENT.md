# 部署

## 本地完整模式

Node.js20+，运行 npm start；打开 http://127.0.0.1:4173。可通过 PORT 改端口。此服务器仅监听本机。Python3.11+仅在读取TOML配置时使用。实际大模型需要服务端密钥，配置示例不含有效凭据。

## 静态网站

将 dist/ 全部文件上传到支持静态文件的托管服务。HTML、模块和 land.geojson 必须同目录。无密钥实验在浏览器 Worker 中运行。静态站点无法运行 server/；因此只支持规则演示，大模型模式会说明未配置，不能把服务器密钥放进前端。

本包提供 GitHub Pages 工作流：仓库创建并推送后，在 Settings → Pages → Source 选择 GitHub Actions，再从 Actions 手动运行 Deploy static demo。GitHub Pages 只发布dist目录。无需任何LLM密钥。CI会检查代码和静态下载链接。

本次 Sites 托管为公开演示（用户已授权任何持有链接者访问）；.openai/hosting.json记录其站点身份，不应把这个ID用于其他人的新站。其他用户可直接部署dist或为自己的Sites项目生成新身份。

## 发布前

npm test && npm run build。密钥文件放仓库外，.gitignore只是辅助措施。完整运行结果可通过网页下载JSON；不自动上传真实调查资料。若部署可调用模型的公网服务，需要另加身份验证、用量上限、日志脱敏及服务端科研评估隔离。
