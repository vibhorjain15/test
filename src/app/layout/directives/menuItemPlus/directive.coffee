angular.module('diligenceVault').directive 'menuItemPlus', (MenubarFactory) ->
  restrict: 'E'
  replace: true
  templateUrl: 'layout/directives/menuItemPlus/template.html'
  link: (scope, element, attrs) ->
    $submenu_container = element.find(".js-dropdown-menu")

    if scope.menu_item.custom_class?
      element.addClass(scope.menu_item.custom_class)

    _(scope.menu_item.submenu_items).each (sub_menu_item) ->
      MenubarFactory.appendMenuItem($submenu_container, scope, sub_menu_item, true)

  controller: ($scope) ->
    childScopes = []

    @register = (childScope) ->
      childScopes.push(childScope)

    @setActive = ->
      $scope.is_active = _(childScopes).any((childScope) -> childScope.is_active)

    return
