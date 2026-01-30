/**
 * 条形码/二维码本地识别 SDK
 * 基于 zbar-wasm.js 实现，无需网络请求，本地解码
 * 
 * 支持的码制类型：
 * - QR Code (二维码)
 * - EAN-13, EAN-8 (商品条码)
 * - UPC-A, UPC-E (美国商品条码)
 * - Code 128, Code 39, Code 93 (工业条码)
 * - ISBN-10, ISBN-13 (书籍条码)
 * - DataBar (GS1 DataBar)
 * - I25 (Interleaved 2 of 5)
 * 
 * 兼容性：
 * - 现代浏览器 (Chrome, Firefox, Safari, Edge)
 * - iPad/iPhone (iOS 11+)
 * - Android (Chrome 57+)
 */

class BarcodeScanner {
    constructor(options = {}) {
        this.options = {
            // 是否开启二进制模式(用于解码非 UTF-8 编码的数据)
            enableBinary: true,
            // 扫描区域裁剪(可选)
            scanRegion: null,
            ...options
        };
        
        this.scanner = null;
        this.ready = false;
        this._initPromise = null;
    }

    /**
     * 初始化扫描器
     * @returns {Promise<void>}
     */
    async init() {
        if (this.ready) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            // 检查 zbarWasm 是否已加载
            if (typeof zbarWasm === 'undefined') {
                throw new Error('zbar-wasm.js 未加载，请确保在使用前引入该脚本');
            }

            // 获取扫描器实例
            this.scanner = await zbarWasm.getDefaultScanner();
            this.ready = true;
        })();

        return this._initPromise;
    }

    /**
     * 从 ImageData 对象识别条形码/二维码
     * @param {ImageData} imageData - Canvas 的 ImageData 对象
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanImageData(imageData) {
        await this.init();
        
        const results = await zbarWasm.scanImageData(imageData, this.scanner);
        return this._formatResults(results);
    }

    /**
     * 从 Canvas 元素识别条形码/二维码
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return this.scanImageData(imageData);
    }

    /**
     * 从图片 URL 识别条形码/二维码
     * @param {string} url - 图片 URL
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanUrl(url) {
        const img = await this._loadImage(url);
        return this.scanImage(img);
    }

    /**
     * 从 Image 元素识别条形码/二维码
     * @param {HTMLImageElement} img - Image 元素
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanImage(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        return this.scanCanvas(canvas);
    }

    /**
     * 从 File 对象识别条形码/二维码
     * @param {File} file - 文件对象
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanFile(file) {
        const url = URL.createObjectURL(file);
        try {
            return await this.scanUrl(url);
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    /**
     * 从 Video 元素当前帧识别条形码/二维码
     * @param {HTMLVideoElement} video - Video 元素
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanVideo(video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        return this.scanCanvas(canvas);
    }

    /**
     * 从 Base64 字符串识别条形码/二维码
     * @param {string} base64 - Base64 编码的图片数据
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanBase64(base64) {
        // 确保有正确的 data URL 前缀
        if (!base64.startsWith('data:')) {
            base64 = 'data:image/png;base64,' + base64;
        }
        return this.scanUrl(base64);
    }

    /**
     * 从灰度缓冲区识别（高级用法）
     * @param {Uint8Array} grayBuffer - 灰度图像数据
     * @param {number} width - 图像宽度
     * @param {number} height - 图像高度
     * @returns {Promise<Array>} 识别结果数组
     */
    async scanGrayBuffer(grayBuffer, width, height) {
        await this.init();
        
        const results = await zbarWasm.scanGrayBuffer(
            grayBuffer, 
            width, 
            height, 
            this.scanner
        );
        return this._formatResults(results);
    }

    /**
     * 开始持续扫描视频流
     * @param {HTMLVideoElement} video - Video 元素
     * @param {Function} onResult - 识别到结果时的回调函数
     * @param {Object} options - 扫描选项
     * @returns {Object} 返回控制对象 { stop: Function }
     */
    startContinuousScan(video, onResult, options = {}) {
        const {
            interval = 100,  // 扫描间隔(毫秒)
            stopOnResult = false,  // 识别到结果后是否停止
        } = options;

        let running = true;
        let animationId = null;
        let lastScanTime = 0;

        const scan = async (timestamp) => {
            if (!running) return;

            if (timestamp - lastScanTime >= interval) {
                lastScanTime = timestamp;
                
                try {
                    const results = await this.scanVideo(video);
                    if (results.length > 0) {
                        onResult(results);
                        if (stopOnResult) {
                            running = false;
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('扫描出错:', e);
                }
            }

            animationId = requestAnimationFrame(scan);
        };

        animationId = requestAnimationFrame(scan);

        return {
            stop: () => {
                running = false;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        };
    }

    /**
     * 请求摄像头权限并开始扫描
     * @param {HTMLVideoElement} video - Video 元素
     * @param {Function} onResult - 识别到结果时的回调函数
     * @param {Object} options - 摄像头和扫描选项
     * @returns {Promise<Object>} 返回控制对象 { stop: Function }
     */
    async startCamera(video, onResult, options = {}) {
        const {
            facingMode = 'environment',  // 'environment' 后置摄像头, 'user' 前置摄像头
            width = 1280,
            height = 720,
            ...scanOptions
        } = options;

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode,
                width: { ideal: width },
                height: { ideal: height }
            }
        });

        video.srcObject = stream;
        await video.play();

        const scanControl = this.startContinuousScan(video, onResult, scanOptions);

        return {
            stop: () => {
                scanControl.stop();
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            },
            stream
        };
    }

    /**
     * 格式化识别结果
     * @private
     */
    _formatResults(results) {
        return results.map(result => ({
            // 解码后的数据
            data: result.decode(),
            // 原始字节数据
            rawData: result.rawData,
            // 码制类型名称
            typeName: result.typeName,
            // 码制类型 ID
            type: result.type,
            // 定位点信息
            points: result.points,
            // 质量评分
            quality: result.quality,
            // 方向
            orientation: result.orientation
        }));
    }

    /**
     * 加载图片
     * @private
     */
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('图片加载失败: ' + url));
            
            img.src = url;
        });
    }

    /**
     * 获取支持的码制类型列表
     * @static
     * @returns {Object} 支持的码制类型
     */
    static getSupportedTypes() {
        return {
            'QRCODE': '二维码 (QR Code)',
            'EAN13': '商品条码 EAN-13',
            'EAN8': '商品条码 EAN-8',
            'UPCA': '美国商品条码 UPC-A',
            'UPCE': '美国商品条码 UPC-E',
            'ISBN10': '书籍条码 ISBN-10',
            'ISBN13': '书籍条码 ISBN-13',
            'CODE128': '工业条码 Code 128',
            'CODE39': '工业条码 Code 39',
            'CODE93': '工业条码 Code 93',
            'CODABAR': 'Codabar',
            'I25': 'Interleaved 2 of 5',
            'DATABAR': 'GS1 DataBar',
            'DATABAR_EXP': 'GS1 DataBar Expanded',
            'PDF417': 'PDF417'
        };
    }

    /**
     * 检查当前环境是否支持 WebAssembly
     * @static
     * @returns {boolean}
     */
    static isSupported() {
        return typeof WebAssembly !== 'undefined' && 
               typeof WebAssembly.instantiate === 'function';
    }

    /**
     * 检查是否为 iPad/iOS 设备
     * @static
     * @returns {boolean}
     */
    static isIPad() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }
}

// 导出模块（兼容多种环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeScanner;
} else if (typeof window !== 'undefined') {
    window.BarcodeScanner = BarcodeScanner;
}
