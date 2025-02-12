class FormADVFundsController extends BaseController
  @register 'FormADVFundsController'

  @inject 'Restangular', '$state', '$stateParams', 'FormADVPrivateFundsResource', 'Utils'

  initialize: ->
    @firmCRD = @$stateParams.firmCRD

    @isFormADVSubscription = @Utils.isFormADVSubscription

    @resource = @FormADVPrivateFundsResource.$new(id: @firmCRD)

    @private_funds_bar_chart =
      data:
        columns: []
        type: 'bar'
        empty:
          label:
            text: 'Loading...'

    #@column_labels = _(['x']).concat(_(@resource).pluck('name'))
      
    #@resource.forEach (item, index) =>
    #  values_array = []
    #  values_array.push item[index].assets

    #@private_funds_bar_chart.bar.label = @column_labels
    #@private_funds_bar_chart.data.columns = @valuesArray


    @Restangular.one('formadv_firms', @firmCRD).get().then (response) =>
      @formadv_firm = response
      
      
      


