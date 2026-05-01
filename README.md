# wxapp-qrcode

微信小程序二维码生成工具，基于 Canvas 绘制，支持中文内容（UTF-8 转码）。  
可直接用于原生小程序，也可按同样方式接入 Mpvue、Taro 等项目。

## 功能特性

- 在小程序 Canvas 中生成二维码
- 支持中文与常见文本内容
- 支持绘制完成回调，便于后续导出图片
- 支持自定义二维码前景色、背景色与线性渐变
- 支持叠加自定义 Logo（本地路径或网络 URL）
- 支持在页面或自定义组件内调用

## 安装

```bash
git clone https://github.com/yuanyang749/wxapp-qrcode.git
```

将 `utils/qrcode.js` 复制到你的项目目录并引入。

## 快速开始

### 1. 准备 Canvas 节点

```xml
<canvas style="width: 686rpx; height: 686rpx; background: #f1f1f1;" canvas-id="mycanvas" />
```

说明：Canvas 节点可以隐藏，但必须存在于页面中。

### 2. 引入模块

```javascript
const QR = require("路径/qrcode.js");
```

### 3. 生成二维码

```javascript
Page({
  data: {
    imagePath: ""
  },

  createQrCode(content, canvasId, cavW, cavH) {
    QR.api.draw(content, canvasId, cavW, cavH, this, (meta) => {
      this.canvasToTempImage(canvasId, meta && meta.drawArea);
    });
  },

  canvasToTempImage(canvasId, area) {
    const options = {
      canvasId,
      success: (res) => {
        this.setData({ imagePath: res.tempFilePath });
      }
    };
    if (area) {
      options.x = area.x;
      options.y = area.y;
      options.width = area.width;
      options.height = area.height;
    }
    wx.canvasToTempFilePath(options, this);
  }
});
```

调用示例：

```javascript
this.createQrCode("wxapp-qrcode", "mycanvas", 300, 300);
```

## API

模块导出：`QR.api`

### `QR.api.draw(str, canvasId, cavW, cavH, thisArg, cb, ecc, options)`

用于绘制二维码到指定 Canvas。

参数说明：

- `str`: 要编码的文本内容
- `canvasId`: Canvas 的 `canvas-id`
- `cavW`: 绘制区域宽度（建议与高度保持一致）
- `cavH`: 绘制区域高度
- `thisArg`: 页面或组件的 `this`，用于 `wx.createCanvasContext`
- `cb`: 绘制完成回调函数，默认空函数。回调参数包含绘制元信息：
  - `drawArea`: 实际绘制区域（适合导出时裁剪掉画布多余空白）
  - `codeArea`: 二维码码区（不含四周静区）
  - `logoArea`: Logo 实际绘制区域（启用 Logo 时返回）
  - `moduleSize`: 单模块像素尺寸
  - `qrVersion`: 自动选择的二维码版本
  - `warnings`: 降级提示（例如 Logo 加载失败）
- `ecc`: 纠错等级（可选），默认使用当前等级
- `options`: 绘制扩展选项（可选）
  - `foregroundColor`: 前景色（默认 `#000000`）
  - `backgroundColor`: 背景色（默认 `#ffffff`）
  - `gradient`: 线性渐变配置
    - `enabled`: 是否启用渐变
    - `startColor`: 渐变起始色（Hex）
    - `endColor`: 渐变结束色（Hex）
    - `angle`: 渐变角度（度）
  - `logo`: Logo 配置
    - `enabled`: 是否启用 Logo
    - `src`: Logo 路径（本地临时路径或网络 URL）
    - `sizeRatio`: Logo 占二维码码区比例（默认 `0.2`，范围 `0.12~0.28`）
    - `padding`: Logo 内边距（默认 `4`）
    - `borderRadius`: Logo 底板圆角（默认 `8`）
    - `backgroundColor`: Logo 底板背景色（默认 `#ffffff`）

说明：当启用 `logo.enabled=true` 且未显式传 `ecc` 时，会自动使用 `H(4)` 纠错等级以提高识别稳定性。

纠错等级映射：

- `1`: L
- `2`: M（默认）
- `3`: Q
- `4`: H

### 扩展能力示例

```javascript
QR.api.draw(
  content,
  "mycanvas",
  300,
  300,
  this,
  (meta) => {
    // meta.drawArea / meta.codeArea / meta.logoArea / meta.warnings
  },
  undefined,
  {
    foregroundColor: "#0f172a",
    backgroundColor: "#f8fafc",
    gradient: {
      enabled: true,
      startColor: "#2563eb",
      endColor: "#7c3aed",
      angle: 45
    },
    logo: {
      enabled: true,
      src: "https://example.com/logo.png", // 也可以是 wx.chooseImage 返回的本地路径
      sizeRatio: 0.2,
      padding: 4,
      borderRadius: 8,
      backgroundColor: "#ffffff"
    }
  }
);
```

### `QR.api.getFrame(str)`

返回二维码矩阵数据（内部使用，也可用于自定义渲染场景）。

### `QR.api.utf16to8(str)`

将 UTF-16 文本转换为 UTF-8 字节序列，确保中文内容可正确编码。

## 在自定义组件中使用

调用 `draw` 时务必传入组件实例 `this`：

```javascript
QR.api.draw(content, "mycanvas", 300, 300, this, this.onDrawDone);
```

## 常见问题

### 生成失败或无内容

- 检查页面是否存在对应 `canvas-id` 的 Canvas 节点
- 检查 `draw` 时是否传入正确的 `thisArg`
- 检查回调中 `wx.canvasToTempFilePath` 的 `canvasId` 是否一致

### 导出后四周有多余空白

- 建议在 `draw` 回调中读取 `meta.drawArea`，并在 `wx.canvasToTempFilePath` 里传入 `x/y/width/height` 进行裁剪导出

### 网络 Logo 不显示

- 请确认 URL 为 HTTPS
- 请确认该域名已配置到小程序合法域名
- 若加载失败会自动降级为无 Logo，可从 `meta.warnings` 获取提示

### 本地静态 Logo 加载失败

- 小程序原生 Canvas 在不同环境下对代码包内路径（如 `/assets/logo.png`）的解析可能存在差异，有时会导致路径被错误地二次拼接。
- **推荐做法**：在 `onLoad` 时，使用 `wx.getFileSystemManager().copyFile` 将静态资源复制到 `wx.env.USER_DATA_PATH` 目录下，使用返回的临时路径进行绘制。这种方式兼容性最强。
- 也可以尝试在绘制前调用 `wx.getImageInfo` 获取图片的系统临时路径（`res.path`）。
- 完整实现参考 `pages/main/index.js` 中的 `onLoad` 逻辑。

### 如何适配不同屏幕

可参考示例页 `pages/main/index.js` 的 `setCanvasSize` 方法，按窗口宽度动态计算正方形画布尺寸。

## 示例

完整示例位于 `pages/main/index.js` 与 `pages/main/index.wxml`。

## 维护与贡献

欢迎提交 Issue / PR。  
建议在反馈问题时提供最小复现步骤、输入内容和设备信息，便于快速定位。

## License

MIT，详见 `LICENSE`。
