;(function() {
  xm || (xm = {})

  /*
   * 比较版本号 first > second => 1 first = second => 0 first < second => -1
   * @param [String]  first 第一个版本号
   * @param [String]  second 第二个版本号
   * @param [String]  seprator 版本号分隔符
   * @return [Number] 版本比较结果
   */
  function compVersion(first, second, seprator) {
    var seprator = seprator || '.',
      f = first.split(seprator),
      s = second.split(seprator),
      result = (i = 0)

    while (f[i] && s[i]) {
      if (f[i] > s[i]) {
        result = 1
        break
      } else if (f[i] < s[i]) {
        result = -1
        break
      } else {
        i++
      }
    }

    if (f[i] === undefined && s[i] !== undefined) {
      result = -1
    } else if (f[i] !== undefined && s[i] === undefined) {
      result = 1
    }

    return result
  }

  function parseCookie() {
    var result = {}
    var cookies = document.cookie.split('; ')
    cookies.forEach(function(item) {
      var kvs = item.split('=')
      if (kvs[1]) {
        result[kvs[0]] = kvs[1]
      }
    })
    return result
  }

  /*
   * 获取微信config信息
   * @param [String] authUrl  config的认证地址
   * @param [Array] apilist   config申请的api列表
   */
  function getWxConfig(authUrl, apiList) {
    var url =
      '/x-thirdparty-web/weixinJssdk/config?signatureUrl=' +
      encodeURIComponent(authUrl) +
      '&thirdpartyId=17'
    $.ajax({
      url: url,
      dataType: 'JSON',
      success: function(result) {
        var script = document.createElement('script')

        result.jsApiList = apiList
        script.innerHTML = 'wx.config(' + JSON.stringify(result) + ');'

        document.head.appendChild(script)
      },
    })
  }

  /*
   * 兼容的监听页面可见性(document.visibilityState)的函数
   * @param [Function] handler 页面可见性变化时的回调
   * @param [Boolean] supportNativeWebview 是否需要兼容native的webview
   */
  function visibilityChangeHandler(handler, supportNativeWebview) {
    var visibilityState, visibilityChange, notSupport, listener, timer

    if (typeof document.visibilityState !== 'undefined') {
      visibilityState = 'visibilityState'
      visibilityChange = 'visibilitychange'
    } else if (typeof document.webkitVisibilityState !== 'undefined') {
      visibilityState = 'webkitVisibilityState'
      visibilityChange = 'webkitvisibilitychange'
    } else {
      notSupport = true
    }
    /*
     * 安卓部分机型的 document.visibilityState 一直都是 visible 需要改用 focus & blur 实现
     * 而 App 版本6.3.0.3之前的 webview 从后台进入前台 window.onfocus 不会触发
     */
    if ((supportNativeWebview && isNativeSetFocus) || notSupport) {
      listener = function(event) {
        $.isFunction(handler) &&
          handler(event.type === 'blur' ? 'hidden' : 'visible')
      }
      window.addEventListener('blur', listener, false)
      window.addEventListener('focus', listener, false)
    } else if (supportNativeWebview && isIOS) {
      //for iOS webview doesn't trigger `visibilitychange` event
      var last = document[visibilityState]
      listener = function(visibility) {
        $.isFunction(handler) && handler(visibility)
      }
      timer = setInterval(function() {
        if (document[visibilityState] !== last) {
          last = document[visibilityState]
          listener(last)
        }
      }, 300)
    } else {
      listener = function() {
        $.isFunction(handler) && handler(document[visibilityState])
      }
      window.addEventListener(visibilityChange, listener, false)
    }
    return function cancel() {
      if ((supportNativeWebview && isNativeSetFocus) || notSupport) {
        window.removeEventListener('blur', listener, false)
        window.removeEventListener('focus', listener, false)
      } else if (supportNativeWebview && isIOS) {
        clearInterval(timer)
      } else {
        window.removeEventListener(visibilityChange, listener, false)
      }
    }
  }

  /**
   * 使用数据对象中的字段值替换模板字符串中匹配的字段名 `Hello ${target}` + {target: 'world'} ==> `Hello world`
   * @param  {String} tmpl 包含使用`${`和`}`包裹的占位符的字符串，如`Hello ${target}`
   * @param  {Object} data 数据对象，对象中的字段将替换 tmpl 字符串中的匹配的占位符 如`{target: 'world'}`
   * @return {String}      替换得到的字符串
   */
  function tmpl(tmpl, data, clear) {
    var attr, rAttr, rAny
    for (attr in data) {
      if (data.hasOwnProperty(attr)) {
        rAttr = new RegExp('\\${' + attr + '}')
        tmpl = tmpl.replace(rAttr, data[attr])
      }
    }

    if (clear) {
      rAny = /\${[^}]*}/g
      tmpl = tmpl.replace(rAny, '')
    }

    return tmpl
  }

  var ua = navigator.userAgent

  var env = {
    isInAndroid: /android/i.test(ua),
    isInIOS: /(?:iPad)|(?:iPhone)/i.test(ua),
    isInNative: /iting/i.test(ua),
    isInWeiXin: /MicroMessenger/i.test(ua),
    isSupportWxPay: !!~compVersion(
      (ua.match(/MicroMessenger\/([\d\.]+)/i) || [, '0'])[1],
      '5.0'
    ),
    isInTest: location.origin.indexOf('.test.ximalaya.com') !== -1,
  }
  // 安卓 6.3.0.3版本 webview从后台进入前台会调用requestFocus使webview的window触发focus事件
  var isNativeSetFocus =
    env.isInNative &&
    env.isAndroid &&
    !!~compVersion(ya.getVersion(), '6.3.0.3')

  var constant = {
    tokenLabel: env.isInTest ? '4&_token' : '1&_token',
    mSiteOrigin: 'm' + (env.isInTest ? '.test' : '') + '.ximalaya.com',
    paths: {
      placeorder: '/groupon/placeorder',
      orderstatus: '/groupon/orderstatus/${productItemId}/',
      recommendation: '/groupon/${grouponOrderId}/recommendation',
    },
  }

  if (env.isInWeiXin) {
    var apiList = [
      'checkJsApi',
      'onMenuShareTimeline',
      'onMenuShareAppMessage',
      'onMenuShareQQ',
      'onMenuShareQZone',
      'onMenuShareWeibo',
      'chooseWXPay',
    ]
    getWxConfig(location.href, apiList)
  }

  xm.env = env
  xm.const = constant
  xm.helper = {
    visibilityChangeHandler: visibilityChangeHandler,
    tmpl: tmpl,
  }
})()
