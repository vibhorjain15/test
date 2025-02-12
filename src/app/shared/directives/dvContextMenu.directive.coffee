angular.module('diligenceVault').directive 'dropdownOnHover', ($timeout) ->
  restrict: 'A'
  scope: '@&'
  compile: (tElement, tAttrs, transclude) ->
    post: (scope, iElement, iAttrs, controller) ->
      ul = $('#' + iAttrs.context)
      last = null
      ul.css 'display': 'none'
      $(iElement).bind 'contextmenu', (event) ->
        # event.preventDefault()
        ul.css
          position: 'fixed'
          display: 'block'
          left: event.clientX + 'px'
          top: event.clientY + 'px'
        last = event.timeStamp
        return
      #$(iElement).click(function(event) {
      #  ul.css({
      #    position: "fixed",
      #    display: "block",
      #    left: event.clientX + 'px',
      #    top: event.clientY + 'px'
      #  });
      #  last = event.timeStamp;
      #});
      $(document).click (event) ->
        target = $(event.target)
        if !target.is('.popover') and !target.parents().is('.popover')
          if last == event.timeStamp
            return
          ul.css 'display': 'none'
        return
      return
