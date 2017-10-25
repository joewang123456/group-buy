(function (win, doc, undefined) {
  var tmpl =
    '' +
    '<div class="masker">' +
    '  <div class="pop">' +
    '    <div class="ic-cancel" data-role="dismiss"></div>' +
    '  </div>' +
    '</div>';
  function isFunction (tar) {
    return Object.prototype.toString.call(tar) === '[object Function]';
  }
  function Popup() {}
  Popup.prototype.open = function (opts) {
    var _this = this;
    this.$el = $(tmpl);
    opts.extraCls && this.$el.find('.pop').addClass(opts.extraCls);
    this.$el.find('.pop').append(opts.content);
    isFunction(opts.beforeShown) && opts.beforeShown(_this.$el);
    $(doc.body).append(this.$el);

    this.$el
      .on('click', '[data-role=cancel]', function () {
        isFunction(opts.cancel) && opts.cancel(_this.$el);
        _this.close();
      })
      .on('click', '[data-role=ok]', function () {
        isFunction(opts.ok) && opts.ok(_this.$el);
        _this.close();
      })
      .on('click', '[data-role=dismiss]', function () {
        isFunction(opts.dismiss) && opts.dismiss(_this.$el);
        _this.close();
      });
  };
  Popup.prototype.close = function () {
    this.$el.remove();
  };
  win.Popup = Popup;
})(window, document);
