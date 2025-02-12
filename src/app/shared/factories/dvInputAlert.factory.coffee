angular.module('diligenceVault').factory 'DvInputAlert', ($rootScope) ->
  new class DvInputAlert

    dismissActiveInputAlert: ->
      $rootScope.$broadcast('dv_input_alert:leave_page')
