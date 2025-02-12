angular.module('diligenceVault').factory 'InviteUserService', ($injector, $auth, $window, authSettings, $q, $http, DvAlert, Restangular, toaster, DvInputAlert, Utils) ->
  new class InviteUserService
    constructor: ->
      @isNewUser = "Active"
      @newUser = null

    inviteState:(user) ->
      @isNewUser = "Invited"
      @newUser = user

    activeState:() ->
      @isNewUser = "Active"
      @newUser = null
    

