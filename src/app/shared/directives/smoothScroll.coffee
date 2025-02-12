angular.module('diligenceVault').directive 'smoothScroll', ($location) ->
  restrict: 'A'
  compile: (element, attrs) ->
    element.on 'click', ->
      selector = attrs.smoothScroll
      selector_is_element_id = /^#(.+)$/.test(selector)

      if selector_is_element_id
        $location.hash selector.slice(1)

      $('html, body').animate { scrollTop: $(selector).offset().top - 61 }, 500
