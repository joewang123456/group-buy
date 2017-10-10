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
    ;(function(){
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
        // $.ajax('',function(data){
            let time = 86500000;
            countTime(time);
            let timer = setInterval(function(){
                if(time>0){
                    time -= 1000;
                    countTime(time);                    
                }else{
                    clearInterval(timer);
                }
            },1000)
        // })
    })()

    // launch page
    ;(function(){
        $('.launch footer').click(function(){
            $('.launch .mask').fadeIn('400');
        })
        $('.launch .close').click(function(){
            $('.launch .mask').fadeOut('100');
        })
    })()


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


