angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'upload_aum_tr',
    controller: 'UploadAumTrController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      entity_id: ->
      entity_type: ->
