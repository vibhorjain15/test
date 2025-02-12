angular.module('diligenceVault').directive 'uiSortable', (Restangular, OrderService) ->
  restrict: 'A'
  require: 'ngModel'
  link: (scope, element, attrs, ngModelController) ->
    order_attribute = attrs.orderAttribute || 'order'
    resource_name = attrs.resource

    return unless resource_name

    $(element).on 'sortupdate', (event, ui) ->
      item = ui.item.sortable.model

      if attrs.parentResource?
        resource = scope.$eval(attrs.parentResource)

        resource = resource.one(resource_name, item.id)
      else
        resource = Restangular.one(resource_name, item.id)

      OrderService.performOrdering({
        items: ngModelController.$viewValue
        ui: ui
        order_attribute: order_attribute
        resource: resource
        $el: element
      })
