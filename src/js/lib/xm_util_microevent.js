;(function () {
	window.xm || (window.xm = {});
	xm.util || (xm.util = {});
	/**
	 * tiny Event library
	 */
	function MicroEvent () { }

	MicroEvent.prototype.init = function () {
		this._handlers || (this._handlers = {});
		this._singles || (this._singles = {});
	};
	/**
	 * 将事件绑定到`this`指向的对象上，事件的callback会以event为key 存储在对象的_handlers属性中
	 * 以后每次触发event事件都会按顺序调用callback
	 * @param  {String}   event    需要监听的事件名称
	 * @param  {Function} callback 当event事件触发时调用的回调函数
	 * @return {Object}            返回`this`指向的对象，能够链式调用
	 */
	MicroEvent.prototype.on = function (event, callback) {
		this._handlers || (this._handlers = {});
		this._handlers[event] = this._handlers[event] || [];
		this._handlers[event].push(callback);
		return this;
	};
	/**
	 * 将事件绑定到`this`指向的对象上，事件的callback会以event为key 存储在对象的_singles属性中
	 * 只有当event事件第一次触发时才会调用callback
	 * @param  {String}   event    需要监听的事件名称
	 * @param  {Function} callback 当event事件触发时调用的回调函数
	 * @return {Object}            返回`this`指向的对象，能够链式调用
	 */
	MicroEvent.prototype.once = function (event, callback) {
		this._singles || (this._singles = {});
		this._singles[event] || (this._singles[event] = []);
		this._singles[event].push(callback);
		return this;
	};
	/**
	 * 移除`this`指向对象上对于event事件监听的callback回调，当不传callback参数时将移除event事件所有回调
	 * @param  {String}   event    需要移除监听函数的事件名称
	 * @param  {Function} callback 需要移除监听event事件的回调函数名称
	 * @return {Object}            返回`this`指向的对象，能够链式调用
	 */
	MicroEvent.prototype.off = function (event, callback) {
		var handlers, handlerIndex, sinlges, singleIndex;
		
		this._handlers || (this._handlers = {});
		this._singles || (this._singles = {});

		if(callback != null) {
			handlers = this._handlers[event];
			if(Array.isArray(handlers)) {
				((handlerIndex = handlers.indexOf(callback))) !== -1 &&  handlers.splice(handlerIndex, 1);
			}
			sinlges = this._handlers[event];
			if(Array.isArray(sinlges)) {
				((singleIndex = sinlges.indexOf(callback))) !== -1 &&  sinlges.splice(singleIndex, 1);
			}
		}
		else {
			delete this._handlers[event];
			delete this._singles[event];
		}
		return this;
	};
	/**
	 * 触发`this`指向对象上的event事件，以context为this执行事件回调，并且传入event名称和data参数
	 * @param  {String} event   需要触发的事件
	 * @param  {Any | Array} data    调用回调时传入的额外参数
	 * @param  {Object} context 调用回调函数的执行上下文
	 * @return {Object}         返回`this`指向的对象，能够链式调用
	 */
	MicroEvent.prototype.emit = function (event, data, context) {
		var handlers, handlerlength, singles, singleLength;

		this._handlers || (this._handlers = {});
		this._singles || (this._singles = {});
			
		handlers = this._handlers[event];
		singles = this._singles[event];

		handlerlength = handlers ? handlers.length : 0;
		singleLength = singles ? singles.length : 0;
		
		Array.isArray(data) ? data.unshift(event) : (data = [event, data]);
		
		while(--handlerlength > -1) {
			handlers[handlerlength].apply(context, data);
		}

		while(singleLength && singles.length) {
			singles.pop().apply(context, data);
		}
		return this;
	};
	/**
	 * 赋予dest对象以MicroEvent的所有方法，拓展dest对象使他拥有事件功能
	 * @param  {Object} dest 需要拓展事件功能的目标对象
	 * @return {Object}      返回拓展后的dest对象
	 */
	MicroEvent.mixin = function (dest) {
		var method;
		for(method in MicroEvent.prototype) {
			if(typeof dest === 'function') {
				dest.prototype[method] = MicroEvent.prototype[method];
			}
			else {
				dest[method] = MicroEvent.prototype[method];
			}
		}
		return dest;
	}

	xm.util.MicroEvent = MicroEvent;
})();