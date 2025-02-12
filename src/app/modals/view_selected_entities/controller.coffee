class ViewSelectedEntitiesController extends ModalController

    @register 'ViewSelectedEntitiesController'

    @inject '$uibModalInstance', 'Restangular','keywordConstants','$q','toaster','Utils', 'entities','filter','entityType','readonly','entityGroup'

    initialize: ->
        @filterDisplay = if @filter then @displayFilter(@filter) else "Unfiltered"

    displayFilter: (criterion) =>
        displayedFilter = ''
        value = ''
        if criterion.criteria_obj.type.toLowerCase() == 'date'
            if criterion.condition == 'between'
                startDate = moment(criterion.advance_filter_value.startDate).format("YYYY-MM-DD")
                endDate = moment(criterion.advance_filter_value.endDate).format("YYYY-MM-DD")
                displayedDate = startDate + ' to '+ endDate
            else
                displayedDate = moment(criterion.advance_filter_value).format("YYYY-MM-DD")
            displayedFilter = "#{criterion.criteria_obj.filter_name} : " + displayedDate
        else
            if criterion.criteria_obj.hasOwnProperty('options')
                for option in criterion.criteria_obj.options
                    if(option.id == criterion.advance_filter_value)
                        value = option.value
            if value != ''
                displayedFilter = "#{criterion.criteria_obj.filter_name} : " + value
            else
                displayedFilter = "#{criterion.criteria_obj.filter_name} : " + criterion.advance_filter_value
        displayedFilter

    submit:=>
        @close @entities