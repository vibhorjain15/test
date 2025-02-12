angular.module('diligenceVault').factory 'SettingsDataservice', (Restangular)->
  new class SettingsDataservice

    unlockUser: (userName) ->
      Restangular.all('users').all('unlock').customPUT {userName: userName}