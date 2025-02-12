angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'project_review_help',
    controller: 'ProjectReviewHelpController'
    backdrop: 'static'
    size: 'lg'