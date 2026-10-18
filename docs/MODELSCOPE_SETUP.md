# 在网页中配置 ModelScope

打开公开网页的「Agent 实验室」，展开「配置大模型」。无需部署服务器或修改源码。

1. 选择 Qwen 或 DeepSeek。Qwen 保留 GlobalHAB 的三个预设：`Qwen/Qwen3.5-35B-A3B`、`Qwen/Qwen3.5-122B-A10B`、`Qwen/Qwen3.5-397B-A17B`；DeepSeek 预设为 `deepseek-ai/DeepSeek-V3.2`。
2. 在密码输入框填写自己的 ModelScope Token。入口：[ModelScope 访问令牌](https://www.modelscope.cn/my/myaccesstoken)。这是魔搭 Token，不是 DeepSeek 官网或阿里云百炼的密钥。
3. 点击「检查连接并启用」。它会请求所选模型生成 OK，使用少量模型额度。检查通过才启用真实规划；改变模型或 Token 后需要重新检查。
4. 选择研究路线、目标日和实验预算，点击「运行自主探索」。大模型决定工具和科学模型，程序完成拟合、评分、预算计数与测试集门控。

可以通过「读取平台型号」获取平台返回的 Qwen / DeepSeek 列表，或选择「其他 ModelScope 型号」填写完整 ID。列表和预设不代表账号已有该模型的调用权限或额度。

所有网页直连请求固定发送至 `https://api-inference.modelscope.cn/v1`。Token 只在当前页面及本轮 Worker 内存中使用；刷新或关闭页面后重填，可随时点击「清除 Token」。程序不会把 Token 写入 localStorage、sessionStorage、URL、源码、日志或实验 JSON。网页会向 ModelScope 发送研究问题、合成训练摘要和内层验证反馈。

## 失败时看哪里

| 提示 | 处理 |
| --- | --- |
| HTTP 401 | 检查 Token 是否填错、过期或已撤销 |
| HTTP 403 | 确认账号有该模型的 API 权限 |
| HTTP 404 | 核对完整模型 ID，或读取平台型号 |
| HTTP 429 | 检查平台额度和请求频率，稍后再试 |
| 网络失败 / 45 秒超时 | 检查网络；浏览器跨域限制时使用下述本地模式 |
| 无最终可见回答 | 更换非 Thinking 型号或重试；不会把 reasoning_content 当成结果 |
| 规划不合法 / 预算耗尽 | 查看工具轨迹。该轮保留失败状态，不改成规则结果 |

「停止本轮」终止浏览器中的计算和后续请求；已经发送的请求可能仍计入平台用量。实验预算 B 计候选拟合与负对照，规划调用上限 B+5；连接检查和可选结果解读单独消耗调用额度。

## 保留的本地服务端方式

使用 `config/secrets.example.toml` 和 `scripts/start-with-secrets.py`，或设置 `CORAL_LLM_*` / `HAB_QWEN_*` 环境变量后运行本地服务。访问 `127.0.0.1` 或 `localhost` 时，模型下拉框追加「本地配置」项。此模式的 Token 由本地进程保管。GitHub Pages 不运行该服务端。

## 验证范围

2026-10-18：ModelScope OPTIONS 返回 204，允许 GitHub Pages Origin 的 POST 与 Authorization；浏览器用明确无效的测试 Token 发起 DeepSeek 请求，能读取 HTTP 401 错误；模拟接口完成了规划、两种模型比较、负对照和冻结测试。发布时没有用户的有效 Token，因此没有声称真实模型已完成科学实验。需要在网页输入有效 Token 后检查账号权限与实际生成。

调用格式参考 [ModelScope API-Inference](https://www.modelscope.cn/docs/model-service/API-Inference/intro) 及 [GlobalHAB 平台模型目录](https://github.com/Haoliu9427/GlobalHAB-Agent-demo/blob/main/src/globalhab_demo/platform_models.py)。

## Allen Coral Atlas 定位

在首页地图下方展开「配置 Atlas 定位」。可以跟随当前演示礁区，也可手动输入纬度、经度和缩放级别，粘贴官方定位链接，或使用本站地图中心。点击「保存定位」可在当前浏览器保留最多 10 个常用礁区；「恢复默认」清除已保存定位。

该设置只更新官方 Atlas 外链，不移动或改写合成调查与白化标签。独立的 WMS 地貌图层仍取决于官方服务可用性；加载失败会明确显示，不把示意锚点当成真实礁区分布。
