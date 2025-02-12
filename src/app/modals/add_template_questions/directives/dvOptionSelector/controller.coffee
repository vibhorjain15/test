class DVOptionSelectorController extends BaseController
  @register 'DVOptionSelectorController'
  @inject '$scope', '$attrs', '$parse','ModalFactory'

  initialize: ->
    @option_label = @$attrs.optionLabel || 'Option'
    @column_options = @$attrs.columnOptions || false
    @newOptions = []
    @options = []

    @displayCheckbox = @$attrs.fieldName is 'CheckBox'
    @allow_other_option = angular.isDefined(@$attrs.allowOtherOption)
    @editable = angular.isDefined(@$attrs.editable)
    @$scope.$on 'adding_question', (e, data) =>
      @previewOptions()

    @sortableOptions =
      axis: 'y'
      handle: '.sort-handle'
      cursor: 'move'
      placeholder: 'sortable-placeholder'

    if @$attrs.hasOtherOption
      @$scope.$watch 'vm.has_other_option', (value) =>
        @$parse(@$attrs.hasOtherOption).assign @$scope.$parent, value

    ###deregisterer = @$scope.$parent.$watch @$attrs.options, (value) =>
      if value?
        @initOptions(value)
        deregisterer()###

    @$scope.$parent.$watch @$attrs.options, (value) =>
      if value?
        @initOptions(value)


  previewOptions: ->
    @useBulkListBuilder = false
    _(@newOptions).each (option) =>
      type_options = {type:'text'}
      @options.push {text: option.text, type:'text', type_options:type_options, id: 0, is_active: true}
    @newOptions = []
    @$scope.focusLastOptionField()


  initOptions: (options) ->
    @options = options

    other_option = _(options).find (option) ->
      option.text.toLowerCase() is 'other'
      
    if @allow_other_option
      if other_option?
        @has_other_option = true
        _(options).splice(options.indexOf(other_option), 1)
      else
        @has_other_option = @$scope.$parent.$eval @$attrs.hasOtherOption
    @addOption() unless options.length

  addOption: ->
    type_options = {type:'text'}
    @options.push {text: "#{@option_label} #{@options.length + 1}",type:'text',type_options:type_options, id: 0, is_active: true}

    @$scope.focusLastOptionField()

  removeOption: ($index) ->
    @options.splice($index, 1)

  addColumnOptions: (index) =>
    @ModalFactory.invokeModal 'configure_grid_column',
      resolve:
        type_options: => angular.copy @options[index].type_options
      success:(response)=>
        @options[index].type = response.type
        @options[index].type_options = response
