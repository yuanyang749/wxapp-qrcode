# wxapp-qrcode

微信小程序二维码生成工具，基于 Canvas 绘制，支持中文内容（UTF-8 转码）。  
可直接用于原生小程序，也可按同样方式接入 Mpvue、Taro 等项目。

## 功能特性

- 在小程序 Canvas 中生成二维码
- 支持中文与常见文本内容
- 支持绘制完成回调，便于后续导出图片
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

### `QR.api.draw(str, canvasId, cavW, cavH, thisArg, cb, ecc)`

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
  - `moduleSize`: 单模块像素尺寸
  - `qrVersion`: 自动选择的二维码版本
- `ecc`: 纠错等级（可选），默认使用当前等级

纠错等级映射：

- `1`: L
- `2`: M（默认）
- `3`: Q
- `4`: H

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

### 如何适配不同屏幕

可参考示例页 `pages/main/index.js` 的 `setCanvasSize` 方法，按窗口宽度动态计算正方形画布尺寸。

## 示例

完整示例位于 `pages/main/index.js` 与 `pages/main/index.wxml`。

## 维护与贡献

欢迎提交 Issue / PR。  
建议在反馈问题时提供最小复现步骤、输入内容和设备信息，便于快速定位。

## License

MIT，详见 `LICENSE`。
