; (function () {
  var channelTypeMap = {
    android: {
      xipoint: 8,
      weixin: 7,
    },
    ios: {
      xipoint: 9,
      weixin: 6,
    },
  }

  var env = xm && xm.env
  var constant = xm && xm.const
  var helper = xm && xm.helper

  if (!env || !constant || !helper) {
    throw new Error('Required `js/lib/helper.js` is not correct loaded')
  }

  function Payment(opts) {
    var system = env.isInAndroid ? 'android' : env.isInIOS ? 'ios' : ''
    var paymentType = env.isInNative
      ? 'xipoint'
      : env.isInWeiXin ? 'weixin' : ''

    if (system && paymentType) {
      this.channelTypeId = channelTypeMap[system][paymentType]
      this.paymentType = paymentType
    } else {
      throw new Error(
        'Error `system: ' + system + '` or `paymentType: ' + paymentType + '`'
      )
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
    pay: function (opts) {
      if (opts.productItemId == null || opts.grouponOrderId == null) {
        throw new Error(
          '`productItemId` and `grouponOrderId` are both required'
        )
      }

      var _this = this
      this.opts = $.extend({}, opts)

      $.ajax({
        url: constant.paths.placeorder,
        type: 'post',
        data: {
          channelTypeId: _this.channelTypeId,
          productItemId: _this.opts.productItemId,
          grouponOrderId: _this.opts.grouponOrderId,
        },
        success: function (res) {
          if (res.ret == 0) {
            _this._pay(res.data);
          } else {
            $.isFunction(_this.opts.failed) && _this.opts.failed(arguments)
          }
        },
        error: function (xhr) {
          // 600 需要充值  611 拼团已结束  612重复下单
          // if( xhr.status == 600 || xhr.status == 611 || xhr.status == 612){
          var msg = '';
          try {
            msg = JSON.parse(xhr.responseText).msg;
          }
          catch (e) {
            msg = '下单失败，请稍后再试';
          }
          Pending.hide();
          xm.util.toast(msg);
          setTimeout(function () {
            location.reload();
          }, 1000)
          // }
        },
      })
    },
    recharge: function (amount) {
      if (env.isInNative) {
        var clear = helper.visibilityChangeHandler(function (state) {
          if (state === 'visible') {
            $.isFunction(clear) && clear()
            location.reload()
          }
        }, true)

        location.href =
          'iting://open?msg_type=45&_ka=1&productId=' +
          amount +
          '&amount=' +
          amount
      } else {
        xm.util.toast('当前环境暂不支持充值，请在App内完成充值')
      }
    },
    _pay: function (paymentInfo) {
      switch (this.paymentType) {
        case 'weixin':
          this._wxPay(paymentInfo)
          break
        case 'xipoint':
          this._xiPay(paymentInfo)
          break
        default:
          throw new Error('Error `paymentType: ' + this.paymentType + '`')
      }
    },
    _wxPay: function (paymentInfo) {
      var _this = this,
        orderInfo
      orderInfo = paymentInfo.params
      wx.chooseWXPay({
        timestamp: orderInfo.timeStamp,
        nonceStr: orderInfo.nonceStr,
        package: orderInfo.package,
        signType: orderInfo.signType,
        paySign: orderInfo.paySign,
        success: function (res) {
          if (res.errMsg == 'chooseWXPay:ok') {
            _this.orderStatus()
          } else {
            $.isFunction(_this.opts.failed) && _this.opts.failed(paymentInfo)
          }
          return false
        },
        cancel: function () {
          $.isFunction(_this.opts.failed) && _this.opts.failed(paymentInfo)
        }
      })
    },
    _xiPay: function (paymentInfo) {
      this.orderStatus()
    },
    orderStatus: function () {
      var url = helper.tmpl(constant.paths.orderstatus, {
        productItemId: this.opts.productItemId,
        timestamp: new Date().getTime()
      })
      var _this = this
      _this.orderSuccess = false
      var index = 1
      var timer = setInterval(function () {
        $.ajax({
          url: url + +new Date(),
          data: {
            grouponOrderId: _this.opts.grouponOrderId,
          },
          success: function (res) {
            var ret = res.ret
            var data = res.data
            if (ret === 0 && data.status === 200) {
              clearInterval(timer)
              _this.orderSuccess = true
              $.isFunction(_this.opts.success) && _this.opts.success(data.grouponOrderId)
            } else if (data.status === 300) {
              clearInterval(timer)
              location.href = helper.tmpl(constant.paths.joinfail, {
                grouponOrderId: _this.opts.grouponOrderId
              })
            }
          },
          complete: function (xhr, status) {
            if (_this.orderSuccess || index++ > 5) {
              clearInterval(timer)
              _this.orderSuccess === false && $.isFunction(_this.opts.failed) && _this.opts.failed()
            }
          },
        })
      }, 1e3)
    },
  }

  xm || (xm = {})
  xm.payment = new Payment()
})()
