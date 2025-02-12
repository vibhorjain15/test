angular.module('diligenceVault').directive 'menubar', ($compile, MenubarFactory) ->
  restrict: 'E'
  replace: true
  templateUrl: 'layout/directives/menubar/template.html'
  link: (scope, element, attrs, menubarController) ->
    menu_items = MenubarFactory.getMenuItems()

    _(menu_items).each (menu_item) ->
      MenubarFactory.appendMenuItem(element, scope, menu_item)
