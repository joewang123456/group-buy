//ajax pending 
;(function(){
    function Pending(){
        this._init();
    }
    Pending.prototype = {
        constructor: Pending,
        _init: function(){
            var html = '<div class="container"><div class="square_volume_mid"><div></div><div></div><div></div><div></div><div></div></div></div>';
            $('body').append(html);
        },
        show: function(){
            $('.container').show();
        },
        hide: function(){
            $('.container').hide();
        }
    }
    window.Pending = new Pending();
})()
