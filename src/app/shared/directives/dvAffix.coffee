# Modified version of https://github.com/maxisam/angular-bootstrap-affix
# Since we don't need angular-jquery dependency
angular.module('diligenceVault').directive 'dvAffix', ($window, $timeout) ->
  restrict: 'EAC',
  link: (scope, iElement, iAttrs) ->
    iElement.addClass('dv-affix')

    instance = {unpin: null}
    $timeout ->
      iElement.width(iElement.parent().width())

    deregisterer = scope.$watch iAttrs.watchfor, (value) =>
      if value?
        $timeout ->
          iElement.width(iElement.parent().width())
        deregisterer()

    angular.element($window).bind('scroll', ->
      checkPosition(instance, iElement, iAttrs)
      return
    )

    angular.element($window).bind('click', ->
      $timeout(->
        checkPosition(instance, iElement, iAttrs)
      )
      return
    )

    checkPosition = (instance, el, options) ->
      navbar_height = 40
      scrollTop = $window.pageYOffset
      if scrollTop < 20
        scrollTop += 40
      scrollHeight = document.body.scrollHeight
      position = el.offset()
      height = el.height()
      offsetTop = (options.offsetTop || navbar_height) * 1.2
      offsetBottom = (options.offsetBottom || 0) * 1
      reset = 'affix affix-top affix-bottom'
      affix = null

      if instance.unpin isnt null and (scrollTop + instance.unpin <= position.top)
        affix = false
      else if (offsetBottom and (position.top + height >= scrollHeight - offsetBottom))
        affix = "bottom"
      else if (offsetTop and scrollTop <= offsetTop)
        affix = 'top'
      else
        affix = false

      return if (instance.affixed is affix)
      instance.affixed = affix
      instance.unpin = if affix is 'bottom' then position.top - scrollTop else null

      el.removeClass(reset).addClass('affix' + (if affix then '-' + affix else ''))

      return
