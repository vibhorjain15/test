class InvestorPitchController extends BaseController
    @register 'InvestorPitchController'

    @inject 'Restangular', 'Utils', 'InvestorPitchResource', '$state','angularEnabled'

    initialize: ->
        @investor_pitch = @InvestorPitchResource.$new()

    startPitch: (entity)=>
        @$state.go 'app.inbound.review_request', {
            investorId: entity.firm_id,
        }

    openRow: (row,col)=>
        @startPitch(row.entity)
