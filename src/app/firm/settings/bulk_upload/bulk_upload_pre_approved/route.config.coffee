angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.bulk_upload.bulk_upload_pre_approved',
    url: '/pre_approved'
    templateUrl: 'firm/settings/bulk_upload/bulk_upload_pre_approved/template.html'
    controller: 'BulkUploadPreApprovedController'
    controllerAs: 'vm'
    hidden_from: ['investor']
