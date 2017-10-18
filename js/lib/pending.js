//ajax pending 
;(function(){
    function Pending(){
        this._init();
    }
    Pending.prototype = {
        constructor: Pending,
        _init: function(){
            var html = '<div class="ajax_pending_container"><div class="square_volume_mid"><div></div><div></div><div></div><div></div><div></div></div></div>';
            $('body').append(html);
        },
        show: function(){
            $('.ajax_pending_container').show();
        },
        hide: function(){
            $('.ajax_pending_container').hide();
        }
    }
    window.Pending = new Pending();
})();
