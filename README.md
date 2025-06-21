# 微信小程序-二维码生成器

> 本项目用于在微信小程序中生成二维码，也可用于第三方框架Mpvue,Taro等。

## 生成预览

![jsh5css.cn](http://jsh5css.cn/blog/wp-content/uploads/2016/12/20161207143611_73427.png)

* 可支持输入中文文本

## 安装

``` bash
git clone https://github.com/demi520/wxapp-qrcode.git
```

## 使用

1.创建canvas节点,以及设置canvas-id。(可以控制该区域不显示，但是必须要存在)

```html
<canvas style="width: 686rpx;height: 686rpx;background:#f1f1f1;" canvas-id="mycanvas"/>
```

2.引入qrcode.js,将`utils/qrcode.js` 文件复制到自己工程里，并引入。

```javascript
// 注意： 这里xxx是你自己的路径
let QR = require("xxxx/qrcode.js")  // require方式
import QR from 'xxxx/qrcode.js'    // es6的方式
```

3.在js文件中，定义相关的方法，**要注意在data中创建imagePath（最终生成的图片路径）,可以将img的src属性绑定imagePath**

```javascript
createQrCode: function (content, canvasId, cavW, cavH) {
  //调用插件中的draw方法，绘制二维码图片
  //this.canvasToTempImage 为绘制完成的回调函数，可根据自己的业务添加
  QR.api.draw(content, canvasId, cavW, cavH, this, this.canvasToTempImage);
},

//获取临时缓存图片路径，存入data中
canvasToTempImage: function (canvasId) {
  let that = this;
  wx.canvasToTempFilePath({
    canvasId,   // 这里canvasId即之前创建的canvas-id
    success: function (res) {
      let tempFilePath = res.tempFilePath;
      console.log(tempFilePath);
      that.setData({       // 如果采用mpvue,即 this.imagePath = tempFilePath
        imagePath:tempFilePath,
      });
    },
    fail: function (res) {
      console.log(res);
    }
  });
}
```

4.绑定事件，调用createQrCode，生成二维码

```javascript
createQrCode ('wxapp-qrcode', 'mycanvas', 300, 300)
```

## FAQ

### 自定义组件中不能生成qrcode?

封装方法时: 添加上this, `QR.api.draw(url, canvasId, cavW, cavH, this);` 可参考qrcode.js 768行，*[wx.createCanvasContext](https://developers.weixin.qq.com/miniprogram/dev/api/canvas/wx.createCanvasContext.html)*

### 如何适配不同屏幕大小的canvas？

可参考 `pages/main/index.js` 中的 `setCanvasSize` 方法。

## Ps

测试有其他问题请回帖哦，感激！！
