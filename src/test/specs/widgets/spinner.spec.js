describe('spinner', function() {
    var element;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($compile, $rootScope) {});
    });

    it('should have font awesome spin class', function() {
        element = $compile('<spinner></spinner>')($rootScope);
        $rootScope.$digest();
        expect(angular.element(element).find('i').hasClass('fa-spinner')).to.be.true;
        expect(angular.element(element).find('i').hasClass('fa-spin')).to.be.true;
        expect(angular.element(element).find('i').hasClass('fa')).to.be.true;
    });
});
