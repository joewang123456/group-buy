//ajax pending 
;(function(){
    function Pending(){
        this._init();
    }
    Pending.prototype = {
        constructor: Pending,
        _dom: function(){
            return $('<div class="ajax_pending_container" style="display:none;"><div class="square_volume_mid"><div></div><div></div><div></div><div></div><div></div></div></div>')
        },
        _init: function(){
            $('body').append(this._dom);
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
