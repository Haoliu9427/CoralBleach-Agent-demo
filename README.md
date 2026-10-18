# CoralBleach-Agent

面向复杂环境扰动的全球珊瑚白化预测预警与科学发现智能体。基于 [GlobalHAB-Agent-demo](https://github.com/Haoliu9427/GlobalHAB-Agent-demo) 的预算探索与模型调用思路，提供可以实际运行的合成实验和交互网站。

**热应激 ≠ 白化观测 ≠ 珊瑚死亡。** 地图采用真实地理底图，站点、序列、调查及随访值全部为合成演示。没有接入真实 NOAA 数据，也没有证明全球预测能力。

## 快速运行

安装 Node.js 20 或更新版本，在项目目录运行：

```sh
npm start
```

打开 http://127.0.0.1:4173 。Windows 可双击 `启动演示.cmd`。没有运行时第三方依赖，无需 npm install。不要直接双击 HTML，模块、地图和后台计算需要 HTTP 服务。

## 可以演示什么

- 全球风险态势：Natural Earth 真实陆地轮廓；12 个合成锚点；三层证据图层；7/14/30 天矩阵、暴露—调查散点、DHW 历史、情景滑块和监测清单。
- Agent 实验室：实际生成 8,880 条合成记录，训练 Logistic 科学模型，运行预算探索，绘制逐步验证效用与独立测试比较。
- 真实大模型模式：场景摘要 → 科学模型池 → 工具调用 → 验证反馈 → 反例核查 → 冻结 → 封存测试。密钥仅保存在服务端；无密钥默认使用明确标注的规则模式。
- 科学问题与证据：完整 Word/Markdown 定义文档、可检验假设、边界、数据来源与迁移方案。

## 接入原 GlobalHAB 的大模型

推荐沿用原项目的 TOML 配置，并将密钥文件放在仓库外。支持 `[[platform_models]]`、`[qwen]`、`[modelscope]`：

```sh
python scripts/start-with-secrets.py /absolute/path/to/secrets.toml
```

需要 Python 3.11+。示例见 `config/secrets.example.toml`。也可设置 `CORAL_LLM_BASE_URL`、`CORAL_LLM_API_KEY`、`CORAL_LLM_MODEL`（兼容 `HAB_QWEN_*`）再运行 npm start。网页选择真实大模型模式、点击检查连接后运行。只向所配置供应商发送合成训练摘要、研究问题和验证反馈。不要将密钥输入网页、上传 GitHub 或放进 dist。

目前完成模拟服务与工具协议测试；实际供应商连接须使用你自己的可用配置验证。失败会停止，不会伪装成真实 LLM 运行。

## 复现与检验

```sh
npm test
npm run build
npm run benchmark
node scripts/multi-seed.mjs
node scripts/export-data.mjs
```

默认种子 42 / 提前期 14 天 / 每策略 8 步：启发式测试 AP 0.621，局地基线 0.596。20 个种子下启发式平均 AP 0.542、随机 0.585；尚未建立搜索效率优势。数值只描述当前合成环境，不能作为真实预测成绩或 LLM 成绩。

## 工程结构

| 目录 | 内容 |
| --- | --- |
| dist | 可独立静态部署的网站、真实地图轮廓、合成器、科学模型、受约束规划工具和文档 |
| server | GlobalHAB 兼容的服务端模型目录与 Chat Completions 适配 |
| scripts | 本地服务、配置转换、复现和静态检查 |
| tests | 时间隔离、预算、指标、模型协议与工具门控测试 |
| data | 合成 CSV 与真实数据接入的空模板 |
| results | 默认配置、20 种子结果、版本与哈希 |
| docs | 数据字典、模型卡、迁移和部署说明 |
| reference | 原 GlobalHAB 启发式代码快照（MIT） |

静态部署与可选 GitHub Pages 步骤见 [部署说明](docs/DEPLOYMENT.md)。扩展模型、预算口径与实现范围见 [架构与迁移](docs/ARCHITECTURE.md)。科学定义见 [完整文档](dist/scientific-definition.md)。

## 许可与来源

代码 MIT；保留 GlobalHAB 原许可证声明。Natural Earth 地图数据为 public domain。来源与已查阅版本见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
