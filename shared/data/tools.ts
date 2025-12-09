import type { OriginToolMenu } from '#shared/types/tool'

export const tools: OriginToolMenu[] = [
  {
    label: 'JSON工具',
    icon: '',
    children: [
      {
        label: 'JSON编辑器',
        name: '/jsonEditor',
      },
      {
        label: 'GeoJSON.io',
        name: '/geoJson',
      },
    ],
  },
  {
    label: '编辑器',
    icon: 'i-icon-park-outline-editor',
    children: [
      {
        label: 'TinyEditor',
        name: '/tinyEditor',
      },
      {
        label: '简易白板',
        name: '/tlDraw',
      },
      {
        label: '在线流程图',
        name: 'https://app.diagrams.net/',
      },
    ],
  },
  {
    label: 'GIS工具',
    icon: 'i-icon-park-solid-map-draw',
    children: [
      {
        label: '经纬度查询',
        name: '/latLng',
      },
      {
        label: '切片方案计算',
        name: '/lodCalculator',
      },
      {
        label: '行政区数据',
        name: 'https://datav.aliyun.com/tools/atlas/index.html',
      },
    ],
  },
  {
    label: '加密工具',
    icon: 'i-icon-park-solid-file-lock',
    children: [
      {
        label: '文本HASH',
        name: '/hashText',
      },
      {
        label: '文件HASH',
        name: '/hashFile',
      },
      {
        label: '在线JWT解密',
        name: '/jwt',
      },
      {
        label: 'GeoHash编解码',
        name: '/geohash',
      },
      {
        label: 'UUID生成器',
        name: '/uuid',
      },
    ],
  },
  {
    label: '转换工具',
    icon: 'i-icon-park-outline-transform',
    children: [
      {
        label: '颜色转换器',
        name: '/colorTransform',
      },
      {
        label: 'Base64字符串编解码',
        name: '/base64',
      },
      {
        label: 'Base64转文件',
        name: '/base64ToFile',
      },
      {
        label: 'Base64图片编码',
        name: '/imageBase64',
      },
      {
        label: '二维码生成/识别',
        name: '/qrcode',
      },
      {
        label: '哔哩哔哩AV、BV号转换',
        name: '/bilibiliBv2av',
      },
      {
        label: '数字中文转换',
        name: '/nzh',
      },
      {
        label: '亲戚关系计算器',
        name: '/relationship',
      },
    ],
  },
  {
    label: '网页工具',
    icon: 'i-icon-park-outline-browser-chrome',
    children: [
      {
        label: 'URL编解码',
        name: '/urlEncode',
      },
      {
        label: 'UserAgent解析',
        name: '/userAgent',
      },
      {
        label: 'WHOIS查询',
        name: '/whois',
      },
      {
        label: '随机数生成',
        name: '/random',
      },
      {
        label: '渐变色生成器',
        name: '/gradientColor',
      },
    ],
  },
  {
    label: '图像和视频',
    icon: 'i-icon-park-solid-picture-one',
    children: [
      {
        label: '极简图床',
        name: '/imgHosting',
      },
      {
        label: '图片加水印',
        name: '/watermark',
      },
      {
        label: '屏幕录制',
        name: '/screenRecord',
      },
    ],
  },
  {
    label: '开发工具',
    icon: 'i-icon-park-outline-code',
    children: [
      {
        label: 'CSS格式化',
        name: '/cssFormatter',
      },
      {
        label: 'XML格式化',
        name: '/xmlEditor',
      },
      {
        label: '时间计算',
        name: '/timeCompute',
      },
      {
        label: '在线ASCII码对照表',
        name: '/ascii',
      },
      {
        label: '查看网页源码',
        name: '/viewSourceCode',
      },
      {
        label: '正则大全',
        name: '/anyRule',
      },
      {
        label: '前端CDN搜索',
        name: '/cdnQuery',
      },
      {
        label: '中国色',
        name: '/chineseColor',
      },
      {
        label: '资源包',
        name: 'https://libview.iszy.xyz',
      },
    ],
  },
  {
    label: '数据工具',
    icon: 'i-icon-park-outline-data-user',
    children: [
      {
        label: '身份证解析',
        name: '/idChinese',
      },
      {
        label: 'glTF模型浏览',
        name: '/3dView',
      },
      {
        label: '这是什么动漫',
        name: '/whatAnimeIsThis',
      },
    ],
  },
  {
    label: '运维',
    icon: 'i-icon-park-outline-computer',
    children: [
      {
        label: 'WebSSH',
        name: '/webssh',
      },
      {
        label: 'Linux命令查询',
        name: '/linuxCommand',
      },
    ],
  },
  {
    label: '理财',
    icon: 'i-icon-park-solid-financing-one',
    children: [
      {
        label: '多次提前还贷计算器',
        name: '/mtqLoans',
      },
      {
        label: '基金股票信息查询',
        name: 'http://www.zodiacn.ltd',
      },
    ],
  },
  {
    label: '游戏',
    icon: 'i-icon-park-solid-game',
    children: [
      {
        label: '塞尔达荒野之息地图',
        name: '/zeldaBotwMap',
      },
      {
        label: '2048',
        name: '/2048',
      },
      {
        label: '俄罗斯方块',
        name: '/tetris',
      },
      {
        label: '奥利奥生成器',
        name: '/oreooo',
      },
      {
        label: 'PalWorld服务器设置',
        name: '/palServerSettings',
      },
    ],
  },
  {
    label: '其他',
    icon: 'i-icon-park-solid-all-application',
    children: [
      {
        label: 'Chromium下载',
        name: 'https://chromium.cypress.io/',
      },
      {
        label: '淘宝优惠券精选',
        name: 'https://shop.iszy.xyz',
      },
    ],
  },
]
