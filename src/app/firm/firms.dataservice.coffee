angular.module('diligenceVault').factory 'FirmDataService', (Utils, Restangular) ->

  new class FirmDataService
    getAttachments: ->
      firmId = Utils.getCurrentFirm().id

      Restangular.one('firms', firmId).all('attachments').getList()
