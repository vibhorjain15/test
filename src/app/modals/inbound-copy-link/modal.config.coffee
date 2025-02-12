angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'inbound-copy-link',
    controller: 'InboundCopyLinkController'
    controllerAs: 'vm'
    backdrop: 'static'
    resolve:
      link: ->