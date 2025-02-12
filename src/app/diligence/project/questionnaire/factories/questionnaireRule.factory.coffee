angular.module('diligenceVault').factory 'QuestionnaireRuleFactory', ->
  class Rule
    constructor: (attrs) ->
      angular.extend(@, attrs)

    passes: (value) ->
      expected_value = @attributes.value
      operator = @operator.value

      if operator in ['eq', 'noteq']
        value = value?.toString()
        expected_value = expected_value?.toString()
      else
        value = value && parseFloat(value)
        expected_value = expected_value && parseFloat(expected_value)

      switch @operator.value
        when 'eq'
          value is expected_value
        when 'noteq'
          value isnt expected_value
        when 'gt'
          value > expected_value
        when 'gte'
          value >= expected_value
        when 'lt'
          value < expected_value
        when 'lte'
          value <= expected_value

  new class QuestionnaireRuleFactory
    $new: (attrs) ->
      new Rule(attrs)
