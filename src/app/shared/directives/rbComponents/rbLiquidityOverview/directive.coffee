angular.module('diligenceVault').directive 'rbLiquidityOverview', (FundDataservice) ->
  restrict: 'E'
  templateUrl: 'shared/directives/rbComponents/rbLiquidityOverview/template.html'
  link: (scope) ->
    FundDataservice.getFund(scope.component.options.entity_id).then (response) =>
      ###console.log("response",response)###

    scope.is_PE = true;
    scope.profile_data = {
      'id': 1
      'category': 'Fund Raising'
      'fund_aum': 450
      'inception_date': '1-Aug-12'
      'hwm': 'Yes'
      'cio': 'Milano Garcia'
      'firm_aum': 960
      'fund_count': 1
      'employee_count': 15
      'investor_count': 10
      'firm_ownership': '100%'
      'name': 'IFCI Sycamore Brazil Infrastructure Fund'
      'strategy': 'Infrastructure'
      'performance_fee': null
      'management_fee': 2
      'carry_fee': 18
      'structure': 'PE'
    }
