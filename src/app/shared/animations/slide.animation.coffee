angular.module('diligenceVault').animation '.slide', ->
  NG_HIDE_CLASS = 'ng-hide'

  {
    beforeAddClass: (element, className, done) ->
      element.slideUp(done) if className is NG_HIDE_CLASS
      return #Make sure to not remove this line, usually we must return callbacks if any required, if we remove this line the element will be treated as callback leading to runtime error

    removeClass: (element, className, done) ->
      element.hide().slideDown done if className is NG_HIDE_CLASS
      return
  }
