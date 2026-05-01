// pages/main/index.js
var QR = require("../../utils/qrcode.js");
var CANVAS_ID = "mycanvas";
var DEFAULT_PLACEHOLDER = "http://wxapp-union.com";
var FALLBACK_CANVAS_SIZE = 300;
var MAX_CONTENT_LENGTH = 255;

Page({
  data: {
    maskHidden: true,
    imagePath: "",
    placeholder: DEFAULT_PLACEHOLDER, // 默认二维码生成文本
    isRendering: false
  },
  onLoad: function () {
    this.renderQrCode(this.data.placeholder);
  },

  // 适配不同屏幕大小的 canvas
  setCanvasSize: function () {
    try {
      var res = wx.getSystemInfoSync();
      var scale = 750 / 686; // 不同屏幕下 canvas 的适配比例；设计稿是 750 宽
      var width = res.windowWidth / scale;
      return {
        w: width,
        h: width // canvas 画布为正方形
      };
    } catch (e) {
      console.error("获取设备信息失败", e);
      return {
        w: FALLBACK_CANVAS_SIZE,
        h: FALLBACK_CANVAS_SIZE
      };
    }
  },

  createQrCode: function (content, canvasId, cavW, cavH, onDone) {
    var that = this;
    QR.api.draw(content, canvasId, cavW, cavH, this, function (meta) {
      that.canvasToTempImage(canvasId, meta && meta.drawArea, onDone);
    });
  },

  // 获取临时缓存图片路径，存入 data 中
  canvasToTempImage: function (canvasId, area, callback) {
    var that = this;
    var options = {
      canvasId: canvasId,
      success: function (res) {
        that.setData({
          imagePath: res.tempFilePath
        });
        if (typeof callback === "function") {
          callback(null);
        }
      },
      fail: function (err) {
        console.error("二维码导出失败", err);
        if (typeof callback === "function") {
          callback(err);
        }
      }
    };

    if (area && area.width > 0 && area.height > 0) {
      options.x = Math.max(0, Math.floor(area.x));
      options.y = Math.max(0, Math.floor(area.y));
      options.width = Math.max(1, Math.floor(area.width));
      options.height = Math.max(1, Math.floor(area.height));
    }

    wx.canvasToTempFilePath(options, that);
  },

  renderQrCode: function (content) {
    var that = this;
    if (that.data.isRendering) {
      return;
    }

    var size = that.setCanvasSize();
    that.setData({
      maskHidden: false,
      isRendering: true
    });
    wx.showLoading({
      title: "生成中..."
    });

    that.createQrCode(content, CANVAS_ID, size.w, size.h, function (err) {
      wx.hideLoading();
      that.setData({
        maskHidden: true,
        isRendering: false
      });
      if (err) {
        wx.showToast({
          icon: "none",
          title: "生成失败，请重试",
          duration: 2000
        });
      }
    });
  },

  // 点击图片进行预览，长按保存分享图片
  previewImg: function () {
    var img = this.data.imagePath;
    if (!img) {
      wx.showToast({
        icon: "none",
        title: "请先生成二维码",
        duration: 2000
      });
      return;
    }

    wx.previewImage({
      current: img, // 当前显示图片的http链接
      urls: [img] // 需要预览的图片http链接列表
    });
  },

  formSubmit: function (e) {
    var inputValue = e.detail.value.url || "";
    var content = inputValue.trim();

    if (!content) {
      wx.showToast({
        icon: "none",
        title: "请输入网址",
        duration: 2000
      });
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      wx.showToast({
        icon: "none",
        title: "输入内容过长",
        duration: 2000
      });
      return;
    }

    this.renderQrCode(content);
  }
});
