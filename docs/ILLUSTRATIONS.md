# 插画资产与提示词

2026-10-18，v1.4。

三张珊瑚主体使用 OpenAI 内置图像生成工具制作，透明背景，随后仅转换为 WebP 格式供网页加载。它们是虚拟形态的视觉素材，不是实拍、鉴定图或生物学观测。水槽、试剂、温度探头、照明和 96 张模型示意图使用 SVG 代码绘制。模型图不包含实际训练结果。

资产：`dist/assets/coral-branch.webp`、`coral-massive.webp`、`coral-plate.webp`。保留透明通道与 1254 × 1254 分辨率。网页根据合成白化程度使用显示滤镜降低饱和度、提高亮度；该显示变化未用真实白化照片校准。

算法图源：`dist/wetlab-illustrations.js`。运行 `node scripts/wetlab-art.mjs` 可生成全部 96 张独立 SVG。四组输入使用不同注记与配色；24 类算法各有不同的结构图。水槽与试剂的 SVG 同样在此文件内。

## 生成提示词

每个形态单独调用一次内置工具，`transparent_background: true`。公共提示词如下，将 `[subject]` 替换为下表的对应文字：

> Use case: scientific-educational. Create one high-resolution transparent-background specimen cutout for a sophisticated coral research virtual laboratory. Subject: [subject]. Front three-quarter specimen view at slightly elevated angle, complete colony centered, occupies 85% of square canvas, small natural limestone attachment base. Style: museum-quality natural history scientific illustration, fine gouache washes and stippled ink detail, convincingly organic anatomy and highly detailed surface texture, hand-painted editorial finish, nuanced warm-neutral shading. Soft diffuse daylight upper left, no shiny plastic, no cartoon, no 3D toy render, no oversaturated colors, no fantasy shapes, no diagram symbols. Transparent background with clean natural silhouette, NO aquarium, NO water, NO surrounding landscape, NO cast background shadow, NO text, NO labels, NO border. This is a generic illustrative morphology, not a taxonomic plate or an observed specimen.

| 资产 | Subject |
| --- | --- |
| branch | a dense branching staghorn coral colony, gently curved irregular arborescent branches with small axial tips, realistic fine corallite cups, restrained dusty salmon and sienna tissue, lighter ivory growing tips |
| massive | a hemispherical massive brain coral colony, complex continuous meandering ridges and valleys, dense minute polyp details, muted warm ochre, olive and sand tissue |
| plate | a foliaceous plating coral colony, five broad overlapping irregular horizontal laminar plates with delicate scalloped cream rims, radial growth striae and tiny corallites, muted dusty mauve and lavender brown tissue |
