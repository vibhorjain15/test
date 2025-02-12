angular.module('diligenceVault').config (ModalFactoryProvider) ->
  ModalFactoryProvider.registerModal 'manage_risk_rating_categories',
    controller: 'ManageRiskRatingCategoriesController'
    controllerAs: 'vm'
    size: 'xl'
    backdrop: 'static'
