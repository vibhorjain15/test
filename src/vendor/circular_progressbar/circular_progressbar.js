/*
Implementation: src\app\shared\directives\circular_progressbar.coffee
Use: To show circular progress bar something that we have in LinkedIn
*/
(function(global) {
  this.CircularProgressBar = CircularProgressBar;

  function CircularProgressBar(options) {
    var desc;
    var $el = $(options.el);
    var html = "<div class='cpb-mask'>" +
                 "<div class='cpb-progress'></div>" +
               "</div>" +
               "<div class='cpb-progress-marker'></div>" +
               "<span class='cpb-progress-description'></span>";

    this.$el = $el;
    this.height = options.height || 100;
    this.mask_border = options.mask_border || 5;

    $el.addClass('cpb');
    $el.html(html);

    this.progress = options.progress || 50;

    desc = desc || this.progress + "%";

    this.setProgress(this.progress, desc);
  }

  CircularProgressBar.prototype = {
    setProgress: function(value, desc) {
      var height = (value/100) * this.height;
      var top = (this.height - height) - this.mask_border;

      var color_block = Math.ceil(value * 10 / (2 * 100)) || 1;
      var color_class = "progress-" + color_block;

      this.$el.find('.cpb-progress')
              .css('height', height + 'px')
              .removeClass(this.color_class)
              .addClass(color_class);
      this.$el.find('.cpb-progress-marker').css('top', top + 'px');
      this.$el.find('.cpb-progress-description').css('top', top + 'px');

      this.color_class = color_class;

      if (desc) {
        this.setProgressDescription(desc);
      }
    },
    setProgressDescription: function(desc) {
      this.$el.find('.cpb-progress-description').text(desc);
    }
  }
})(this);
