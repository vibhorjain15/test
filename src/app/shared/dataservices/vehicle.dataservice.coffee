angular.module('diligenceVault').factory 'VehicleDataService', (Restangular) ->

    new class VehicleDataService
        getVehicle: (firmId,fundId,vehicleId)->
            Restangular.one('firms', firmId).one('funds', fundId).one('vehicles', vehicleId).get()

        getRelatedVehicles: (firmId,fundId,vehicleId) ->
            Restangular.one('firms', firmId).one('funds', fundId).one('vehicles', vehicleId).all('related_vehicles').getList()

        getVehicles: ->
            Restangular.all('vehicles').getList()

        deactivateVehicle: (firmId,fundId,vehicleId) ->
            Restangular.one('firms', firmId).one('funds', fundId).one('vehicles', vehicleId).remove()
            
        getShareClassTables: (firmId,fundId,vehicleId) =>
            Restangular.one('firms', firmId).one('funds', fundId).one('vehicles', vehicleId).all('AumTrackRecordDefinitions').getList()
