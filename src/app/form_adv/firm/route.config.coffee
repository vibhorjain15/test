angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.form_adv.firm',
    url: '/firm/:firmCRD'
    template: '<ng2-adv-firm-tabs></ng2-adv-firm-tabs>'
