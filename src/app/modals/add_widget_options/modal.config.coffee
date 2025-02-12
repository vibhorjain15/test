angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_widget_options',
    controller: 'AddWidgetOptionsController'
    resolve:
      existing_widget: ->
