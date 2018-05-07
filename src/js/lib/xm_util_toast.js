(function($){
	window.xm = window.xm||{};
	xm.util = xm.util||{};

    var toast = function(txt, opt) {
        opt = opt || {};
        var toastEl = $('#mToast');
        var defStyle = {
            div : {
                'position': 'fixed',
                'bottom': '50px',
                'left': '30px',
                'right': '30px',
                'text-align': 'center'
            },
            span : {
                 'display': 'inline-block',
                 'box-sizing': 'border-box',
                 'background-color': 'rgba(0,0,0,.7)',
                 'color': '#fff',
                 'padding': '5px 8px',
                 'max-width': '100%',
                 'overflow': 'hidden',
                 'text-overflow': 'ellipsis',
                 'white-space': 'nowrap'
            }
        }

        defStyle.div = $.extend(defStyle.div ,  opt.style && opt.style.div);
        defStyle.span = $.extend(defStyle.span , opt.style && opt.style.span);

        var option = $.extend({
            timeout: 3000,
            transitionTime: 800,
            cls:'mtoast',
        }, opt);

        if (toastEl.size() > 0) {
            clearTimeout(toastEl.data('timer'))
            toastEl.remove();
        }
        toastEl = $('<div id="mToast" class="'+ option.cls +'" style="'+objStyleToString(defStyle.div)+'"><span style="'+objStyleToString(defStyle.span)+'">' + txt + '</span></div>');
        $('body').append(toastEl);
        toastEl.fadeIn(option.transitionTime);
        toastEl.data('timer', setTimeout(function() {
            toastEl.fadeOut(option.transitionTime, function() {
                toastEl.remove();
            });
        }, option.timeout));
    }

    function objStyleToString(obj){
        var result = '';
        for(var key in obj){
            result += key+':'+ obj[key]+';';
        }
        return result;
    }

	xm.util.toast = toast;
})($);


