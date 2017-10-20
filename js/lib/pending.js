//ajax pending 
;(function(){
    function Pending(){
        this._init();
    }
    Pending.prototype = {
        constructor: Pending,
        _init: function(){
            this._dom = $('<div class="ajax_pending_container" style="display:none;"><div class="square_volume_mid"><div></div><div></div><div></div><div></div><div></div></div></div>')
            $('body').append(this._dom);
        },
        show: function(){
            this._dom.show();
        },
        hide: function(){
            this._dom.hide();
        }
    }
    window.Pending = new Pending();
})();
