// pages/main/index.js
var QR = require("../../utils/qrcode.js");
var CANVAS_ID = "mycanvas";
var DEFAULT_PLACEHOLDER = "https://github.com";
var DEFAULT_GITHUB_LOGO_LOCAL_PATH = "pages/main/assets/github-mark.png";
var FALLBACK_CANVAS_SIZE = 300;
var MAX_CONTENT_LENGTH = 255;

function isValidHexColor(color) {
  return typeof color === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

function normalizeHexColor(color, fallback) {
  return isValidHexColor(color) ? color : fallback;
}

function isValidHttpUrl(url) {
  return /^https?:\/\/\S+$/i.test(url);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

Page({
  data: {
    maskHidden: true,
    imagePath: "",
    placeholder: DEFAULT_PLACEHOLDER,
    isRendering: false,
    qrInput: DEFAULT_PLACEHOLDER,
    foregroundColor: "#000000",
    backgroundColor: "#ffffff",
    gradientEnabled: false,
    gradientStartColor: "#000000",
    gradientEndColor: "#409eff",
    gradientAngle: "45",
    logoEnabled: true,
    logoSourceType: "local",
    logoLocalPath: "",
    logoUrl: "",
    logoSizeRatio: "0.2",
    logoPadding: "4",
    logoBorderRadius: "8",
    logoBackgroundColor: "#ffffff",
    logoPreviewPath: "",
    renderWarnings: []
  },

  onLoad: function () {
    var that = this;
    // 将代码包内的静态 logo 复制到用户数据目录，得到稳定可用的临时路径
    // 这样 canvas drawImage 就不会受到 WebView 页面路径前缀拼接的影响
    var destPath = wx.env.USER_DATA_PATH + '/default_logo.png';
    var fs = wx.getFileSystemManager();
    fs.copyFile({
      srcPath: DEFAULT_GITHUB_LOGO_LOCAL_PATH,
      destPath: destPath,
      success: function () {
        that.setData({
          logoLocalPath: destPath,
          logoPreviewPath: destPath
        });
        that.renderQrCode(that.data.qrInput);
      },
      fail: function (err) {
        console.warn('复制默认 logo 失败，将无 logo 渲染', err);
        that.renderQrCode(that.data.qrInput);
      }
    });
  },

  setCanvasSize: function () {
    try {
      var res = wx.getSystemInfoSync();
      var scale = 750 / 686;
      var width = res.windowWidth / scale;
      return {
        w: width,
        h: width
      };
    } catch (e) {
      console.error("获取设备信息失败", e);
      return {
        w: FALLBACK_CANVAS_SIZE,
        h: FALLBACK_CANVAS_SIZE
      };
    }
  },

  onFieldInput: function (e) {
    var key = e.currentTarget.dataset.key;
    var val = e.detail.value;
    var updateData = {
      [key]: val
    };
    // 如果修改的是 Logo URL，同步更新预览路径
    if (key === "logoUrl") {
      updateData.logoPreviewPath = val;
    }
    this.setData(updateData);
  },

  onFieldSwitch: function (e) {
    var key = e.currentTarget.dataset.key;
    this.setData({
      [key]: !!e.detail.value
    });
  },

  onLogoSourceChange: function (e) {
    this.setData({
      logoSourceType: e.detail.value
    });
  },

  chooseLogoImage: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: function (res) {
        var path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) {
          return;
        }
        that.setData({
          logoLocalPath: path,
          logoPreviewPath: path,
          logoEnabled: true,
          logoSourceType: "local"
        });
      },
      fail: function (err) {
        console.error("选择 logo 失败", err);
      }
    });
  },

  buildRenderOptions: function () {
    var warnings = [];
    var foregroundColor = normalizeHexColor(this.data.foregroundColor, "#000000");
    var backgroundColor = normalizeHexColor(this.data.backgroundColor, "#ffffff");
    if (foregroundColor !== this.data.foregroundColor) {
      warnings.push("前景色格式无效，已回退默认值");
    }
    if (backgroundColor !== this.data.backgroundColor) {
      warnings.push("背景色格式无效，已回退默认值");
    }

    var options = {
      foregroundColor: foregroundColor,
      backgroundColor: backgroundColor,
      gradient: {
        enabled: !!this.data.gradientEnabled,
        startColor: normalizeHexColor(this.data.gradientStartColor, "#000000"),
        endColor: normalizeHexColor(this.data.gradientEndColor, "#333333"),
        angle: Number(this.data.gradientAngle)
      },
      logo: {
        enabled: !!this.data.logoEnabled,
        src: "",
        sizeRatio: clamp(Number(this.data.logoSizeRatio) || 0.2, 0.12, 0.28),
        padding: Math.max(0, Number(this.data.logoPadding) || 4),
        borderRadius: Math.max(0, Number(this.data.logoBorderRadius) || 8),
        backgroundColor: normalizeHexColor(this.data.logoBackgroundColor, "#ffffff")
      }
    };

    if (!isValidHexColor(this.data.gradientStartColor)) {
      warnings.push("渐变起始色格式无效，已回退默认值");
    }
    if (!isValidHexColor(this.data.gradientEndColor)) {
      warnings.push("渐变结束色格式无效，已回退默认值");
    }
    if (isNaN(options.gradient.angle)) {
      options.gradient.angle = 0;
      warnings.push("渐变角度无效，已回退为 0");
    }
    if (!isValidHexColor(this.data.logoBackgroundColor)) {
      warnings.push("Logo 背景色格式无效，已回退默认值");
    }

    if (options.logo.enabled) {
      if (this.data.logoSourceType === "local") {
        if (!this.data.logoLocalPath) {
          return {
            error: "请先选择本地 logo 图片"
          };
        }
        options.logo.src = this.data.logoLocalPath;
      } else {
        var url = (this.data.logoUrl || "").trim();
        if (!isValidHttpUrl(url)) {
          return {
            error: "请输入有效的 logo 图片 URL"
          };
        }
        options.logo.src = url;
      }
    }

    return {
      options: options,
      warnings: warnings
    };
  },

  createQrCode: function (content, canvasObj, cavW, cavH, drawOptions, onDone) {
    var that = this;
    QR.api.draw(content, canvasObj, cavW, cavH, this, function (meta) {
      that.canvasToTempImage(canvasObj, meta && meta.drawArea, function (err) {
        if (typeof onDone === "function") {
          onDone(err, meta || {});
        }
      });
    }, undefined, drawOptions);
  },

  canvasToTempImage: function (canvasObj, area, callback) {
    var that = this;
    var options = {
      canvas: canvasObj, // Canvas 2D 模式必须传入 canvas 对象
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
    wx.canvasToTempFilePath(options);
  },

  renderQrCode: function (content) {
    var that = this;
    if (that.data.isRendering) {
      return;
    }

    var configResult = this.buildRenderOptions();
    if (configResult.error) {
      wx.showToast({
        title: configResult.error,
        icon: "none"
      });
      return;
    }

    this.setData({
      isRendering: true,
      maskHidden: false
    });

    wx.showLoading({
      title: "生成中...",
      mask: true
    });

    var size = this.setCanvasSize();

    // Canvas 2D 需要通过 SelectorQuery 获取 node
    wx.createSelectorQuery()
      .select('#' + CANVAS_ID)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          console.error("未找到 Canvas 节点");
          wx.hideLoading();
          that.setData({ isRendering: false, maskHidden: true });
          return;
        }

        var canvas = res[0].node;
        var dpr = wx.getSystemInfoSync().pixelRatio;
        
        // 设置 Canvas 内部渲染分辨率（乘以 dpr 保证清晰度）
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        that.createQrCode(content, canvas, size.w, size.h, configResult.options, function (err, meta) {
          wx.hideLoading();
          var warnings = configResult.warnings.slice(0);
          if (meta && meta.warnings) {
            warnings = warnings.concat(meta.warnings);
          }
          that.setData({
            isRendering: false,
            maskHidden: true,
            renderWarnings: warnings
          });
          if (err) {
            wx.showToast({
              title: "生成失败",
              icon: "none"
            });
          }
        });
      });
  },

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
      current: img,
      urls: [img]
    });
  },

  formSubmit: function (e) {
    var inputValue = e.detail.value.url || this.data.qrInput || "";
    var content = inputValue.trim();
    this.setData({
      qrInput: inputValue
    });

    if (!content) {
      wx.showToast({
        icon: "none",
        title: "请输入网址或文本",
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
