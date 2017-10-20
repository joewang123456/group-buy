$(function(){
    
    var constant = xm && xm.const;
    var helper = xm && xm.helper;
    var env = xm && xm.env;

    var regexp = {
        launch: /^\/groupon\/guidance\/item\/\d+/,        
        detail: /^\/groupon\/\d+\/(detail|join)\/\d+/,
        prelaunch: /^\/groupon\/\d+\/recommendation/,
        myGroup: /^\/groupon\/mygroupon\/role\/\d+/,
        confirm: /^\/trade\/pay\/groupon/,
        payFail: /^\/groupon\/\d+\/join\/failure/
    }

    // launch page
    helper.route(regexp.launch,function(){
        console.log('this is launch');
        var $footer = $('.j-footer');
        var $mask = $('.j-mask');
        var $hasJoin = $('.j-has-join');
        var $button = $('.j-pay');
        var paymentParam = $footer.data();

        var url = helper.tmpl(constant.paths.ordercontext, {
            productItemId: paymentParam.productItemId,
            timestamp: new Date().getTime()
        })

        $footer.click(function(){
            if(paymentParam.hasJoined){
                $hasJoin.fadeIn(200);
            }else{
                $mask.fadeIn(200);
            }
        })
        $hasJoin.on('click','.j-know',function(){
            $hasJoin.fadeOut(100);
        })
        $mask.on('click', '.close', function() {
            $mask.fadeOut(100);
        }).on('click', '.j-pay', function(){
            Pending.show();            
            var payData = $button.data();
            var needRecharge = payData.needRecharge;
            var rechargeAmount = payData.rechargeAmount;
            if(needRecharge){// 充值
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
        console.log('this is detail');
        var statusId = $('.j-statusTime').attr('data-groupon-status-id');
        var time = $('.j-statusTime').attr('data-remain-milliseconds');        
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
                if(statusId == 1){// 拼团中 倒计时进行为0的时候刷新 更新状态
                    location.reload();
                }
            }
        },1000)

        // 跳转
        var $jJoin = $('.j-join');
        $jJoin.click(function(){
            if($jJoin.attr('data-has-joined') === 'true'){
                xm.util.toast('你已参与该专辑的其他拼团');
            }else{
                location.href = $jJoin.attr('data-groupon-pay-url');
            }
        })

        // 分享
        var shareData = $('.share').data();
        if(shareData){
            var publicData = {
                title: shareData.shareTitle, // 分享标题
                link: shareData.shareUrl, // 分享链接
                imgUrl: shareData.shareCoverPath, // 分享图标
                desc: shareData.shareContext
            }
            var wxgroup = $.extend({channel: 'weixinGroup'},publicData);
            var wxfriend = $.extend({channel: 'weixin'},publicData);
            $('.j-wxgroup').click(function(){
                ya.share(wxgroup,function(res){
    
                });
            })
            $('.j-wxfriend').click(function(){
                ya.share(wxfriend,function(res){
    
                });
            })    
        }
        // 二次分享
        var wx_shareData = $('.wx-share').data();        
        if (env.isInWeiXin && wx_shareData) {
            var shareParam = {
                title: wx_shareData.shareTitle,
                link: wx_shareData.shareUrl, 
                imgUrl: wx_shareData.shareCoverPath, 
                desc: wx_shareData.shareContext
            }
            wx.ready(function() {
                wx.onMenuShareAppMessage(shareParam)
                wx.onMenuShareTimeline(shareParam)
                wx.onMenuShareQQ(shareParam)
                wx.onMenuShareQZone(shareParam)
                wx.onMenuShareWeibo(shareParam)
            })
        }
        
    })

    // prelaunch page
    helper.route(regexp.prelaunch,function(){
        console.log('this is prelaunch');
        var $recruit = $('.j-recruit');
        var $textarea = $('.j-textarea');
        var jCount = $('.j-count');            
        var grouponOrderId = $recruit.data().grouponOrderId;
        $textarea.bind('input propertychange paste',function(){
            var textLen = $textarea.val().length;      
            if(textLen <= 40){
                if(textLen == 0){
                    jCount.text(15);
                    return;
                } 
                jCount.text(textLen);
            }
        })
        var url = helper.tmpl(constant.paths.message, {
            grouponOrderId: grouponOrderId
        })
        $recruit.on('click',function(){
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
        var loadMore = xm && xm.util.loadMore;
        var $myLaunch = $('.j-launch-list');
        var $myJoin = $('.j-join-list');
        var $empty = $('.search-empty');
        var grouponRoleId = $('.j-my-launch').data().grouponRoleId; // 默认是我发起的拼团        

        // 点击跳转
        $('.group-list').on('click','.item',function(){
            location.href = $(this).data().showGrouponUrl;
        })

        // 切换tab
        $('.tab').on('click','.item',function(){
            var target = $(this);
            target.addClass('on').siblings().removeClass('on');
            if(target.hasClass('j-my-launch')){
                if($myLaunch.find('li').length == 0){
                    $empty.removeClass('hidden').find('.search-result').text('无发起的拼团');
                }else{
                    $empty.addClass('hidden');
                }
                grouponRoleId = $('.j-my-launch').data().grouponRoleId
                $myJoin.hide();
                $myLaunch.show();
            }else{
                if($myJoin.find('li').length == 0){
                    $empty.removeClass('hidden').find('.search-result').text('还未参与任何拼团');
                }else{
                    $empty.addClass('hidden');
                }
                grouponRoleId = $('.j-my-join').data().grouponRoleId;
                $myLaunch.hide();
                $myJoin.show();
            }
        })

        // 撤销拼团 只有我发起的拼团才可以撤销
        var $masker = $('.j-masker');
        var cancalUrl;
        $myLaunch.on('click','.btn-revoke',function(event){
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
                    if(ret === 0){
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

        // 滚动加载
        var pageNum = {
            launch: 2,
            join: 2
        }
        var loadMoreUrl = helper.tmpl(constant.paths.mygrouprecord, {
            grouponRoleId: grouponRoleId,
            timestamp: new Date().getTime()
        })
        function createLoadMore(option){
            var lm = new loadMore(option.dom);
            lm.on('xmlm-load-triggered', function(event, elem) {
                getList($.extend(option,{loadMore: lm}));
            })
        }
        if($myLaunch.length > 0){
            createLoadMore({
                dom: $myLaunch,
                url: loadMoreUrl,
                type: 'launch',
                pageNum: pageNum.launch++
            })
        }
        if($myJoin.length > 0){
            createLoadMore({
                dom: $myJoin,
                url: loadMoreUrl,
                type: 'join',
                pageNum: pageNum.join++
            })
        }
        var template = {
            joining: '<p class="status">还差&nbsp;<span class="theme">${grouponRemainQuantity}</span>&nbsp;位小伙伴<a class="btn-revoke" data-groupon-order-id="${grouponOrderId}"><i class="ic ic-revoke"></i>撤销拼团</a></p>',
            success: '<p class="status theme">${grouponOrderStatus}</p>',
            fail: '<p class="status">${grouponOrderStatus}</p>',
            list: '<li class="item" data-show-groupon-url="${showGrouponUrl}"><a><div class="pic">' +
                  '<img src="${coverUrl}"></div><div class="info">' +
                  '<h2 class="title elli-multi-2">${albumTitle}</h2>${statusHtml}</div></a></li>' 
        }

        function getList(option){
            var current = option.dom;
            if(option.type === 'launch' && current.attr('data-has-more') === 'false'){
                option.loadMore.clear();
                return false;
            }
            if(option.type === 'join' && current.attr('data-has-more') === 'false'){
                option.loadMore.clear();
                return false;
            }
            $.ajax({
                url: option.url,
                data: {
                    pageNum: option.pageNum
                },
                success: function(res){
                    current.attr('data-has-more',res.hasMore);
                    var listData = res.data;
                    var listHtml = '';
                    listData.forEach(function(item){
                        var grouponOrderStatus = '';
                        var statusHtml = '';
                        if(item.grouponOrderStatusId == 1){
                            grouponOrderStatus = '拼团中';
                            statusHtml = helper.tmpl(template.joining,{
                                grouponRemainQuantity: item.grouponRemainQuantity,
                                grouponOrderId: item.grouponOrderId
                            });
                        }else if(item.grouponOrderStatusId == 2){
                            grouponOrderStatus = '拼团成功';
                            statusHtml = helper.tmpl(template.success,{
                                grouponOrderStatus: grouponOrderStatus
                            });
                        }else{
                            grouponOrderStatus = '拼团失败';
                            statusHtml = helper.tmpl(template.fail,{
                                grouponOrderStatus: grouponOrderStatus
                            });
                        }
                        listHtml += helper.tmpl(template.list,{
                            showGrouponUrl: item.showGrouponUrl,
                            coverUrl: item.coverUrl,
                            albumTitle: item.albumTitle,
                            statusHtml: statusHtml
                        });

                    })
                    current.append(listHtml);
                },
                error: function(){
                    xm.util.toast('加载更多失败，请稍后再试');
                }
            })
        }
            
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
    // helper.route(regexp.payFail,function(){
    //     console.log('this is payfail');
        
    // })

})


