;(function () {
  /**
   * 类似路由函数，根据页面的路径执行不同的回调函数
   * @param  {Regexp}   regexp   匹配页面pathname的正则
   * @param  {Function} callback 匹配当前pathname的页面js代码
   */
  function route (regexp, callback) {
    var path = window.location.pathname;
    if (regexp.test(path)) {
      callback();
    }
  }
  //匹配页面pathname的正则表达式
  var regexp = {
    login: /^\/groupon\/app\/login\/?$/,
  };
  
  route(regexp.login, function () {
    var btnLogin = $('.j-login');
    var btnDLogin = $('.j-device-login');
    var target = (location.search.match(/fromUri=([^&]+)/) || [,'/'])[1];
    var cookies = xm.plusMember.parseCookie();
    var hasToken = cookies[config.TOKEN_LABEL] || cookies[config.DEVICE_TOKEN_LABEL];
    function login() {
      // 当客户端处于登录状态时回调才会执行
      // before version 6.3.0 客户端不校验token有效性直接回调
      // after  version 6.3.0 客户端校验token有效性 1.有效直接回调 2.无效客户端登出
      ya.login(function (res) {
        // iOS下，进入页面时页面有token则认为当前用户被劫持了(根据iOS app更新率 忽略情况1)
        //   1. app version 小于 6.3.0 并且 token过期
        //   2. 运营商劫持 token没有发送到后端
        if(xm.plusMember.isIOS && hasToken) {
          sessionStorage.setItem('hyjack_flag', 1);
        }
        document.cookie = config.TOKEN_LABEL+"="+res.uid+"&"+res.token+";path=/;domain=.ximalaya.com";
        location.replace(decodeURIComponent(target));
      });
    }

    function dLogin() {
      ya.dLogin(function (res) {
        document.cookie = config.DEVICE_TOKEN_LABEL+"="+res.uid+"&"+res.token+";path=/;domain=.ximalaya.com";
        location.replace(decodeURIComponent(target));
      });
    }

    btnLogin.click(login);
    btnDLogin.click(function() {
      new Popup().open({
        content: ''+
          '<h2 class="title">设备登陆须知</h2>'+
          '<p class="tit">使用设备登录后所充值的喜点、购买的内容，仅限登录本设备时可用。</p>'+
          '<p class="tit">如您更换设备或者使用已有账号登录，则无法使用在设备登录时使用时所充值的喜点和购买的内容。</p>'+
          '<div class="btn-panel">'+
          '  <a data-role="cancel">继续设备登录</a>'+
          '  <a data-role="ok">改用账号登录</a>'+
          '</div>',
        extraCls: 'pop-login',
        closeable: false,
        ok: function() {
          login();
        },
        cancel: function() {
          dLogin();
        },
      });
    });

    if(cookies[config.TOKEN_LABEL]) {
      btnLogin.click();
    }
    else if(cookies[config.DEVICE_TOKEN_LABEL]) {
      location.replace(decodeURIComponent(target));
    }

    var container = document.createElement('div');
    var bodyBgColor = getComputedStyle(document.body)['background-color'];
    container.style.color = bodyBgColor;
    container.style.position = 'absolute';
    container.style.top = 0;
    container.style.zIndex = -1;
    document.body.appendChild(container);
    function printLog(log) {
      log === '' && (log = 'empty');
      var p = document.createElement('p');
      p.appendChild(document.createTextNode(log));
      container.appendChild(p);
    }

    printLog(this === top);
    printLog(this.location.href);
    printLog(this.document.cookie);
  });
})();
