angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'view_related_diligences',
    controller: 'ViewRelatedDiligenceController'
    controllerAs: 'vm'
    size: 'lg'
    resolve:
      diligence: ->
      disabled: ->
      disabledTooltip: ->