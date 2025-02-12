angular.module('diligenceVault').factory 'QuestionnaireGridResponseFactory', (DueDiligenceDataservice) ->
  class GridResponse
    constructor: (@row, @column, attrs, is_calculation_disabled) ->
      angular.extend(@, attrs)

      @cid = _.uniqueId('grid_response_')
      @is_calculation_disabled = is_calculation_disabled
      @valid = true
      @formulaValid = true

      if @isNew()
        @attributes = {}

    copyCurrentAttributes: ->
      @_previousAttributes = _(@attributes).pick('value','mode')

    isNew: -> not @id?

    hasUnsavedChanges: ->
      @attributes.value isnt @_previousAttributes.value

    hasUnsavedModeChanges: ->
      current_mode = @attributes.mode
      old_mode = @_previousAttributes.mode

      unless current_mode or old_mode
        return false

      current_mode isnt old_mode

    isEmpty: ->
      not @attributes.value

    isValid: ->
      @valid
    
    isFormulaValid: ->
      @formulaValid

    setValid: (valid)->
      @valid = valid

    setFormulaValid: (valid)->
      @formulaValid = valid

    rollback: ->
      _(@attributes).extend(@_previousAttributes)

    rollbackAttributes: ->
      @attributes = angular.copy @_previousAttributes

    getValueAttributes: ->
      attrs = {
        row_id: @row.id,
        column_id: @column.id,
        row_group_id:@row.group_id
        column_group_id: @column.group_id
        mode: @attributes.mode
      }
      if @attributes.formula or @attributes.instantFormula
        attrs.value = @attributes.calculatedValue
      else
        attrs.value = @attributes.value
      attrs

    serializeAttributes: ->
      @getValueAttributes()

    resetValueAttrs: ->
      if @attributes.value? and !@attributes.formula
        @attributes.value = null


  new class QuestionnaireGridResponseFactory
    $new: (row, column, attrs, is_calculation_disabled) ->
      new GridResponse(row, column, attrs, is_calculation_disabled)
