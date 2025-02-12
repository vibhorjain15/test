angular.module('diligenceVault').factory 'PermissionDataservice', (Restangular, $rootScope)->
  new class PermissionDataservice
    getRoles: (id)=>
      Restangular.one('firms',id).all('roles').getList({include_admins: false})
