angular.module('diligenceVault').directive 'dvNavTabsDropdown', (Utils) ->
  restrict: 'A'
  compile: (element, attrs) ->
    element.addClass("nav-tabs-dropdown")

    element.on('click', 'li:not(\'.active\') a', (event) ->
      $(this).closest('ul').removeClass 'open'
    ).on 'click', 'li.active a', (event) ->
      $(this).closest('ul').toggleClass 'open'
