angular.module('diligenceVault').directive 'dvTransparentInput', ->
  restrict: 'E'
  replace: true
  template: (element, attrs) ->
    # using attrs.ngModel was causing
    # https://docs.angularjs.org/error/$compile/multidir?p0=ngModel&p1=&p2=ngModel&p3=&p4=%27ngModel%27%20controller&p5=%3Cinput%20type%3D%22text%22%20data-ng-model%3D%22category.name%22%3E
    """
    <input type="text"
           class="input-transparent" />
    """
  link: (scope, element) ->
    element.on 'focus', ->
      @setSelectionRange(0, @value.length)
