angular.module('diligenceVault').factory 'RatingDataservice', ($http, baseUrl, Restangular, Utils, $window,RestangularHeaderService) ->

  new class DueDiligenceDataservice
    updateResponseStatus: (id, status,diligenceId)=>
      params = {
        id: id
        status: status
      }
      Restangular.one('diligences',diligenceId).one('ratings',id).all('status').patch(params)
