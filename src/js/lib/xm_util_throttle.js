;(function () {
	window.xm || (window.xm = {});
	xm.util || (xm.util = {});
	/**
	 * 节流函数
	 * @param {Function} [fn] [*required] 需要节流调用的目标函数
	 * @param {number} [delay] [*required] 节流函数执行的延迟(ms)
	 * @param {number} [maxDelay] [*optional] 节流函数最大的执行间隔(ms)
	 * @param {Object} [context] [*optional] 参数fn调用时的执行上下文
	 */
	function throttle(fn, delay, maxDelay, context) {
		var timer = null,
			last;
		if(typeof fn !== 'function' || typeof delay !== 'number') {
			console.log('Function <throttle> need at least two params, first with type `function` and second with type `number`');
			return;
		}
		
		maxDelay || (maxDelay = Infinity);

		return function () {
			var args = [].slice.call(arguments),
				start = +new Date();
			
			clearTimeout(timer);

			last || (last = start);
			
			if(start - last > maxDelay) {
				fn.apply(context, args);
				last = start;
			}
			else {
				timer = setTimeout(function () {
					fn.apply(context, args);
				}, delay)
			}
		}
	}

	xm.util.throttle = throttle;
})();