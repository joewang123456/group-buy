$(function(){
    // alert(111);
    let tool = {
        timeFormate: function (val) {
            if(val > 9) return val;
            return `0${val}`;
        },
        timeDown: function (milliSecond) {
            let s,m,h;
            h = parseInt(milliSecond / 1000 / 60 / 60 );
            m = parseInt(milliSecond / 1000 / 60 % 60 );
            s = parseInt(milliSecond / 1000 % 60 );
            return {
                hour: this.timeFormate(h),
                minute: this.timeFormate(m),
                second: this.timeFormate(s)
            }
        }    
    }

    // detail page
    if(window.location.href.indexOf('join') > -1){
        ;(function(){
            let statusId = $('.block').attr('data-groupon-status-id');
            // 倒计时
            function countTime(time){
                let timeObj = tool.timeDown(time);
                // 尽量减少DOM操作
                if(timeObj.hour != $('.cont .j-hour').text()){
                    $('.cont .j-hour').text(timeObj.hour);
                }                            
                if(timeObj.minute != $('.cont .j-minute').text()){
                    $('.cont .j-minute').text(timeObj.minute);
                }                            
                if(timeObj.second != $('.cont .j-second').text()){
                    $('.cont .j-second').text(timeObj.second);
                }                            
            }
            let time = $('.block').attr('data-remain-milliseconds');
            if(statusId == 2 || statusId == 3){
                $('.block:first-child .cont').addClass('grey');
                time = 0;
            }
            countTime(time);
            let timer = setInterval(function(){
                if(time>0){
                    time -= 1000;
                    countTime(time);                    
                }else{
                    clearInterval(timer);
                    window.location.reload();
                }
            },1000)

            // 分享
            let shareData = {
                title: $('.share').attr('data-share-title'),
                url: $('.share').attr('data-share-url'),
                imgUrl: $('.share').attr('data-share-cover-path'),
                desc: $('.share').attr('data-share-context')
            }
            $('.share ul .j-wxgroup').click(function(){
                ya.share({
                    channel: 'weixinGroup', // channel可选值为[“qq”, “qzone”, “tSina”, “weixin”, “weixinGroup”, “message”]
                    title: shareData.title, // 分享标题
                    link: shareData.url, // 分享链接
                    imgUrl: shareData.imgUrl, // 分享图标
                    desc: shareData.desc
                },function(res){

                });
            })
            $('.share ul .j-wxfriend').click(function(){
                ya.share({
                    channel: 'weixin', 
                    title: shareData.title, 
                    link: shareData.url,
                    imgUrl: shareData.imgUrl,
                    desc: shareData.desc
                },function(res){

                });
            })
        })()
    }

    // launch page
    if(window.location.href.indexOf('guidance/item') > -1){

        var constant = xm && xm.const;
        var helper = xm && xm.helper;

        ;(function(){
            var $footer = $('.launch footer');
            var $mask = $('.mask');
            var $button = $('.mask button');
            var paymentParam = $footer.data();
    
            var url = helper.tmpl(constant.paths.ordercontext, {
                productItemId: paymentParam.productItemId,
                timestamp: new Date().getTime()
            })

            $footer.click(function(){
                $.ajax({
                    url: url,
                    data: {},
                    success: function(res){
                        var needRecharge = res.needRecharge;
                        var rechargeAmount = res.rechargeAmount;
                        $mask.on('click', '.close', function() {
                            $mask.fadeOut('100');
                        })
                        if(needRecharge){// 充值
                            $button.text('余额不足，请先充值');
                            $mask.on('click','button',function(){
                                xm.payment.recharge(rechargeAmount);
                            })
                        }else{// 正常支付
                            $mask.on('click', 'button', function() {
                                var opts = $.extend({}, paymentParam)
                                opts.success = function(grouponOrderId) {
                                    location.href = xm.helper.tmpl(xm.const.paths.recommendation, {
                                        grouponOrderId: grouponOrderId,
                                    })
                                }
                                opts.failed = function() {
                                    console.log('failed')
                                }
                
                                xm.payment.pay(opts)
                            })
                
                        }

                    }
                })
                $mask.fadeIn('400');
            })

            
        })()
    }


    // prelaunch page
    if(window.location.href.indexOf('recommendation') > -1){

        var constant = xm && xm.const;
        var helper = xm && xm.helper;

        ;(function(){
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
        })()
    }


    // my-group page
    if(location.href.indexOf('mygroupon/role') > -1){

        var constant = xm && xm.const;
        var helper = xm && xm.helper;
        var loadMore = xm && xm.util.loadMore;
        var grouponRoleId = location.href.match(/\/role\/[0-9]\//)[0].replace(/[^0-9]/g,'');        

        ;(function(){
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
                                statusHtml = `<p class="status">还差&nbsp;<span class="theme">${ item.grouponRemainQuantity }</span>&nbsp;位小伙伴<a class="btn-revoke"><i class="ic ic-revoke"></i>撤销拼团</a></p>`;
                            }else if(item.grouponOrderStatusId == 2){
                                grouponOrderStatus = '拼团成功';
                                statusHtml = `<p class="status theme">${ grouponOrderStatus }</p>`;
                            }else{
                                grouponOrderStatus = '拼团失败';
                                statusHtml = `<p class="status theme">${ grouponOrderStatus }</p>`;
                            }
                            listHtml += `<li class="item">
                                            <a>
                                                <div class="pic">
                                                    <img src="${ item.coverUrl }">
                                                </div>
                                                <div class="info">
                                                    <h2 class="title elli-multi-2">${ item.albumTitle } add</h2>
                                                    ${ statusHtml }
                                                </div>
                                            </a>
                                        </li>`;
                            $('.group-list').append(listHtml);
                        })
                    },
                    error: function(){
                        xm.util.toast('加载更多失败，请稍后再试');
                    }
                })
            }
            
        })()
    }
})


