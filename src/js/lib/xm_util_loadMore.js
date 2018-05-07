;(function () {
  //polyfill
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

  var InView = xm.util.InView;
  var MicroEvent = xm.util.MicroEvent;
  var prefix = 'xmlm-';
  function toArray(tar) {
    return typeof tar.length === 'number' ? [].slice.call(tar) : [tar]
  }
  function isFunction(tar) {
    return Object.prototype.toString.call(tar) === '[object Function]';
  }

  function ObserverRegistry() {

  }
  //赋予ObserverRegistry类以事件功能
  MicroEvent.mixin(ObserverRegistry);
  ObserverRegistry.prototype.observe = function (list) {
    var _this = this, MutationObserver, observer, clear, lastList, meHandler;
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if(MutationObserver) {
      observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes && mutation.addedNodes.length && _this.emit('listAdded', [toArray(mutation.addedNodes), mutation.target]);
        });
      });
      observer.observe(list, {childList: true});
      clear = function () {
        observer.disconnect();
      }
    }
    else if (window.MutationEvent){
      lastList = toArray(list.children);
      meHandler = function (e) {
        var addedElements, currentList;
        currentList = toArray(e.target.children);
        addedElements = currentList.filter(function(elem) {
          return !~lastList.indexOf(elem);
        });
        lastList = currentList;
        _this.emit('listAdded', [addedElements, e.target]);
      }
      list.addEventListener('DOMSubtreeModified', meHandler, false);
      clear = function () {
        list.removeEventListener('DOMSubtreeModified', meHandler, false);
      }
    }
    else {
      throw new Error('xm-loadMore is depand on `MutationObserver` or `MutationEvent` API, but both of them are invalid now.')
    }
    return clear;
  }

  var eventListAdded = prefix + 'list-added';
  var eventLoadTriggered = prefix + 'load-triggered';
  var index = 0;
  function LoadMore(list, opts) {
    this.list = list.jquery ? list.get(0) : toArray(list)[0];
    this.opts = Object.assign({}, LoadMore.default, opts || {});
    this.observer = new ObserverRegistry();
    this.inview = new InView(this.opts.inview || {});
    this.index = index ++;
    this._init();
  }
  LoadMore.default = {
    itemTag: 'li',
    triggerIndex: -2,
  }
  //赋予LoadMore类以事件功能
  MicroEvent.mixin(LoadMore);
  LoadMore.prototype._init = function () {
    //将triggerIndex 转化成列表的倒序number
    var triggerIndex = this.opts.triggerIndex, target;
    this.triggerIndex = triggerIndex > 0 ? Math.abs(triggerIndex - this.list.children.length - 1) : Math.abs(triggerIndex);
    this.list.classList.add(prefix + 'list');
    //init the inView selector tag
    this._iwTargetSelector = this.opts.itemTag + ':nth-last-of-type(' + this.triggerIndex + ')';
    target = this._iwTarget = this.list.querySelector(this._iwTargetSelector);
    target && target.setAttribute('data-' + prefix + 'index', this.index);
    this._iwSelector = this.opts.itemTag + '[data-' + prefix + 'index="' + this.index + '"]';

    this.start();
  }
  LoadMore.prototype.start = function () {
    this._changeIwSelectorTag();
    this._startObserver();
    this._startViewer();
    return this;
  }
  LoadMore.prototype._changeIwSelectorTag = function () {
    // change the inView selector tag
    var target = this._iwTarget;
    target && target.removeAttribute('data-' + prefix + 'index');
    target = this._iwTarget = this.list.querySelector(this._iwTargetSelector);
    target && target.setAttribute('data-' + prefix + 'index', this.index);
  }
  LoadMore.prototype._startObserver = function () {
    var self = this;
    this.observer.on('listAdded', function (event, added, list) {
      if(added.length > 0) {
        self.emit(eventListAdded, [added, list]);
        self._changeIwSelectorTag();
        self._startViewer();
      }
    });
    this._clearObserver = this.observer.observe(this.list);
  }
  LoadMore.prototype._startViewer = function () {
    var self = this;
    this.inview.watch(this._iwSelector).off('enter').once('enter', function (event, elem) {
      self.emit(eventLoadTriggered, [elem]);
    });
    this.inview.start();
  }
  LoadMore.prototype.end = function () {
    this.clear();
    return this;
  }
  LoadMore.prototype.check = function () {
    var viewTarget = this.list.querySelector(this._iwSelector);
    if(this.inview.in(viewTarget)) {
      this.emit(eventLoadTriggered, [viewTarget]);
    }
    return this;
  }
  LoadMore.prototype.clear = function () {
    // 移除observer
    this.observer.off('listAdded');
    isFunction(this._clearObserver) && this._clearObserver();
    // 关闭 inview check
    this.inview.unwatch(this._iwSelector);
    this.inview.end();
  }

  xm.util.loadMore = LoadMore;
})();