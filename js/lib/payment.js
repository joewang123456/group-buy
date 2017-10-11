;(function() {

  var channelTypeMap = {
    android: {
      xipoint: 8,
      weixin: 7,
    },
    ios: {
      xipoint: 9,
      weixin: 6
    },
  }

  var env = xm && xm.env
  var constant = xm && xm.const
  var helper = xm && xm.helper

  if(!env || !constant || !helper) {
    throw new Error('Required `js/lib/helper.js` is not correct loaded')
  }

  function Payment(opts) {
    var system = env.isInAndroid ? 'android' : env.isInIOS ? 'ios' : ''
    var paymentType = env.isInNative ? 'xipoint' : env.isInWeixin ? 'weixin' : ''
  
    if(system && paymentType) {
      this.channelTypeId = channelTypeMap[system][paymentType]
    }
    else {
      throw new Error('Error `system: ' + system + '` or `paymentType: ' + paymentType + '`')
    }
  }

  Payment.prototype = {
    constructor: Payment,
    /*
     * @param opts
     *    @opts.productItemId
     *    @opts.grouponOrderId
     *    @opts.success
     *    @opts.failed
     */
    pay: function(opts) {
      if(opts.productItemId == null || opts.grouponOrderId == null) {
        throw new Error('`productItemId` and `grouponOrderId` are both required')
      }

      var _this = this;
      this.opts = $.extend({}, opts)

      $.ajax({
        url: constant.paths.placeorder,
        data: {
          channelTypeId: _this.channelTypeId,
          productItemId: _this.opts.productItemId,
          grouponOrderId: _this.opts.grouponOrderId,
        },
        success: function(res) {
          _this._pay()
        },
        error: function() {
          $.isFunction(_this.opts.failed) && _this.opts.failed(arguments)
        },
      })
    },
    recharge: function(amount) {
      if(env.isInNative) {
        var clear = helper.visibilityChangeHandler(function(state) {
          if(state === 'visible') {
            $.isFunction(clear) && clear();
            location.reload();
          }
        }, true);

        location.href = 'iting://open?msg_type=45&_ka=1&productId=' + amount + '&amount=' + amount
      }
      else {
        xm.util.toast('当前环境暂不支持充值，请在App内完成充值');
      }
    },
    _pay: function(paymentInfo) {
      switch(paymentType) {
        case 'weixin':
          this._wxPay(paymentInfo)
          break
        case 'xipoint':
          this._xiPay(paymentInfo)
          break;
        default:
          throw new Error('Error `paymentType: ' + paymentType + '`')
      }
    },
    _wxPay: function(paymentInfo) {
      var _this = this, orderInfo;
      orderInfo = paymentInfo.params;
      wx.chooseWXPay({
        timestamp: orderInfo.timeStamp,
        nonceStr: orderInfo.nonceStr,
        package: orderInfo.package,
        signType: orderInfo.signType,
        paySign: orderInfo.paySign,
        success: function(res) {
          if (res.errMsg == "chooseWXPay:ok") {
            $.isFunction(_this.opts.success) && _this.opts.success(paymentInfo)
          }
          else {
            $.isFunction(_this.opts.failed) && _this.opts.failed(paymentInfo)
          }
          return false;
        }
      });
    },
    _xiPay: function(paymentInfo) {
      $.isFunction(this.opts.success) && this.opts.success(paymentInfo)
    },
  }

  xm || (xm = {})
  xm.payment = new Payment()
})();