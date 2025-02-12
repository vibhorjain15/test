angular.module('diligenceVault').factory 'materialThresholds', ($interval, BaseDataService) ->
  new class materialThresholds

    threshold_types = [
      {
        id: 0,
        text:'Absolute',

      }
      {
        id: 1,
        text:'Change'
      }
    ]

    getThresholdTypes: ->
      threshold_types

    computeOperators: (operator, val1, val2)=>
      switch operator
        when 'eq'
          return (val2 == val1)
        when 'gt'
          return (val2 > val1)
        when 'gte'
          return (val2 >= val1)
        when 'lt'
          return (val2 < val1)
        when 'lte'
          return (val2 <= val1)
        when 'noteq'
          return (val2 != val1)
        when 'ac'
          return true
        when 'cont'
          return ((val2.toLowerCase()).indexOf(val1.toLowerCase()) != -1)
        else
          false

    isThresholdValidForResponse: (threshold, response) =>
      if threshold.threshold_value && response.responseDisplay
        if threshold.responseTypeId in ['Boolean', 'BooleanPlus', 'NoPlus']
          threshold_value = if threshold.threshold_value == 'true' then 'Yes' else 'No'
          isThresholdValidForItem = @computeOperators(threshold.operator_id, threshold_value, response.responseDisplay)
        else
          isThresholdValidForItem = @computeOperators(threshold.operator_id, threshold.threshold_value, response.responseDisplay)
      else
        return false
      isThresholdValidForItem

    isThresholdValidForRow: (threshold, row, response_type) =>
      isThresholdValidForRow = false
      if threshold.type == 0
        i = 0
        while i < row.length
          if @isThresholdValidForResponse(threshold, row[i])
            isThresholdValidForRow = true
            break
          i++
      else if threshold.type == 1
        if response_type in ['Numeric', 'Integer', 'Percentage']
          if row[1].numericResponseA
            isThresholdValidForRow = @computeOperators(threshold.operator_id, threshold.threshold_value, ((row[0].numericResponseA - row[1].numericResponseA)/row[1].numericResponseA)*100)
          else
            isThresholdValidForRow = @computeOperators(threshold.operator_id, threshold.threshold_value, 100)
        else
          if row[0].responseDisplay
            if threshold.responseTypeId in ['Boolean', 'BooleanPlus', 'NoPlus']
              threshold_value = if threshold.threshold_value == 'true' then 'Yes' else 'No'
              isThresholdValidForRow = @computeOperators(threshold.operator_id, threshold_value, row[0].responseDisplay)
            else
              isThresholdValidForRow = @computeOperators(threshold.operator_id, threshold.threshold_value, row[0].responseDisplay)
      isThresholdValidForRow

    isThresholdsValid: (threshold, rows, response_type) ->
      isThresholdsValid = false
      j = 0
      while j < rows.length
        if @isThresholdValidForRow(threshold, rows[j], response_type)
          isThresholdsValid = true
          break
        j++
      isThresholdsValid

