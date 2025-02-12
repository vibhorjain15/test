angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'add_template_category',
    controller: 'AddTemplateCategoryController'
    backdrop: 'static'
    size: 'lg'
