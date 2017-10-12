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
                if(timeObj.hour != $('.cont .count-down-item:nth-child(1)').text()){
                    $('.cont .count-down-item:nth-child(1)').text(timeObj.hour);
                }                            
                if(timeObj.minute != $('.cont .count-down-item:nth-child(2)').text()){
                    $('.cont .count-down-item:nth-child(2)').text(timeObj.minute);
                }                            
                if(timeObj.second != $('.cont .count-down-item:nth-child(3)').text()){
                    $('.cont .count-down-item:nth-child(3)').text(timeObj.second);
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
            $('.share ul li:first-child').click(function(){
                ya.share({
                    channel: 'weixinGroup', // channel可选值为[“qq”, “qzone”, “tSina”, “weixin”, “weixinGroup”, “message”]
                    title: shareData.title, // 分享标题
                    link: shareData.url, // 分享链接
                    imgUrl: shareData.imgUrl, // 分享图标
                    desc: shareData.desc
                },function(res){

                });
            })
            $('.share ul li:last-child').click(function(){
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
        ;(function(){
            $('.launch footer').click(function(){
                $('.launch .mask').fadeIn('400');
            })
            $('.launch .close').click(function(){
                $('.launch .mask').fadeOut('100');
            })
        })()
        ;(function(){
            $('.launch footer').click(function(){
                $('.launch .mask').fadeIn('400');
            })
            $('.launch .close').click(function(){
                $('.launch .mask').fadeOut('100');
            })
        })()
    }


    // prelaunch page
    ;(function(){
        $('.prelaunch textarea').bind('input propertychange',function(){
            let textContent = $('.prelaunch textarea');
            let jCount = $('.prelaunch .j-count');
            let textLen = textContent.val().length;  
            if(textLen <= 40){
                jCount.text(textLen);
            }
        })
    })()
})


