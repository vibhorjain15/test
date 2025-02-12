angular.module('diligenceVault').directive 'scrollGroup', ->
  (scope, element, attrs) ->
    $('div[scroll-group]').each ->
      $(this).addClass "scrollGroup"

    jQuery ($) ->
      $('.scrollGroup').on 'scroll', ->
        $('.scrollGroup').scrollLeft $(this).scrollLeft()
