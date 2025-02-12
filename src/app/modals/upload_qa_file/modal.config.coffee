angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'upload_qa_file',
    controller: 'ManageQAWordFileController'
    controllerAs: 'vm'
    backdrop: 'static'
