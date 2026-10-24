# CoralBleach-Agent

面向复杂环境扰动的全球珊瑚白化预测预警与科学发现智能体。基于预算探索与模型调用思路，提供可以实际运行的合成实验和交互网站。

**热应激 ≠ 白化观测 ≠ 珊瑚死亡。** 地图采用真实地理底图，站点、序列、调查及随访值全部为合成演示。没有接入真实 NOAA 数据，也没有证明全球预测能力。

在线演示：[CoralBleach-Agent](https://haoliu9427.github.io/CoralBleach-Agent-demo/)（免费公开访问，合成数据）。

## 中英双语 · v1.5

左下角「中文」「EN」切换整站语言，保留当前实验进度、结果与连接设置。支持英文模型搜索，后续大模型解释随当前语言发送请求。[直接打开英文版](https://haoliu9427.github.io/CoralBleach-Agent-demo/?lang=en#overview)。原始审计 JSON 保持原样，科学问题定义下载文件仍为中文。详见 [Language support](docs/LANGUAGES.md)。

## AI 实验台

打开「Agent 实验室」即可进入虚拟湿实验：选择三种珊瑚形态、点击或拖入试剂、编辑处理组、观察合成培养过程。右侧有六步实验讲解和基于当前实验上下文的 ModelScope Agent 导师。珊瑚使用带表面纹理的生成插画，水槽、试剂和算法图采用可编辑 SVG；96 个模型方案各有独立示意图。培养播放默认约 45 秒，支持暂停、0.25–4 倍速、逐日回看和终点查看。

模型池由 **24 类算法 × 4 组变量**构成，实际执行回归拟合；96 个方案按 8 个方法类别组织，可搜索名称并切换输入变量。LLM 在 4–24 次拟合预算内逐步选择方案，并完成对照和冻结；无密钥时可手动选择固定顺序基线。默认示例包含 72 个独立水槽，槽内片段只是子样本。

使用方式、算法参数、合成器与验证边界见 [虚拟湿实验说明](docs/VIRTUAL_WETLAB.md)。图形、动画和计算结果均为软件演示，未用真实湿实验数据校准，也不证明全球预测能力。

## 时空与化学研究

新增氮形态与共污染路线：5 组变量方案 × 4 种滞后，按字段可用性缩减为 20 / 16 / 8 个候选。模型池和真实 LLM 工具共同执行字段门控；文献只支持候选依据，所有浓度及白化标签仍合成。首页加入氮形态情景对照，实验室可切换“无化学增量”和“区域效应改变”反例。

地图支持缩放、本站定位和 Allen Coral Atlas 官方入口。WMS 适配已提供，但 2026-10-18 验证 GetMap 返回 403；图层默认关闭且失败明确显示。未宣称已接入完整全球真实礁区分布。更新范围、两条路线的预算与数据边界见 [研究更新](docs/RESEARCH_UPDATE.md)。

## 快速运行

安装 Node.js 20 或更新版本，在项目目录运行：

```sh
npm start
```

打开 http://127.0.0.1:4173 。Windows可双击 `启动演示.cmd`。无需 npm install；Leaflet 1.9.4 已随源码附带并保留许可证。不要直接双击 HTML，模块、地图和后台计算需要HTTP服务。

## 可以演示什么

- 全球风险态势：12个合成锚点；三层证据图层；7/14/30 天矩阵、暴露—调查散点、DHW历史、情景滑块和监测清单。
- Agent 实验室：默认进入可操作的虚拟湿实验；「时空与化学研究」保留原有合成序列、Logistic 科学模型、预算探索和独立测试比较。
- 真实大模型模式：场景摘要 → 科学模型池 → 工具调用 → 验证反馈 → 反例核查 → 冻结 → 封存测试。网页可直接填写 ModelScope Token，选择 DeepSeek 或 Qwen；也保留本地服务端配置。虚拟实验默认选择 ModelScope Agent；无密钥可切换为明确标注的固定顺序基线。
- 科学问题与证据：完整Word/Markdown定义文档、可检验假设、边界、数据来源与迁移方案。

在「Agent 实验室 → 配置大模型」选择 DeepSeek 或 Qwen，填写自己的 **ModelScope Token**，点击「检查连接并启用」，通过后即可运行。公开 GitHub Pages 支持浏览器直连魔搭，不必搭建服务端。Token 仅在当前页面内存中使用，刷新后重填，不进入浏览器存储和导出文件。型号可从平台读取或手动填写。

完整步骤、错误处理及本地服务端兼容方式见 [ModelScope 配置](docs/MODELSCOPE_SETUP.md)。Atlas 入口也支持坐标、缩放、官方链接导入和常用礁区保存。

已验证跨域访问和无效 Token 的真实 HTTP 401 提示，并用模拟接口通过完整工具循环；有效 Token 下的生成仍需在页面检查。未把规则模式或模拟服务当成真实大模型成果。

## 复现与检验

```sh
npm test
npm run build
npm run benchmark
node scripts/multi-seed.mjs
node scripts/export-data.mjs
npm run benchmark:compound
```

旧版时滞与空间信号路线，种子 42 / 提前期 14 天 / 每策略 8 步：启发式测试 AP 0.621，局地基线 0.596。20 个种子下启发式平均 AP 0.542、随机 0.585；尚未建立搜索效率优势。数值只描述当前合成环境，不能作为真实预测成绩或 LLM 成绩。

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

GitHub Pages 自动发布与本地部署步骤见 [部署说明](docs/DEPLOYMENT.md)。扩展模型、预算口径与实现范围见 [架构与迁移](docs/ARCHITECTURE.md)。科学定义见 [完整文档](dist/scientific-definition.md)。

## 许可与来源

代码 MIT；保留 GlobalHAB 原许可证声明。Natural Earth 地图数据为 public domain。来源与已查阅版本见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
