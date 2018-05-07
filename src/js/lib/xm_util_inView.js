;(function () {
	//polifill
	if (typeof Object.assign != 'function') {
	  Object.assign = function(target) {
	    'use strict';
	    if (target == null) {
	      throw new TypeError('Cannot convert undefined or null to object');
	    }

	    target = Object(target);
	    for (var index = 1; index < arguments.length; index++) {
	      var source = arguments[index];
	      if (source != null) {
	        for (var key in source) {
	          if (Object.prototype.hasOwnProperty.call(source, key)) {
	            target[key] = source[key];
	          }
	        }
	      }
	    }
	    return target;
	  };
	}

	window.xm || (window.xm = {});
	xm.util || (xm.util = {});

	var inViewport = xm.util.inViewport;
	var microevent = xm.util.MicroEvent;
	var throttle = xm.util.throttle;
	/**
	 * 监听器注册类，传入需要被监听的DOM元素数组，当数组中元素进入／退出 viewport时分别触发enter/leave事件
	 * @param {Array} elements 监听的DOM元素数组
	 */
	function MonitorRegistry (elements) {
		this.elements = elements;
		this.current = [];//elements中当前处于viewport内的元素数组
	}
	//赋予MonitorRegistry类以事件功能
	microevent.mixin(MonitorRegistry);
	/**
	 * 使用新的elements替换原来elements，同时清空current数组
	 * @param  {Array} elements 监听的DOM元素数组
	 * @return {Object}         MonitorRegistry类的实例对象，方便链式调用
	 */
	MonitorRegistry.prototype.reset = function (elements) {
		this.elements = elements;
		this.current = [];//elements中当前处于viewport内的元素数组
		return this
	}
	/**
	 * 遍历被监听的DOM元素，利用inViewport函数判断元素进入／退出viewport，触发enter／leave事件
	 * @param  {Number | Object} offset 传入数字将会把top、right、bottom、left同时指定为offset；传入对象则可以对它们分别指定
	 * @return {Object}        MonitorRegistry类的实例对象，方便链式调用
	 */
	MonitorRegistry.prototype.check = function (offset) {
		this.elements.forEach(function (elem) {
			var inView, index;
			inView = inViewport(elem, offset);
			index = this.current.indexOf(elem);
			if(inView && !~index) {//元素进入viewport 并且 它之前没有在viewport中
				this.current.push(elem);
				this.emit('enter', elem);
			}

			if(!inView && ~index) {//元素退出viewport 并且 它之前在viewport中
				this.current.splice(index, 1);
				this.emit('leave', elem);
			}
		}.bind(this));
		return this;
	}
	/**
	 * InView类，传入配置参数
	 * @param {Object} opts 配置参数
	 * opts.delay throttle函数的delay参数
	 * opts.maxDelay throttle函数的maxDelay参数
	 * opts.scroller 当监听scroll事件时，事件触发的对象，默认为window
	 * opts.triggers 当发生什么事件时会触发check 支持(window.onresize, window.onload, scroller.scroll)
	 */
	function InView (opts) {
		this.opts = Object.assign({}, InView.default, opts || {});
		this.targets = {history: []};
		this.scroller = this.opts.scroller || window;
		this.os = 0;//offset  inViewport函数的参数offset 默认为0
		this.start();
	}
	//默认配置参数
	InView.default = {
		delay: 100,
		maxDelay: 300,
		triggers: ['scroll', 'resize', 'load']
	}
	/**
	 * 启动监听，绑定throttled监听事件
	 */
	InView.prototype.start = function () {
		var triggers = this.opts.triggers;

		this.monitor = throttle(this.check, this.opts.delay, this.opts.maxDelay, this);

		if(Array.isArray(triggers)) {
			triggers.forEach(function (trigger) {
				if(trigger === 'scroll') {
					this.scroller.addEventListener(trigger, this.monitor, false);
				}
				else {
					window.addEventListener(trigger, this.monitor, false);
				}
			}.bind(this));
		}
	}
	/**
	 * 关闭监听，移除监听事件
	 */
	InView.prototype.end = function () {
		var triggers = this.opts.triggers;
		if(Array.isArray(triggers)) {
			triggers.forEach(function (trigger) {
				if(trigger === 'scroll') {
					this.scroller.removeEventListener(trigger, this.monitor, false);
				}
				else {
					window.removeEventListener(trigger, this.monitor, false);
				}
			}.bind(this));
		}
	}
	/**
	 * 当页面发生变化时(load,resize,scroll)调用的处理函数
	 * 函数通过调用MonitorRegistry实例的check方法触发enter／leave事件
	 */
	InView.prototype.check = function () {
		var targets = this.targets,
			offset = this.os;
		targets.history.forEach(function (selector) {
			targets[selector].check(offset);//调用MonitorRegistry的check方法
		});
		return this;
	}
	/**
	 * 传入css3选择器启动对于selector元素的监听，并且以selector为key将MonitorRegistry实例保存在targets对象中
	 * @param  {String} selector css3形式的选择器字符串
	 * @return {Object}          MonitorRegistry实例
	 */
	InView.prototype.watch = function (selector) {
		var targets, elements;
		if(typeof selector !== 'string') {
			return;
		}
		targets	= this.targets;
		elements = [].slice.call(document.querySelectorAll(selector));//将querySelectorAll获得的动态类数组转换成静态数组

		if(~targets.history.indexOf(selector)) {//如果selector出现重复则调用MonitorRegistry实例的reset方法，重置实例
			targets[selector].reset(elements);
		}
		else {
			targets[selector] = new MonitorRegistry(elements);//保存MonitorRegistry实例
			targets.history.push(selector);
		}
		return targets[selector];
	}
	/**
	 * 传入css3选择器停止对于selector元素的监听
	 * @param  {String} selector css3形式的选择器字符串
	 * @return {null | Object}   该selector处于监听中则返回MonitorRegistry实例，否则返回null
	 */
	InView.prototype.unwatch = function (selector) {
		var targets, result, index;
		if(typeof selector !== 'string') {
			return;
		}
		targets = this.targets;
		if(!~targets.history.indexOf(selector)) {
			return null;
		}
		else {
			result = targets[selector];
			targets[selector] = null;
			index = targets.history.indexOf(selector);
			targets.history.splice(index, 1);
			return result;
		}
	}
	/**
	 * 返回当前正在监听的selector数组
	 * @return {Array} 正在监听的selector数组
	 */
	InView.prototype.watching = function () {
		return this.targets.history;
	}
	/**
	 * 获取当前offset 或 设置offset
	 * @param  {Number | Object} value inViewport函数的offset参数
	 * @return {Object}       返回实例对象，方便链式调用
	 */
	InView.prototype.offset = function (value) {
		if(value != null) {
			this.os = value;
		}
		else {
			return this.os;
		}
		return this;
	}
	/**
	 * 以offset为基准，使用inViewport判断elem是否在viewport中
	 * @param  {Node} elem   目标元素
	 * @param  {Number | Object} offset inViewport函数的offset参数，默认使用os属性
	 * @return {Boolean}        布尔值表征的元素是否处于viewport中
	 */
	InView.prototype.in = function (elem, offset) {
		offset = offset == null ? this.os : offset;
		return inViewport(elem, offset)
	}

	xm.util.InView = InView;
})();