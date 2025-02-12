# angular.module('diligenceVault').factory 'SwitchFirmService', (AngularDataService,BaseDataService, MentionsFactory,$q,$rootScope,baseData) ->

#   new class SwitchFirmService

#     setSwitchFirmData = ->
#       BaseDataService.loadBaseData()
#       MentionsFactory.clearTeamMembersCache()
#       $q.all([$rootScope.currentUserPromise, $rootScope.subscriptionLimitsPromise]).then ( =>
#         MentionsFactory.getTeamMembers()
#         AngularDataService.setUserData(baseData)
#       )

# angular
#   .module('diligenceVault')
#   .provider 'SwitchFirmService', SwitchFirmService
class SwitchFirmProvider
  constructor: ->

  $get: (BaseDataService, MentionsFactory,$q,$rootScope,baseData,$state) ->
    "ngInject"

    setSwitchFirmData = ->
      BaseDataService.loadBaseData()
      MentionsFactory.clearTeamMembersCache()
      $q.all([$rootScope.currentUserPromise, $rootScope.subscriptionLimitsPromise]).then ( =>
        MentionsFactory.getTeamMembers()
        # AngularDataService.setUserData(baseData)
        $state.reload()
      )

angular
  .module('diligenceVault')
  .provider 'SwitchFirmFactory', SwitchFirmProvider
