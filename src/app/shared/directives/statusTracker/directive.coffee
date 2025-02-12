angular.module('diligenceVault').directive 'statusTracker', ->
	restrict: 'E',
	templateUrl: 'shared/directives/statusTracker/template.html',
	replace: true,
	require: 'ngModel'
	link: (scope, element, attrs, ngModel) ->
		scope.states = scope.$eval attrs.states

		scope.$watch attrs.title, (value) ->
			if value
				scope.title = value
			else
				scope.title = "Status Tracker"

		scope.$watch attrs.dvCompleteWhen, (value) ->
			if value
				_(scope.states).each (state, idx) ->
					state.status = "done"

		ngModel.$render = ->
			value = @$viewValue

			curr_state = _(scope.states).find (state) ->
				if state.sub_states?
					return _(state.sub_states).find (sub_state) ->
						sub_state.value is value
				else
					state.value is value

			curr_idx = scope.states.indexOf curr_state

			_(scope.states).each (state, idx) ->
				if idx < curr_idx
					state.status = "done"
				else if idx > curr_idx
					state.status = "todo"
				else
					state.status = "current"
