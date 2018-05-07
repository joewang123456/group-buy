;(function () {
    var nativeCallBack = {},
        callbackIndex = 0,
        ua = navigator.userAgent.toLowerCase(),
        iframe;

    var deviceType = !!window.jscall ? 'android':'ios';

    function parse(jsonStr){
        return JSON.parse(jsonStr);
    };

    function str(obj){
        return JSON.stringify(obj);
    };

    function encode(str){
        return encodeURIComponent(str);
    };

    function decode(str){
        return decodeURIComponent(str);
    };

    function encodeStr(obj){
        return encode(str(obj));
    };

    function parseDecode(jsonStr){
        return parse(decode(jsonStr));
    };

    function merge(src,obj){

        for(var i in obj){
            src[i] = obj[i];
        }
        console.log(src);
        return src;
    }

    function getArgs(fnArgs, offset) {
        return Array.prototype.slice.call(fnArgs, offset || 0);
    }

    function wrapperFn(fn){
        if(typeof fn == 'function'){
            return
        }
    }

    function defineProperty(obj,propName,getter){
        Object.defineProperty(obj,propName,{
            get:getter
        });
    }

    function registCallback(callback,keepCb){
        callbackIndex++;
        callbackName = 'cb_' + callbackIndex;
        nativeCallBack[callbackName] = function () {
            var res = getArgs(arguments);
            callback.apply(ya, res);
            if(!keepCb){
                nativeCallBack[callbackName] = null;
            }
        };
        return callbackName;
    }

    function loadUrl(url){
        //ios8不能直接执行window.location，需要要通过iframe
        if (iframe) {
            document.documentElement.removeChild(iframe);
        }
        iframe = document.createElement('iframe');
        iframe.setAttribute('width', 0);
        iframe.style.display = 'none';
        iframe.setAttribute('src', url);
        document.documentElement.appendChild(iframe);
        setTimeout(function(){
            iframe && document.documentElement.removeChild(iframe);
            iframe = null;
        },0);
        //window.location = encodeURI(scheme);
    }

    function gapCall(functionName) {
        if(!/iting/i.test(ua)){
            return;
        }
        var args = getArgs(arguments, 1);
        var callback = args[args.length - 1];
        var needCallback = true;
        var isIos = deviceType == 'ios';

        var isAsync = (functionName.indexOf('_async') !== -1);//是否是异步函数
        var keepCb = (functionName.indexOf('_long') !== -1);//是否需要保留函数
        functionName = functionName.replace(/(_async|_long)/g, '');

        //整理参数
        if (typeof callback != 'function') {
            needCallback = false;
            if (callback === undefined) {
                args = args.slice(0, args.length - 1);
            }
        } else {
            args = args.slice(0, args.length - 1);
        }

        //异步回调
        if (isIos || isAsync) {
            var callbackName = 'null';
            if (needCallback) {
                callbackName = registCallback(callback,keepCb);
            }
        }

        //执行方法
        if (isIos) {
            var scheme = 'jscall://' + functionName + '&' + callbackName;
            try{
                // ios10+ 使用新协议
                if(ua.match(/iphone os (\d+\_\d+(\_\d+)*)/)[1].split('_')[0] >= 10){
                    scheme = scheme.replace(/^(jscall:\/\/)/,'$1xmly?')
                }
            }catch(e){}

            if (args) {
                //scheme += '&';
                for (var i in args) {
                    scheme += '&' + args[i];
                }
            }

            loadUrl(scheme);

        } else {
            var nativeFn = window.jscall[functionName];
            if (isAsync) {
                args.unshift(callbackName);
                nativeFn.apply(window.jscall, args);
            } else {
                var res = nativeFn.apply(window.jscall, args);
                if (needCallback) {
                    callback(res);
                }
            }
        }
    }

    var ya = {
        _schemeList: {
            'default': 'iting',
            'com.gemd.iting': 'itinggemd',
            'com.qndzq.book': 'itingqndzq',
            'com.jima.yijingtingshu': 'itingjima'
        },
        isAndroid:deviceType == 'android',
        isIos:deviceType == 'ios',
        /**
         * [setScheme ios会调用设置对应的scheme]
         * @date   2017-01-19
         */
        setScheme: function (impl) {
            if (this._schemeList.hasOwnProperty(impl)) {
                this.device.scheme = this._schemeList[impl];
            } else {
                this.device.scheme = this._schemeList['default'];
            }
        },
        device: {
            name: '', // 设备名:'android','ios'
            version: '', // app版本
            platformVersion: '', // 操作系统的版本
            uuid: '', // 唯一设备标示
            uid: '',// 用户id
            token: '',
            scheme: 'iting'
        },
        registModule:function(moduleName, module){
            var self = this;

            defineProperty(module, '$ref', function() {
                return self;
            });

            defineProperty(self, moduleName, function() {
                return module;
            });
        },
        toast: function (msg) {
            gapCall('notificationToast', encode(msg));
        },
        copy: function (msg) {
            gapCall('copy', encode(msg));
        },
        /**
         * 关闭webview
         */
        closeWebView:function(){
            gapCall('closeWebView');
        },
        /**
         * [默认浏览器打开自定的url]
         * @author jason.chen
         * @date   2017-01-20
         */
        browse:function(url){
            gapCall('browse', encode(url));
        },
        /**
         * [登录]
         * @author jason.chen
         * @date   2016-08-19
         * @param  {Function} cb   [登录后的回调]
         */
        login:function(cb){
            gapCall('login_async',function(data){
                cb && cb.call(this,parse(data));
            });
        },
        /**
         * [设备登录]
         * @author jason.chen
         * @date   2016-08-19
         * @param  {Function} cb   [登录后的回调]
         */
        dLogin:function(cb){
            gapCall('dLogin_async',function(data){
                cb && cb.call(this,parse(data));
            });
        },
        getNetworkStatus:function(cb){
            gapCall('getNetworkStatus_async',function(data){
                cb && cb.call(this,parse(data));
            });
        },
        getVersion:function(){
            return (this.device.version || ua.match(/(kdtunion_iting|iting)\/(\d(\.\d{1,3}){2,3})/)[2]);
        },
        /**
         * 判断号比较  4.1.12    4.1.8  (传入的值 > 当前版本 返回 1)
         */
        compareVersion: function(vStr,appVersion) {
            var curArr = (appVersion || this.getVersion()).split('.'),
                destArr = (vStr || '0.0.0').split('.'),
                i =  0,
                result = null,
                comp = function(str1, str2) {
                    var v1 = parseInt(str1, 10),
                        v2 = parseInt(str2, 10);
                    if (v1 === v2) {
                        return 0;
                    } else {
                        return v1 > v2 ? 1 : -1;
                    }
                },
                matchs = null;

            (function(arr1, arr2) {
                var t1 = arr1[i],
                    t2 = arr2[i];

                if (!t2 && t1) {
                    result = 1;
                    return;
                } else if (!t1 && t2) {
                    result = -1;
                    return;
                } else if (t1 && t2) {
                    if (comp(t1, t2) === 0) {
                        result = 0;
                        i++;
                        if (arr2[i] || arr1[i]) {
                            arguments.callee(arr1, arr2);
                        }
                    } else {
                        result = comp(t1, t2);
                        return;
                    }
                } else {
                    result = 0;
                    return;
                }
            })(destArr, curArr);
            return result;
        },
        /**
         *
         * @author jason.chen
         * @date   2017-01-19
         * @param  {[type]}   url [description]
         * @return {[type]}       [description]
         */
        ready: function (callbback) {
            var self = this;
            gapCall('appReady', function (obj) {
                var devInfo = self.device;

                obj = JSON.parse(obj);
                devInfo.platformVersion = obj.platformVersion;
                devInfo.name = window.jscall ? 'android' : 'ios';
                devInfo.platform = obj.platform; //ios平台下可能存在多个值，ios｜iphone OS
                devInfo.version = obj.version;
                devInfo.uuid = obj.deviceId;
                devInfo.uid = obj.uid;
                devInfo.token = obj.token;
                devInfo.idfa = obj.idfa || '';   // 广告用的唯一标识符(主要针对ios)
                callbback.call(self,devInfo);
            });
        },
        /**
         * 配置webview组件 deprecated
         * @author jason.chen
         * @date   2016-12-22
         */
        config:function(param,cb){
            gapCall('config_async',encodeStr(this._wrapFn(param)),function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        /**
         * 配置webview 右上角分享按钮、设置/取消
         * @author jason.chen
         * @date   2017-04-19
         */
        onShare:function(cb){
            if(cb === false){
                // 取消分享按钮
                gapCall('onShare');
            }else{
                gapCall('onShare_async',function () {
                    cb && cb.call(this);
                });
            }
        },
        /**
         * 获取第三方授权信息
         * @author jason.chen on 2017-08-22
         * @param  {[type]}   param [type可能值 sina(实现)  qq  weixin  ]
         * @param  {Function} cb    [description]
         * @return {[type]}         [description]
         */
        get3rdAuthInfo:function(param,cb){
            if(!param.type){
                return
            }
            gapCall('get3rdAuthInfo_async',encodeStr(param), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        /**
         * 调app分享面板
         * @author jason.chen
         * @date   2016-12-22
         */
        share:function(param,cb){
            gapCall('share_async',encodeStr(param), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        multiShare:function(param,cb){
            gapCall('multiShare_async',encodeStr(param), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        /**
         * 转化方法 给app用
         */
        _wrapFn:function(fn,flag){
            var keepCb = true;
            if(typeof flag == 'boolean' && !flag){
                keepCb = false;
            }
            if(typeof fn == 'function'){
                return registCallback(fn,keepCb);
            }else if(typeof fn == 'object'){
                for(var i in fn){
                    fn[i] = this._wrapFn(fn[i],flag);
                }
            }
            return fn;
        },
        /**
         *领券通知
         * @author jason.chen
         * @date   2016-11-02
         */
        notify:function(param){
            gapCall('notifyApp',encodeStr(param));
        },
        /**
         * [获取scheme]
         * @author jason.chen
         * @date   2017-01-20
         */
        getScheme:function(type,obj){
            var protocol = this.device.scheme,
                str = this.paramStr(obj);

            str.length > 0 && (str = '&' + str);
            return protocol + '://open?msg_type='+ type + str ;
        },
        /**
         * [打开指定scheme]
         * @author jason.chen
         * @date   2017-01-20
         */
        open:function(url){
            if(!/:\/\/open/.test(url)){
                url = this.getScheme.apply(this,arguments);
            }
            loadUrl(url);
        },
        /**
         * [对象参数化]
         * @author jason.chen
         * @date   2017-01-20
         */
        paramStr:function(obj){
            var query = '',
                tem = null;

            if(obj){
                for(var i in obj){
                    tem = obj[i];
                    if(tem == null || tem == undefined){
                        continue;
                    }
                    query += ('&'+ encode(i) +'=' + encode(tem));
                }
            }
            return query.length > 0 ? query.substring(1):'';
        },
        cookie:function(name,value,opt){
            if(arguments.length == 0){
                var result = this.getQueryParam(null,document.cookie,';');
                for(var i in result){
                    result[i] = decode(result[i]);
                    try{
                        result[i] = parse(result[i]);
                    }catch(e){}
                }
                return result;
            }else if(arguments.length == 1){
                var val = decode(this.getQueryParam(name,document.cookie,';'));
                try{
                    return parse(val);
                }catch(e){
                    return val;
                }
            }else{
                // 设置cookie
                var d;
                opt = opt || {};
                value == null && (opt.expires = -1);
                typeof value == 'object'  && (value = str(value));
                opt.expires && (d = new Date, d.setTime(d.getTime() + opt.expires * 1000));

                document.cookie = name + "=" + encode(value) + (opt.domain ? "; domain=" + opt.domain : "") + (opt.path ? "; path=" + opt.path : "") + (d ? "; expires=" + d.toUTCString() : "") + (opt.secure ? "; secure" : "");
            }
        },
        getQueryParam:function(k,query,seperator){
            var param = {},
                queryStr = query || window.location.search.substring(1),
                arr = queryStr.split(seperator || '&');

            for(var i in arr){
                var tem = arr[i].match(/^\s*([%\w]+)=(.*)$/);
                try{
                    param[tem[1]] = tem[2];
                }catch(e){}
            }
            return k ? param[k] : param ;
        },
        addExtralParam:function(obj,url){
            var url = url || location.href,
                p = /\?(.[^#]*)/,
                queryStr = '',
                param = {};

            if(queryStr = url.match(p)){
                param = merge(this.getQueryParam(null,queryStr[1]),obj);
                return url.replace(queryStr[1],this.paramStr(param));
            }else{
                // 无参数 无#
                queryStr = this.paramStr(obj);
                if(url.indexOf('#') > -1){
                    return url.replace(/(#.*)$/,'?'+queryStr+'$1');
                }else{
                    return url+'?'+queryStr;
                }
            }
        }
    };

    // 运营活动 √
    ya.registModule('activity',{
        shareSound: function (activityId, soundId, callback) {
            gapCall('appShareSound', activityId, soundId, callback);
        },
        shareActivity: function (activityId, callback) {
            gapCall('appShareActivity', activityId, callback);
        },
        shareVote: function (activityId, soundId, callback) {
            gapCall('appShareVote', activityId, soundId, callback);
        }
    });

    ya.registModule('audio',{
        play: function (soundId, cb) {
            gapCall('audioPlay', soundId, function(){
                cb && cb.call(ya);
            });
        },
        pause: function (cb) {
            gapCall('audioPause', function(){
                cb && cb.call(ya);
            });
        },
        /**
         * [定位播放] 2015.4.25 待实现
         * @param  {[type]}   param [description]
         * @param  {Function} cb    [description]
         * @return {[type]}         [description]
         */
        playHead: function(param,cb){
            gapCall('playHead_async',encodeStr(param), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        }
    });

    // 阿里百川 对接电商sdk
    ya.registModule('baichuan',{
        jump:function(params, cb){
            gapCall('bcJump_async',encodeStr(params), cb);
        }
    });

    // 优惠券相关
    ya.registModule('coupon',{
        /**
         * 使用优惠券
         * @author jason.chen
         * @date   2016-11-02
         */
        useCoupon:function(couponId){
            gapCall('useCoupon',couponId);
        },
        /**
         * app分享领券 H5领券
         * @author jason.chen
         * @date   2016-11-02
         */
        shareForCoupon:function(param,cb){
            gapCall('shareForCoupon_async',encodeStr(param), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        }
    });

    // 图片相关
    ya.registModule('image',{
        /**
         * [裁剪图片 deprecated on 2017.1.22]
         * @author jason.chen
         * @param  {[type]}   source   zoneLogo
         * @param  {[type]}   rect     0,0,100,100
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        captureImage: function (source, rect, callback) {
            gapCall('captureImage_async', source, rect, callback);
        },
        chooseImage: function (param, callback) {
            gapCall('chooseImage_async', encodeStr(param), function(res){
                cb && cb.call(this,parse(data));
            });
        },
        /**
        * 保存图片到本地
        * @author jason.chen
        * @date   2016-09-19
        */
        saveImage:function(url){
            gapCall('saveImage',encode(url));
        }
    });

    // 支付相关
    ya.registModule('payment',{
        /**
         * 获取支付方式 alipay / wxpay
         */
        getChannels:function(cb){
            gapCall('getSupportPayType', function (data) {
                cb && cb.call(ya,parse(data));
            });
        },
        pay:function(param,type,callback){
            var cb = callback,
                channel = 'xmpay';

            if(typeof type == 'string'){
                channel = type;
            }else{
                cb = type;
            }

            if(channel == 'xmpay'){
                this._xmPay(param,cb);
            }else if(channel == 'applePay'){
                this._applePay(param,cb);
            }else{
                this._thirdPay(param,cb);
            }
        },
        /**
         * 调用app sdk进入支付流程
         */
        _thirdPay:function(param,cb){
            var ref = this.$ref,
                fn = 'appPay';
                // appPay

            if(ref.compareVersion('5.4.75') <= 0){
                fn += '_async';
            }
            gapCall(fn,encodeStr(param), function (data) {
                var res = parseDecode(data);
                res.data = param;
                cb && cb.call(ya,res);
            });
        },
        /**
         * [xmPay 喜点支付]
         * @author jason.chen
         * @date   2017-01-20
         * @param  {[type]}   payInfo [description]
         */
        _xmPay:function(payInfo,cb){
            gapCall('xmPay_async', encode(payInfo),function (res) {
                cb && cb.call(ya,decode(res));
            });
        },
        /**
         * [applePay 苹果支付]
         * @author jason.chen
         * @date   2017-05-05
         * @param  {[type]}   payInfo [description]
         */
        _applePay:function(payInfo,cb){
            gapCall('applePay_async', encode(payInfo),function (res) {
                cb && cb.call(ya,decode(res));
            });
        },
        /**
         * deprecated 支付完成
         */
        payFinished:function(param){
            if(param){
                if(this.$ref.compareVersion('4.3.8') < 0){
                    gapCall('payFinished',str(param));
                }else{
                    // 兼容老版本
                    gapCall('payFinished');
                }
            }else{
                // 兼容老版本
                gapCall('payFinished');
            }
        }
    });

    // 游戏相关
    ya.registModule('game',{
        getApkStatus:function(appInfos,cb){
            gapCall('getApkStatus_async_long', encodeStr(appInfos),function (arr) {
                cb && cb.call(this,parseDecode(arr));
            });
        },
        downloadApk:function(appInfo,cb){
            gapCall('downloadApk_async',encodeStr(appInfo), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        installApk:function(appInfo,cb){
            gapCall('installApk_async',encodeStr(appInfo), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        launchApk:function(appInfo,cb){
            gapCall('launchApk_async',encodeStr(appInfo), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        pauseDownLoad:function(appInfo,cb){
            gapCall('pauseDownLoad_async',encodeStr(appInfo), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        },
        resumeDownload:function(appInfo,cb){
            gapCall('resumeDownload_async',encodeStr(appInfo), function (obj) {
                cb && cb.call(this,parseDecode(obj));
            });
        }
    });

    // 录音相关
    ya.registModule('recorder',{
        recorderEvents:{},
        // a+ 添加录音文本
        addRecordText: function(info,cb) {
            gapCall('addRecordText_async',encodeStr(info), function () {
                cb && cb.apply(this,arguments);
            });
        },
        startRecord: function(cb) {
            gapCall('startRecord_async', function () {
                cb && cb.apply(this,arguments);
            });
        },
        pauseRecord: function(cb) {
            gapCall('pauseRecord_async', function () {
                cb && cb.apply(this,arguments);
            });
        },
        resumeRecord: function(id, cb) {
            gapCall('resumeRecord_async', id,function () {
                cb && cb.apply(this,arguments);
            });
        },
        stopRecord: function(cb) {
            gapCall('stopRecord_async', function () {
                cb && cb.apply(this,arguments);
            });
            // var localId = res.localId;
        },
        playVoice: function(id, cb) {
            gapCall('playVoice_async',id, function () {
                cb && cb.apply(this,arguments);
            });
            // var localId = res.localId;
            // cb(res)
        },
        pauseVoice: function(id, cb) {
            gapCall('pauseVoice_async',id, function () {
                cb && cb.apply(this,arguments);
            });
            // 需要停止的音频的本地ID，由stopRecord接口获得
        },
        resumeVoice: function(id, cb) {
            gapCall('resumeVoice_async',id, function () {
                cb && cb.apply(this,arguments);
            });
            // 需要停止的音频的本地ID，由stopRecord接口获得
        },
        stopVoice: function(id, cb) {
            gapCall('stopVoice_async',id, function () {
                cb && cb.apply(this,arguments);
            });
            // 需要停止的音频的本地ID，由stopRecord接口获得
        },
        getUploadProgress: function(id, cb) {
            gapCall('getUploadProgress_async',id, function () {
                cb && cb.apply(this,arguments);
            });
            // 需要停止的音频的本地ID，由stopRecord接口获得
        },
        uploadVoice: function(id,url,showProgress, cb) {
             gapCall('uploadVoice_async',id,url,showProgress, function () {
                cb && cb.apply(this,arguments);
            });
        },
        _addEvent:function(event,fn){
            var self = this;
            self.recorderEvents[event] = fn;
            defineProperty(this, event, function() {
                return self.recorderEvents[event].bind(self.$ref);
            });
        },
        bind: function(param,fn) {
            if (typeof param == 'object') {
                for (i in param) {
                    this._addEvent(i,param[i]);
                }
            }else if(typeof param == 'string'){
                this._addEvent(param,fn);
            }
        }
    });


    var nativeCall = {
        onAudioStatusChange: function (status) {
            var detail = JSON.parse(status);
            var event;
            if (document.createEvent) {
                event = document.createEvent('CustomEvent');
                event.initCustomEvent('audioStatusChange', true, true, detail);
                document.dispatchEvent(event);
            } else {
                event = document.createEventObject();
                event.eventType = 'audioStatusChange';
                event.detail = detail;
                document.fireEvent('on' + event.eventType, event);
            }
        },
        getTitle: function () {
            var el = document.getElementsByTagName('title')[0];
            var title = el.innerText;
            if (window.jscall && window.jscall.getTitle) {
                window.jscall.getTitle(title);
            } else {
                return title;
            }
        },
        redirectTo:function (url) {
            window.location.href = url;
        },
        resizeWin:function(){
            window.resizeBy(0,0);
        },
        /**
         * [给客户端提供操作cookie的接口]
         * @author jason.chen
         * @date   2016-03-21
         */
        getCookie:function(name){
            var res = ya.cookie(name) || '',
                obj = {};

            obj[name] = res;

            if (window.jscall && window.jscall.passCookie) {
                window.jscall.passCookie(encodeStr(obj));
            } else {
                return res;
            }
        },
        /**
         * deprecated on 2017.1.22 (app >= 5.4.75)支付成功跳转 >>打赏
         * params  : { 'status':true,'orderId':12345}
         */
        paySuccess:function(params){
            var p = parse(params),
                fromUrl = ya.getQueryParam('fromUrl');

            fromUrl && (window.config.paySuccessPage = decode(fromUrl));

            if(p.status){
                window.location.href = (window.config.paySuccessPage || '/ting-shang-mobile-web/v1/user/order') +'?orderNo=' + p.orderId +'&device=' + ya.device.name +'&version=' + ya.device.version;
            }else{
                ya.toast('支付失败');
            }
            return '';
        }
    };

    // 录音回调事件
    if(ya.recorder){
        defineProperty(nativeCall, 'recorder', function() {
            return ya.recorder;
        });
    }

    window.ya = ya;
    window.nativeCallBack = nativeCallBack;
    window.nativeCall = nativeCall;
})();
