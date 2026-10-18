# 来源与许可

1. GlobalHAB-Agent-demo，MIT，Copyright (c) 2026 GlobalHAB-Agent contributors。来源 https://github.com/Haoliu9427/GlobalHAB-Agent-demo ，代码查询版本319e1c05e8c8a0d7bd636af34c7f0b1202bdd827。参考的规划、目录和调用机制见docs/ARCHITECTURE.md；reference/globalhab-agent.py保留原始启发式快照。
2. Natural Earth 1:110m land，public domain，https://www.naturalearthdata.com/about/terms-of-use/ 。数据从 https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson 获取，查阅2026-10-18，Git blob SHA 04811d72fff2701ec67587e30ad8942675b511e3。仅作地理底图，不表示珊瑚礁分布。未添加行政边界。
3. 科学引用列于dist/scientific-definition.md。未捆绑NOAA、GCBD或HeatCRD原始观测。用户附件仅用于问题定义讨论，未纳入公开工程。
4. 本工程界面图标为自绘SVG；无远程字体或第三方图表运行库。合成数据可按项目MIT条款使用，必须继续标明合成来源。

5. Leaflet 1.9.4（BSD-2-Clause），来源 https://leafletjs.com/ ，vendored 文件位于 dist/vendor，完整许可证见 dist/vendor/LEAFLET-LICENSE.txt。
6. Allen Coral Atlas 官方地貌 WMS 与定位入口，https://allencoralatlas.org/resources/ 。地图、测深及统计为 © 2018–2023 Allen Coral Atlas Partnership and Arizona State University，CC BY 4.0；卫星影像另有许可，本工程未捆绑影像或全球数据。公开服务访问受提供方控制，GetMap 的 403 核验记录见 docs/RESEARCH_UPDATE.md。

7. v1.3 虚拟实验台的水槽、珊瑚、试剂瓶与模型方案图标均为本项目原创可编辑 SVG。源文件为 dist/wetlab-art.js；32 张独立图标位于 dist/illustrations，运行 node scripts/wetlab-art.mjs 可重新生成。遵循本项目 MIT 许可。参考页面仅用于理解交互形式，未复制其品牌、插画或代码。
