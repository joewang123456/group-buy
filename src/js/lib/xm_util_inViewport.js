;(function () {
	window.xm || (window.xm = {});
	xm.util || (xm.util = {});

	/**
	 * 判断元素是否在限定的区域范围内，默认是可视区域
	 * @param {element} [element] 目标元素
	 * @param {Number|Object} [offset] 基于可视区域定制判定范围
	 *   可以传入number类型代表四个方向或者传入由top、right、bottom、left分别标识方向的对象
	 * @return {Boolean} true 代表元素在目标区域内 而false与之相反
	 */
	function inViewport(element, offset) {
		var top, right, bottom, left, boundingRect;
		offset || (offset = 0);
		if(typeof offset === 'number') {
			top = right = bottom = left = offset;
		}
		else if(typeof offset === 'object') {
			top = offset.top || 0;
			right = offset.right || 0;
			bottom = offset.bottom || 0;
			left = offset.left || 0;
		}
		else {
			return;
		}

		boundingRect = element.getBoundingClientRect();

		return window.innerHeight - boundingRect.top > top && boundingRect.right > right &&
				boundingRect.bottom > bottom && window.innerWidth - boundingRect.left > left;
	}

	xm.util.inViewport = inViewport;
})();