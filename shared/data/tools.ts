import type { OriginToolMenu } from '#shared/types/tool'

export const tools: OriginToolMenu[] = [
  {
    label: '文档工具',
    children: [
      {
        label: 'PDF合并',
        name: 'pdfMerge',
        description: '在线合并多个 PDF 文件，按上传顺序快速生成一个完整文档，适合资料整理、合同归档和报告汇总。',
      },
      {
        label: 'PDF拆分',
        name: 'pdfSplit',
        description: '在线按页码范围拆分 PDF 文件，从原始文档中提取指定页面，适合分发章节、附件和单独页面。',
      },
      {
        label: 'PDF转JPG',
        name: 'pdfToJpg',
        description: '在线将 PDF 页面转换为 JPG 图片，支持多页文档批量导出，便于预览、分享和插入其他内容。',
      },
      {
        label: 'JPG转PDF',
        name: 'jpgToPdf',
        description: '在线把 JPG 图片按顺序合成为 PDF 文档，适合扫描件整理、图片归档和多图打包分享。',
      },
      {
        label: 'Markdown编辑器',
        name: 'markdownEditor',
        description: '在线编辑 Markdown 文档，支持源码、双栏和富文本编辑模式，适合快速编写、预览和整理文本内容。',
      },
    ],
  },
  {
    label: '开发工具',
    children: [
      {
        label: 'AI 对话',
        name: 'aiChat',
        description: '在线配置 AI 模型并进行多轮对话，支持会话管理和模型切换，适合日常提问、文本处理和开发辅助。',
      },
      {
        label: 'JSON编辑器',
        name: 'jsonEditor',
        description: '在线查看、格式化、编辑和校验 JSON 数据，支持文档管理和结构化预览，适合接口调试与数据整理。',
      },
      {
        label: 'Mock工具',
        name: 'mock',
        description: '在线创建和管理接口 Mock 项目，配置模拟接口路径与响应数据，适合前后端联调和测试场景构造。',
        requiresAuth: true,
      },
      {
        label: 'TinyEditor',
        name: 'tinyEditor',
        description: '在线使用富文本编辑器编写和预览内容，适合快速测试排版、编辑 HTML 内容和整理文本片段。',
      },
      {
        label: 'RunJS',
        name: 'runjs',
        description: '在线编写、运行和调试 JavaScript 代码片段，支持控制台输出与 ESM 依赖配置，适合快速验证逻辑。',
      },
      {
        label: 'CSS格式化',
        name: 'cssFormatter',
        description: '在线格式化、压缩和整理 CSS 代码，让样式表更易阅读、调试和发布，适合前端开发日常处理。',
      },
      {
        label: 'XML格式化',
        name: 'xmlFormatter',
        description: '在线格式化、压缩和整理 XML 内容，帮助查看层级结构、排查格式问题并处理接口返回数据。',
      },
      {
        label: '时间计算',
        name: 'timeCompute',
        description: '在线进行时间戳与日期时间互转，计算几天后的日期和两个日期之间的天数差，适合开发调试和日常换算。',
      },
      {
        label: '在线ASCII码对照表',
        name: 'ascii',
        description: '在线查询 ASCII 字符的十进制、十六进制、八进制、二进制和 HTML Code，支持关键词和字符分组筛选。',
      },
      {
        label: '查看网页源码',
        name: 'viewSourceCode',
        description: '在线输入网址查看网页 HTML 源码内容，适合检查页面结构、调试采集规则和分析网页返回结果。',
      },
      {
        label: '正则大全',
        name: 'anyRule',
        description: '在线查询常用正则表达式并输入内容测试匹配结果，覆盖手机号、邮箱、身份证、URL 等常见校验规则。',
      },
      {
        label: '前端CDN搜索',
        name: 'cdnQuery',
        description: '在线搜索前端 npm 包并查看 CDN 引用信息，支持包名与作者过滤，便于快速找到浏览器可用资源地址。',
      },
      {
        label: '中国色',
        name: 'chineseColor',
        description: '在线浏览中国传统颜色，查看颜色名称、拼音、HEX、RGB 和 CMYK 数值，适合设计配色与文化色彩参考。',
      },
      {
        label: '资源包',
        name: 'https://lib.demos.pub',
        requiresAuth: true,
      },
      {
        label: '在线流程图',
        name: 'https://app.diagrams.net/',
      },
    ],
  },
  {
    label: '转换与编码',
    children: [
      {
        label: '颜色转换器',
        name: 'colorTransform',
        description: '在线转换 HEX、RGB、HSL 等颜色格式，快速查看颜色值和互转结果，适合前端开发与设计调色。',
      },
      {
        label: 'Base64编解码',
        name: 'base64',
        description: '在线进行 Base64 文本编码和解码，支持 URL-safe Base64，适合接口调试、参数处理和文本转换。',
      },
      {
        label: 'Base64转文件',
        name: 'base64File',
        description: '在线将文件编码为 Base64 字符串，也可把 Base64 内容还原为文件，适合接口传输和文件内容调试。',
      },
      {
        label: 'Base64图片编码',
        name: 'imageBase64',
        description: '在线将图片转换为 Base64 或 Data URL，也可从 Base64 预览和还原图片，适合前端内联资源处理。',
      },
      {
        label: '二维码编解码',
        name: 'qrcode',
        description: '在线生成二维码并识别二维码图片或摄像头画面，支持纠错等级、尺寸和边距设置，适合链接与文本分享。',
      },
      {
        label: '哔哩哔哩AV、BV号转换',
        name: 'bilibiliBv2av',
        description: '在线进行哔哩哔哩 AV 号和 BV 号互相转换，并生成对应视频链接，适合 B 站视频编号查询与整理。',
      },
      {
        label: '数字中文转换',
        name: 'nzh',
        description: '在线进行阿拉伯数字、中文数字和金额大写转换，适合票据、金额展示和文本格式处理。',
      },
      {
        label: '亲戚关系计算器',
        name: 'relationship',
        description: '在线根据亲属关系链计算称呼，也可反向查询关系，适合家庭关系、称谓表达和中文亲属称呼参考。',
      },
      {
        label: '文本HASH',
        name: 'hashText',
        description: '在线计算文本内容的哈希摘要，支持常见 Hash 算法，适合校验字符串、签名调试和数据比对。',
      },
      {
        label: '文件HASH',
        name: 'hashFile',
        description: '在线计算文件的哈希校验值，支持常见摘要算法，适合文件完整性检查、下载校验和版本比对。',
      },
      {
        label: '在线JWT解密',
        name: 'jwt',
        description: '在线解析 JWT Token 的 Header、Payload 和签名结构，便于查看声明内容、排查认证问题和调试接口。',
      },
      {
        label: 'GeoHash编解码',
        name: 'geohash',
        description: '在线进行经纬度与 GeoHash 编码互转，查看地理位置编码结果，适合地图开发、位置索引和空间数据调试。',
      },
      {
        label: 'UUID生成器',
        name: 'uuid',
        description: '在线批量生成 UUID，支持 v1、v4、v7 和 NIL 格式，可选择是否保留连字符，适合开发测试和唯一标识生成。',
      },
    ],
  },
  {
    label: 'GIS工具',
    children: [
      {
        label: 'GeoJSON工具',
        name: 'geoJson',
        description: '在线查看、编辑、导入和导出 GeoJSON 数据，支持属性表、坐标系和 Shapefile 转换，适合 GIS 数据处理。',
      },
      {
        label: 'WKT/GeoJSON转换',
        name: 'wktGeoJson',
        description: '在线进行 WKT 与 GeoJSON 几何数据互相转换，支持点、线、面和 GeometryCollection 等常见空间格式。',
      },
      {
        label: 'GeoJSON/TopoJSON转换',
        name: 'topoJson',
        description: '在线进行 GeoJSON 与 TopoJSON 数据互相转换，支持压缩拓扑结构和还原为标准 GeoJSON。',
      },
      {
        label: '经纬度查询',
        name: 'latLng',
        description: '在线查询地点经纬度、拾取地图坐标并进行地址解析，适合地图定位、坐标复制和地理信息核对。',
      },
      {
        label: '切片方案计算',
        name: 'lodCalculator',
        description: '在线计算地图切片方案、比例尺、分辨率和层级参数，适合 WebGIS、瓦片服务和地图发布配置。',
      },
      {
        label: '行政区数据',
        name: 'https://datav.aliyun.com/tools/atlas/index.html',
      },
    ],
  },
  {
    label: '网页与数据',
    children: [
      {
        label: 'URL编解码',
        name: 'urlEncode',
        description: '在线进行 URL 编码和解码，支持 encodeURIComponent 与 encodeURI，适合参数处理、链接调试和表单兼容转换。',
      },
      {
        label: 'UserAgent解析',
        name: 'userAgent',
        description: '在线解析 User-Agent 字符串，识别浏览器、渲染引擎、操作系统、CPU 架构和设备类型等信息。',
      },
      {
        label: 'WHOIS查询',
        name: 'whois',
        description: '在线查询域名 WHOIS 注册信息，查看注册商、注册时间、到期时间和域名状态，适合域名排查与备案前检查。',
      },
      {
        label: '短链接',
        name: 'urls',
        description: '在线创建和管理短链接，将长网址转换为便于分享的短地址，适合链接分发、记录和跳转管理。',
        requiresAuth: true,
      },
      {
        label: '随机数生成',
        name: 'random',
        description: '在线批量生成指定范围内的随机数，可设置数量、小数位和输出格式，适合抽样、测试数据和临时编号。',
      },
      {
        label: '渐变色生成器',
        name: 'gradientColor',
        description: '在线生成和预览 CSS 渐变色，调整颜色与方向并复制样式代码，适合网页背景和界面配色。',
      },
      {
        label: '身份证解析',
        name: 'idChinese',
        description: '在线解析中国居民身份证号码中的地区、出生日期、性别和校验信息，适合格式检查与基础信息识别。',
      },
      {
        label: '这是什么动漫',
        name: 'whatAnimeIsThis',
        description: '在线上传动漫截图并识别可能来源，返回作品名称、集数、时间位置和预览片段，适合查找截图出处。',
      },
      {
        label: 'glTF模型浏览',
        name: '3dView',
        description: '在线预览 glTF/GLB 三维模型，支持文件夹资源加载、轨道控制、动画播放、线框模式和模型统计信息查看。',
      },
    ],
  },
  {
    label: '图像与视频',
    children: [
      {
        label: '极简图床',
        name: 'imgHosting',
        description: '在线上传和管理图片资源，支持配置图床服务、查看图片列表和复制访问地址，适合轻量图片托管。',
      },
      {
        label: '图片加水印',
        name: 'watermark',
        description: '在线为图片添加文字水印，可调整字号、颜色、透明度、角度和间距，适合图片版权标记与批前预览。',
      },
      {
        label: '屏幕录制',
        name: 'screenRecord',
        description: '在线录制屏幕、窗口或浏览器标签页，可配置音频、帧率、分辨率和光标显示，适合演示与问题复现。',
      },
    ],
  },
  {
    label: '系统与运维',
    children: [
      {
        label: 'Linux命令查询',
        name: 'linuxCommand',
        description: '在线查询 Linux 命令说明、参数和使用示例，适合运维排查、脚本编写和命令行学习参考。',
      },
    ],
  },
  {
    label: '生活工具',
    children: [
      {
        label: '房贷计算器',
        name: 'mtqLoans',
        description: '在线计算商业贷款、公积金贷款和组合贷款的还款计划，支持等额本息、等额本金和利息明细估算。',
      },
    ],
  },
  {
    label: '娱乐游戏',
    children: [
      {
        label: '塞尔达荒野之息地图',
        name: 'zeldaBotwMap',
        description: '在线查看塞尔达传说荒野之息地图资源，支持地图浏览和标记参考，适合游戏探索路线规划。',
      },
      {
        label: '2048',
        name: '2048',
        description: '在线游玩 2048 数字合成小游戏，通过方向操作合并相同数字并挑战更高分数，适合休闲练习和打发时间。',
      },
      {
        label: '俄罗斯方块',
        name: 'tetris',
        description: '在线游玩经典俄罗斯方块小游戏，支持键盘和触控操作，自动保存最高分并挑战更高等级。',
      },
      {
        label: '贪吃蛇',
        name: 'snake',
        description: '在线游玩经典贪吃蛇小游戏，控制蛇身吃掉食物并避免撞墙或撞到自己，自动保存最高分。',
      },
      {
        label: '奥利奥生成器',
        name: 'oreooo',
        description: '在线生成自定义奥利奥堆叠图片，通过“奥”“利”“与”组合出趣味文字效果，适合表情图和娱乐分享。',
      },
      {
        label: 'PalWorld服务器设置',
        name: 'palServerSettings',
        description: '在线解析、编辑和生成 PalWorldSettings.ini 服务器配置，支持难度、倍率、掉落、联机和 RCON 等参数调整。',
      },
    ],
  },
]
