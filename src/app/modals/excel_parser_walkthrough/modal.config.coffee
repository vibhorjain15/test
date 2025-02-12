angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'excel_parser_walkthrough',
    controller: 'EPWalkThrough'
    size: 'lg'
    backdrop: 'static'
