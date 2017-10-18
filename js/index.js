$(function(){
    
    var constant = xm && xm.const;
    var helper = xm && xm.helper;

    var regexp = {
        launch: /^\/groupon\/guidance\/item\/\d+/,        
        detail: /\/(detail|join)/,
        prelaunch: /\/recommendation/,
        myGroup: /\/mygroupon\/role/,
        confirm: /\/trade\/pay/,
        payFail: /\/failure/
    }

    // launch page
    helper.route(regexp.launch,function(){
        console.log('this is launch');
        var $footer = $('.j-footer');
        var $mask = $('.j-mask');
        var $button = $('.j-pay');
        var paymentParam = $footer.data();

        var url = helper.tmpl(constant.paths.ordercontext, {
            productItemId: paymentParam.productItemId,
            timestamp: new Date().getTime()
        })

        $footer.click(function(){
            $mask.fadeIn(200);
        })
        $mask.on('click', '.close', function() {
            $mask.fadeOut(100);
        }).on('click', '.j-pay', function(){
            Pending.show();            
            var payData = $button.data();
            var needRecharge = payData.needRecharge;
            var rechargeAmount = payData.rechargeAmount;
            if(needRecharge === 'true'){// 充值
                xm.payment.recharge(rechargeAmount);
            }else{// 正常支付
                var opts = $.extend({}, paymentParam)
                opts.success = function(grouponOrderId) {
                    Pending.hide();
                    xm.util.toast('支付成功');
                    setTimeout(function(){
                        location.href = xm.helper.tmpl(xm.const.paths.recommendation, {
                            grouponOrderId: grouponOrderId,
                        })
                    },1000)
                }
                opts.failed = function() {
                    Pending.hide();
                    xm.util.toast('支付失败，请稍后再试');
                }
                xm.payment.pay(opts)
            }

        })
    })

    // detail page
    helper.route(regexp.detail,function(){
        console.log('this is detail')
        var statusId = $('.block').attr('data-groupon-status-id');
        var time = $('.block').attr('data-remain-milliseconds');        
        var $hour = $('.j-hour');
        var $minute = $('.j-minute');
        var $second = $('.j-second');
        // 倒计时
        function countTime(time){
            var timeObj = helper.timeDown(time);
            // 尽量减少DOM操作
            if(timeObj.hour != $hour.text()){
                $hour.text(timeObj.hour);
            }                            
            if(timeObj.minute != $minute.text()){
                $minute.text(timeObj.minute);
            }                            
            if(timeObj.second != $second.text()){
                $second.text(timeObj.second);
            }                            
        }
        if(statusId == 2 || statusId == 3){
            $('.j-time').addClass('grey');
            time = 0;
        }
        countTime(time);
        var timer = setInterval(function(){
            if(time > 0){
                time -= 1000;
                countTime(time);                    
            }else{
                clearInterval(timer);
                if(statusId == 1){
                    location.reload();
                }
            }
        },1000)

        // 分享
        var shareData = {
            title: $('.share').attr('data-share-title'),
            url: $('.share').attr('data-share-url'),
            imgUrl: $('.share').attr('data-share-cover-path'),
            desc: $('.share').attr('data-share-context')
        }
        $('.j-wxgroup').click(function(){
            ya.share({
                channel: 'weixinGroup', // channel可选值为[“qq”, “qzone”, “tSina”, “weixin”, “weixinGroup”, “message”]
                title: shareData.title, // 分享标题
                link: shareData.url, // 分享链接
                imgUrl: shareData.imgUrl, // 分享图标
                desc: shareData.desc
            },function(res){

            });
        })
        $('.j-wxfriend').click(function(){
            ya.share({
                channel: 'weixin', 
                title: shareData.title, 
                link: shareData.url,
                imgUrl: shareData.imgUrl,
                desc: shareData.desc
            },function(res){

            });
        })
        
    })

    // prelaunch page
    helper.route(regexp.prelaunch,function(){
        console.log('this is prelaunch');
        var grouponOrderId = location.href.replace(/[^0-9]/g,'');
        var $textarea = $('.prelaunch textarea');
        var jCount = $('.prelaunch .j-count');            
        $textarea.bind('input propertychange',function(){
            var textLen = $textarea.val().length;      
            if(textLen <= 40){
                jCount.text(textLen);
            }
        })
        var url = helper.tmpl(constant.paths.message, {
            grouponOrderId: grouponOrderId
        })
        $('.btn').on('click',function(){
            $.ajax({
                url: url,
                type: 'post',
                data: {
                    recommendationWord: $textarea.val()
                },
                success: function(res){
                    var ret = res.ret;
                    if(ret === 0){
                        location.href = helper.tmpl(constant.paths.detail, {
                            grouponOrderId: grouponOrderId,
                            timestamp: new Date().getTime()
                        })
                    }
                },
                error: function(){
                    xm.util.toast('接口访问出错，请稍后再试');
                }
                    
            })
        })
    })

    // my-group page
    helper.route(regexp.myGroup,function(){
        console.log('this is mygroup');
        var constant = xm && xm.const;
        var helper = xm && xm.helper;
        var loadMore = xm && xm.util.loadMore;
        var grouponRoleId = location.href.match(/\/role\/[0-9]\//)[0].replace(/[^0-9]/g,'');        

        ;(function(){
            // 点击跳转
            $('.item').click(function(){
                location.href = $(this).data().showGrouponUrl;
            })
            // 切换tab
            $('.tab').on('click','.item',function(){
                var target = $(this);
                if(target.text() === '我发起的拼团'){
                    location.href = helper.tmpl(constant.paths.mygroup, {
                        grouponRoleId: 1,
                        timestamp: new Date().getTime()
                    })
                }else{
                    location.href = helper.tmpl(constant.paths.mygroup, {
                        grouponRoleId: 2,
                        timestamp: new Date().getTime()
                    })
                }
            })
            // 撤销拼团
            if(grouponRoleId === '1'){
                var $masker = $('.masker');
                var $revoke = $('.btn-revoke');
                var cancalUrl;
                $('.btn-revoke').click(function(event){
                    event.stopPropagation();
                    cancalUrl = helper.tmpl(constant.paths.cancel, {
                        grouponOrderId: $(this).data().grouponOrderId
                    })    
                    $masker.removeClass('hidden');
                })
                $masker.on('click','.cancel',function(){
                    $masker.addClass('hidden');
                }).on('click','.confirm',function(){
                    $.ajax({
                        url: cancalUrl,
                        data: {},
                        success: function(res){
                            var ret = res.ret;
                            if(ret === 1){
                                xm.util.toast('你的拼团已撤销');
                                setTimeout(function() {
                                    location.reload();
                                }, 1000);
                            }else{
                                xm.util.toast('撤销失败，请稍后再试');
                            }
                            $masker.addClass('hidden');
                        },
                        error: function(){
                            xm.util.toast('撤销失败，请稍后再试');
                            $masker.addClass('hidden');
                        }
                    })
                })
            }

            // 滚动加载
            var pageNum = 2;
            var url = helper.tmpl(constant.paths.mygrouprecord, {
                grouponRoleId: grouponRoleId,
                timestamp: new Date().getTime()
            })
            var groupList = $('.group-list');
            if(groupList.length > 0){
                var lm = new loadMore(groupList);
                lm.on('xmlm-load-triggered', function(event, elem) {
                    getList(url, pageNum++,lm);
                })
            }

            function getList(url,pageNum,loadMore){
                $.ajax({
                    url: url,
                    data: {
                        pageNum: pageNum
                    },
                    success: function(res){
                        if($('.group-list').attr('data-more') === 'false'){
                            loadMore.clear();
                            return false;
                        }
                        var hasMore = res.hasMore;
                        $('.group-list').attr('data-more',hasMore);
                        var listData = res.data;
                        var listHtml = '';
                        listData.forEach(function(item){
                            var grouponOrderStatus = '';
                            var statusHtml = '';
                            if(item.grouponOrderStatusId == 1){
                                grouponOrderStatus = '拼团中';
                                statusHtml = '<p class="status">还差&nbsp;<span class="theme">'+ item.grouponRemainQuantity +'</span>&nbsp;位小伙伴<a class="btn-revoke"><i class="ic ic-revoke"></i>撤销拼团</a></p>';
                            }else if(item.grouponOrderStatusId == 2){
                                grouponOrderStatus = '拼团成功';
                                statusHtml = '<p class="status theme">'+ grouponOrderStatus +'</p>';
                            }else{
                                grouponOrderStatus = '拼团失败';
                                statusHtml = '<p class="status theme">'+ grouponOrderStatus +'</p>';
                            }
                            listHtml += '<li class="item" data-show-groupon-url="'+ item.showGrouponUrl +'"><a><div class="pic">' +
                                        '<img src="'+ item.coverUrl +'"></div><div class="info">' +
                                        '<h2 class="title elli-multi-2">'+ item.albumTitle +'</h2>' + statusHtml +
                                        '</div></a></li>'
                            $('.group-list').append(listHtml);
                        })
                    },
                    error: function(){
                        xm.util.toast('加载更多失败，请稍后再试');
                    }
                })
            }
            
        })()
    })

    // confirm pay page
    helper.route(regexp.confirm,function(){
        console.log('this is confirm');
        // 微信支付
        $('.btn-pay').click(function(){
            Pending.show();
            var paymentParam = $(this).data();
            var option = $.extend({}, paymentParam);
            option.success = function(grouponOrderId) {
                Pending.hide();
                xm.util.toast('支付成功');
                setTimeout(function(){
                    location.href = xm.helper.tmpl(xm.const.paths.detail, {
                        grouponOrderId: paymentParam.grouponOrderId,
                        timestamp: new Date().getTime()
                    })
                },1000)
            }
            option.failed = function() {
                Pending.hide();
                xm.util.toast('支付失败，请稍后再试');
            }
            xm.payment.pay(option);

        })

    })

    //pay fail page
    helper.route(regexp.payFail,function(){
        console.log('this is payfail');
    })

})


