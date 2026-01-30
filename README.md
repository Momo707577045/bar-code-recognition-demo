# 二维码/条形码识别工具

提供两种识别方案：**云端 API 识别** 和 **本地 WASM 识别**，满足不同场景需求。

## 🎯 方案对比

| 特性 | 云端识别 (2weima) | 本地识别 (ZBar WASM) |
|------|-------------------|----------------------|
| 网络要求 | ✅ 需要联网 | ❌ 离线可用 |
| 识别精度 | ⭐⭐⭐⭐⭐ 高 | ⭐⭐⭐⭐ 较高 |
| 响应速度 | 取决于网络 | ⚡ 毫秒级 |
| 隐私性 | 图片上传至服务器 | 🔒 完全本地处理 |
| 摄像头实时扫描 | ❌ 不支持 | ✅ 支持 |
| iPad/移动端 | ✅ 支持 | ✅ 支持 |
| API 配额 | 有限制 | ♾️ 无限制 |
| 支持码制 | 二维码为主 | 二维码 + 多种条形码 |

## 📂 文件结构

```
qrCode/
├── index.html          # 云端识别演示页面
├── qrcode-scanner.js   # 云端识别 JSSDK
├── barcode-demo.html   # 本地识别演示页面
├── barcode-scanner.js  # 本地识别 JSSDK (封装层)
├── zbar-wasm.js        # ZBar WASM 核心库
└── README.md           # 说明文档
```

---

# 📡 方案一：云端 API 识别

基于 2weima.com API 的二维码识别实现。

## API 信息

- **API 端点**: `https://api.2weima.com/api/qrdecode`
- **请求方式**: POST (multipart/form-data)
- **认证方式**: Bearer Token

## 快速开始

### 1. 直接打开演示页面

双击 `index.html` 文件即可在浏览器中打开演示页面，支持：
- 拖拽上传图片
- 点击选择图片
- 输入图片URL识别

### 2. 在项目中使用 JSSDK

```html
<!-- 引入 SDK -->
<script src="qrcode-scanner.js"></script>

<script>
// 初始化扫描器
const scanner = new QRCodeScanner({
    apiKey: '4702|eP866LveV7BFuhfuA59qyQqeFRS8zt4rmDsYQN9T'
});

// 通过文件识别
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    try {
        const result = await scanner.scanFile(file);
        console.log('识别结果:', result);
        // result.content 包含二维码内容
    } catch (error) {
        console.error('识别失败:', error.message);
    }
});

// 通过URL识别
async function scanByUrl() {
    try {
        const result = await scanner.scanUrl('https://img.2weima.com/qr_template/2021/6/26/8857784941a0f2d2a024044f414c69f9.jpg');
        console.log('识别结果:', result);
    } catch (error) {
        console.error('识别失败:', error.message);
    }
}

// 通过Base64识别
async function scanByBase64(base64String) {
    try {
        const result = await scanner.scanBase64(base64String);
        console.log('识别结果:', result);
    } catch (error) {
        console.error('识别失败:', error.message);
    }
}
</script>
```

## API 文档

### 构造函数

```javascript
const scanner = new QRCodeScanner(options);
```

**参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| options.apiKey | string | 是 | API Key (Bearer Token) |
| options.apiUrl | string | 否 | API URL，默认为 `https://api.2weima.com/api/qrdecode` |
| options.timeout | number | 否 | 请求超时时间(毫秒)，默认 30000 |

### 方法

#### scanFile(file)

通过文件识别二维码。

```javascript
const result = await scanner.scanFile(file);
console.log(result.content); // 二维码内容
```

**参数：**
- `file` (File|Blob): 图片文件对象

**文件大小限制：** 最大 10MB

---

#### scanUrl(imageUrl)

通过图片URL识别二维码。

```javascript
const result = await scanner.scanUrl('https://example.com/qrcode.png');
console.log(result.content); // 二维码内容
```

**参数：**
- `imageUrl` (string): 图片的URL地址

---

#### scanBase64(base64)

通过Base64编码识别二维码。

```javascript
const result = await scanner.scanBase64(base64String);
console.log(result.content); // 二维码内容
```

**参数：**
- `base64` (string): Base64编码的图片数据（可带或不带 data:image/xxx;base64, 前缀）

---

#### scanCanvas(canvas, mimeType)

从Canvas元素获取图片并识别。

```javascript
const canvas = document.getElementById('myCanvas');
const result = await scanner.scanCanvas(canvas);
```

**参数：**
- `canvas` (HTMLCanvasElement): Canvas元素
- `mimeType` (string): 可选，图片类型，默认 'image/png'

---

#### scanVideo(video)

从视频帧获取图片并识别。

```javascript
const video = document.getElementById('myVideo');
const result = await scanner.scanVideo(video);
```

**参数：**
- `video` (HTMLVideoElement): Video元素

---

#### scanBatch(items)

批量识别多张图片。

```javascript
const results = await scanner.scanBatch([file1, file2, 'https://example.com/qr.png']);
```

**参数：**
- `items` (Array): 文件对象或URL字符串的数组

**返回：**
```javascript
[
    { index: 0, success: true, data: {...}, error: null },
    { index: 1, success: false, data: null, error: '识别失败' }
]
```

---

#### QRCodeScanner.fileToBase64(file) [静态方法]

将File对象转换为Base64字符串。

```javascript
const base64 = await QRCodeScanner.fileToBase64(file);
```

## 返回结果格式

成功识别后，返回结果包含：

```javascript
{
    "success": true,
    "content": "https://example.com",  // 二维码内容
    "raw": { ... }                      // API 原始返回数据
}
```

## 原始 API 调用示例 (jQuery)

如果您想直接使用 jQuery 调用 API：

```javascript
var form = new FormData();
form.append("qr_image", "https://img.2weima.com/qr_template/2021/6/26/8857784941a0f2d2a024044f414c69f9.jpg");

var settings = {
    "url": "https://api.2weima.com/api/qrdecode",
    "method": "POST",
    "timeout": 0,
    "headers": {
        "Accept": "application/json",
        "Authorization": "Bearer 4702|eP866LveV7BFuhfuA59qyQqeFRS8zt4rmDsYQN9T"
    },
    "processData": false,
    "mimeType": "multipart/form-data",
    "contentType": false,
    "data": form
};

$.ajax(settings).done(function (response) {
    console.log(response);
});
```

## 错误处理

```javascript
try {
    const result = await scanner.scanFile(file);
} catch (error) {
    // error.message 包含错误信息
    console.error('错误:', error.message);
}
```

常见错误：
- `API Key 是必须的` - 未提供 API Key
- `请提供图片文件` - 未提供文件
- `不支持的图片格式` - 图片格式不支持
- `图片大小不能超过 10MB` - 文件过大
- `请求超时` - API 请求超时
- `HTTP错误: xxx` - API 返回错误

## 注意事项

1. **跨域问题**：如果在本地直接打开 HTML 文件，可能会遇到 CORS 跨域问题。建议使用本地服务器运行：
   ```bash
   # 使用 Python
   python -m http.server 8080
   
   # 或使用 Node.js 的 http-server
   npx http-server
   ```

2. **API 配额**：请注意 API 的调用配额限制，避免超出使用限制。

3. **图片质量**：确保上传的二维码图片清晰，以获得最佳识别效果。

## Bearer Token

当前配置的 API Key：
```
Bearer 4702|eP866LveV7BFuhfuA59qyQqeFRS8zt4rmDsYQN9T
```

---

# 🔌 方案二：本地 WASM 识别

基于 ZBar 的 WebAssembly 移植版，完全在浏览器端本地执行，无需网络连接。

## ✨ 特性

- 🚀 **离线可用** - 所有处理在本地完成，无需网络
- 🔒 **隐私安全** - 图片数据不会上传到任何服务器
- ⚡ **实时扫描** - 支持摄像头实时扫码
- 📱 **移动端友好** - 完美支持 iPad / iPhone / Android
- 📊 **多码制支持** - 支持 QR Code、EAN、UPC、Code128 等多种格式

## 支持的码制类型

| 类型 | 说明 |
|------|------|
| QR-Code | 二维码 |
| EAN-13 | 国际商品条码 |
| EAN-8 | 短版商品条码 |
| UPC-A | 美国商品条码 |
| UPC-E | 压缩版 UPC |
| Code-128 | 高密度条码 |
| Code-39 | 字母数字条码 |
| Code-93 | 改进版 Code-39 |
| Codabar | 库德巴码 |
| I2/5 | 交叉二五码 |
| DataBar | GS1 数据条 |
| DataBar-Exp | 扩展数据条 |

## 快速开始

### 1. 打开演示页面

使用本地服务器打开 `barcode-demo.html`：

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx http-server

# 然后访问 http://localhost:8080/barcode-demo.html
```

> ⚠️ **注意**：WASM 文件必须通过 HTTP/HTTPS 协议加载，不能直接用 `file://` 协议打开。

### 2. 在项目中使用

```html
<!-- 引入核心库和封装层 -->
<script src="zbar-wasm.js"></script>
<script src="barcode-scanner.js"></script>

<script>
// 创建扫描器实例
const scanner = new BarcodeScanner();

// 初始化（加载 WASM 模块）
await scanner.init();

// 扫描文件
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const results = await scanner.scanFile(file);
    
    results.forEach(result => {
        console.log(`类型: ${result.typeName}`);
        console.log(`内容: ${result.data}`);
        console.log(`质量: ${result.quality}`);
    });
});
</script>
```

## API 文档

### 构造函数

```javascript
const scanner = new BarcodeScanner(options);
```

**参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| options.locateEnabled | boolean | true | 是否启用定位功能 |
| options.enabledSymbologies | array | 全部 | 启用的码制类型数组 |

### 实例方法

#### init()

初始化扫描器（加载 WASM 模块）。

```javascript
await scanner.init();
```

---

#### scanFile(file)

扫描图片文件。

```javascript
const results = await scanner.scanFile(file);
```

**参数：**
- `file` (File|Blob): 图片文件

**返回：**
```javascript
[
    {
        typeName: "QR-Code",
        data: "https://example.com",
        quality: 1,
        points: [{x: 10, y: 20}, ...] // 定位点
    }
]
```

---

#### scanUrl(imageUrl)

扫描网络图片。

```javascript
const results = await scanner.scanUrl('https://example.com/qrcode.png');
```

---

#### scanCanvas(canvas)

扫描 Canvas 元素。

```javascript
const canvas = document.getElementById('myCanvas');
const results = await scanner.scanCanvas(canvas);
```

---

#### scanImageData(imageData)

扫描 ImageData 对象（适用于自定义图像处理场景）。

```javascript
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const results = await scanner.scanImageData(imageData);
```

---

#### startCamera(videoElement, onResult, options)

启动摄像头实时扫描。

```javascript
const video = document.getElementById('scanVideo');

const control = await scanner.startCamera(video, (results) => {
    console.log('扫描到:', results);
}, {
    facingMode: 'environment',  // 'environment' 后置 | 'user' 前置
    interval: 100,              // 扫描间隔(毫秒)
    stopOnResult: false         // 扫到结果后是否停止
});

// 停止扫描
control.stop();
```

**返回控制对象：**
```javascript
{
    stop: Function,     // 停止扫描
    pause: Function,    // 暂停扫描
    resume: Function    // 恢复扫描
}
```

---

#### destroy()

销毁扫描器，释放资源。

```javascript
scanner.destroy();
```

### 静态方法

#### BarcodeScanner.isSupported()

检查浏览器是否支持 WebAssembly。

```javascript
if (BarcodeScanner.isSupported()) {
    console.log('支持 WASM');
}
```

---

#### BarcodeScanner.isIPad()

检测是否为 iPad 设备。

```javascript
if (BarcodeScanner.isIPad()) {
    console.log('当前是 iPad');
}
```

---

#### BarcodeScanner.getSupportedTypes()

获取支持的码制类型列表。

```javascript
const types = BarcodeScanner.getSupportedTypes();
console.log(types);
// { QRCODE: "QR-Code", EAN13: "EAN-13", ... }
```

## 完整示例：摄像头扫码

```html
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扫码示例</title>
</head>
<body>
    <video id="video" autoplay playsinline style="width: 100%;"></video>
    <div id="result"></div>
    <button id="startBtn">开始扫描</button>
    <button id="stopBtn" disabled>停止扫描</button>

    <script src="zbar-wasm.js"></script>
    <script src="barcode-scanner.js"></script>
    <script>
        const video = document.getElementById('video');
        const resultDiv = document.getElementById('result');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        let scanner = null;
        let cameraControl = null;

        // 初始化
        async function init() {
            scanner = new BarcodeScanner();
            await scanner.init();
            console.log('扫描器就绪');
        }

        // 开始扫描
        startBtn.addEventListener('click', async () => {
            try {
                cameraControl = await scanner.startCamera(video, (results) => {
                    if (results.length > 0) {
                        resultDiv.innerHTML = results.map(r => 
                            `<p><strong>${r.typeName}:</strong> ${r.data}</p>`
                        ).join('');
                        
                        // 震动反馈
                        if (navigator.vibrate) {
                            navigator.vibrate(100);
                        }
                    }
                }, {
                    facingMode: 'environment',
                    interval: 200
                });

                startBtn.disabled = true;
                stopBtn.disabled = false;
            } catch (e) {
                alert('无法启动摄像头: ' + e.message);
            }
        });

        // 停止扫描
        stopBtn.addEventListener('click', () => {
            if (cameraControl) {
                cameraControl.stop();
                cameraControl = null;
            }
            startBtn.disabled = false;
            stopBtn.disabled = true;
        });

        // 页面加载时初始化
        init();
    </script>
</body>
</html>
```

## 浏览器兼容性

| 浏览器 | 版本要求 |
|--------|----------|
| Chrome | 57+ |
| Firefox | 52+ |
| Safari | 11+ |
| Edge | 16+ |
| iOS Safari | 11+ |
| Android Chrome | 57+ |

## 性能优化建议

1. **降低扫描分辨率**：对于实时扫描，可以使用较低分辨率的视频流
2. **调整扫描间隔**：根据需要调整 `interval` 参数，平衡性能和响应速度
3. **限制扫描区域**：如果可能，只扫描画面中心区域
4. **预初始化**：在页面加载时就调用 `init()`，避免首次扫描时的延迟

## 常见问题

### Q: 为什么直接打开 HTML 文件无法使用？
A: WebAssembly 模块需要通过 HTTP/HTTPS 协议加载。请使用本地服务器运行。

### Q: iPad 上摄像头无法启动？
A: 请确保在 HTTPS 环境下运行，或者在 Safari 设置中允许摄像头权限。

### Q: 扫描速度较慢？
A: 可以尝试降低视频分辨率，或增加扫描间隔时间。

---

# 🔀 混合使用两种方案

您可以根据场景灵活选择识别方案：

```javascript
// 创建两个扫描器
const cloudScanner = new QRCodeScanner({
    apiKey: 'your-api-key'
});

const localScanner = new BarcodeScanner();
await localScanner.init();

// 策略：先尝试本地识别，失败后用云端
async function smartScan(file) {
    // 1. 先尝试本地识别（快速、免费）
    const localResults = await localScanner.scanFile(file);
    
    if (localResults.length > 0) {
        return {
            source: 'local',
            data: localResults[0].data
        };
    }
    
    // 2. 本地失败，使用云端（高精度）
    try {
        const cloudResult = await cloudScanner.scanFile(file);
        return {
            source: 'cloud',
            data: cloudResult.content
        };
    } catch (e) {
        throw new Error('识别失败');
    }
}
```

---

## 许可证

MIT License
