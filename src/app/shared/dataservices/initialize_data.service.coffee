class InitializeDataProvider
  constructor: ->

  $get: (BaseDataService, MentionsFactory,$q,$rootScope,baseData,$state) ->
    "ngInject"

    InitializeDataFactory = ->
      BaseDataService.loadBaseData()
      MentionsFactory.clearTeamMembersCache()
      $q.all([$rootScope.currentUserPromise, $rootScope.subscriptionLimitsPromise]).then ( =>
        MentionsFactory.getTeamMembers()
      )

angular
  .module('diligenceVault')
  .provider 'InitializeDataFactory', InitializeDataProvider
