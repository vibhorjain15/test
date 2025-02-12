
angular.module('diligenceVault').factory 'FormADVDataService', (Restangular,$q) ->
  new class FormADVDataService
  
    getNotes: (id) ->
      Restangular.all('notes').getList(entity_id : id, entity_type : 'FormADV').then (response) =>
        _(response).map (note) =>
          Restangular.restangularizeElement null, note, 'notes'

        response

    createNote: (id, params) ->
      params.entity_id = id
      params.entity_type = 'FormADV'
      Restangular.all('notes').post(params)