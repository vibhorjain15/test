describe('searchQuestionForm', function() {
    var element, $scope;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($compile, $rootScope) {});
        $scope = $rootScope.$new();
        $scope.filters = {};
    });

    it('should set category_placeholder if filters.category is empty', function() {
        element = $compile('<search-question-form filters="filters"></search-question-form>')($scope);
        $scope.$digest();
        expect(element.find("#category").attr("placeholder")).to.equal("Start typing a category");
    });

    it('should unset category_placeholder if filters.category is not empty', function() {
        $scope.filters.category = ['foo'];
        element = $compile('<search-question-form filters="filters"></search-question-form>')($scope);
        $scope.$digest();
        expect(element.find("#category").attr("placeholder")).to.equal(" ");
    });

    it('should set fund_placeholder if filters.fund is empty', function() {
        element = $compile('<search-question-form filters="filters"></search-question-form>')($scope);
        $scope.$digest();
        expect(element.find("#fund").attr("placeholder")).to.equal("Start typing a fund type");
    });

    it('should unset fund_placeholder if filters.fund is not empty', function() {
        $scope.filters.fund = ['foo'];
        element = $compile('<search-question-form filters="filters"></search-question-form>')($scope);
        $scope.$digest();
        expect(element.find("#fund").attr("placeholder")).to.equal(" ");
    });
});
