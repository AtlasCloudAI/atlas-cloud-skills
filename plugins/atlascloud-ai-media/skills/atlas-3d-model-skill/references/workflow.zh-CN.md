# Atlas 3D 模型生成工作流

本文件用于中文请求。模型 ID、参数名、枚举值和命令保持原文。

## 1. 先选路线

| 用户输入 | 默认路线 | 默认模型 | 默认格式 |
|---|---|---|---|
| 只有文字描述 | 文生 3D | `tencent/hunyuan3d-rapid/text-to-3d` | `GLB` |
| 本地图片或图片 URL | 图生 3D | `bytedance/seed3d-v2.0/image-to-3d` | `glb` |

模型目录会变化。每次付费提交前必须实时查询 Atlas 模型目录，确认目标模型
`display_console: true`，再读取 schema 校验参数和实时价格。

有图片就优先走图生 3D；只有文字就直接走文生 3D。不要为了强行使用
Seed3D 而静默增加一次图片生成，因为这会增加费用，并可能改变用户描述的形体。

## 2. 整理输入

文生 3D 的提示词只描述一个完整主体，依次写清：

1. 主体和整体轮廓；
2. 主要材质、颜色；
3. 关键结构部件；
4. 完整主体、居中、无遮挡；
5. 只有会影响拓扑时才写用途，例如游戏资产或 3D 打印。

图生 3D 优先使用单主体、完整露出、背景干净、光照均匀的三分之四视角图片。
避免拼图、多主体、裁切、遮挡、文字水印和过重阴影。

## 3. 先 dry-run

`--dry-run` 只读取公开模型目录和 schema，不上传文件、不创建任务、不扣费：

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --prompt "一台单独的圆角桌面机器人，象牙白外壳，橙色关节，主体完整" \
  --output-dir ./outputs/desk-robot \
  --dry-run
```

核对输出里的模型、实时价格、格式和请求参数。需要付费执行时，进程从环境变量
`ATLASCLOUD_API_KEY` 或 `ATLAS_CLOUD_API_KEY` 读取凭据；不得在回复、日志或文件里
输出 API Key。

## 4. 执行一次付费请求

文生 3D：

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --prompt "一台单独的圆角桌面机器人，象牙白外壳，橙色关节，主体完整" \
  --format GLB \
  --pbr \
  --output-dir ./outputs/desk-robot
```

图生 3D：

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --image ./robot.png \
  --format glb \
  --subdivision medium \
  --output-dir ./outputs/desk-robot-image
```

生成 `POST` 只能发送一次，不能自动重试。提交成功后立即记录 prediction ID；
轮询、下载或本地验证失败时，使用同一个 ID 恢复，不要重新创建收费任务。

## 5. 恢复任务

```bash
node /absolute/path/to/atlas-3d-model-skill/scripts/generate.mjs \
  --resume PREDICTION_ID \
  --format GLB \
  --output-dir ./outputs/desk-robot
```

`job.json` 会保存恢复所需的非敏感信息。只要原任务不是终态失败，就不应创建替代任务。

## 6. 验收

完成标准不是“任务已提交”，而是：

- Atlas 状态达到 `completed` 或 `succeeded`；
- 模型文件已下载到本地；
- Seed3D ZIP 已安全解包；
- GLB 或其他目标格式通过结构校验；
- `generation.json` 已记录模型、prediction ID、价格、文件大小和验证结果；
- 若有缩略图，缩略图只能用于预览，不能替代 3D 文件验收。

最终向用户汇报实际模型 ID、格式、prediction ID、实时单次价格、本地模型路径、
文件大小、验证结果和剩余风险。
