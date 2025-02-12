describe("NewDiscussionController", function() {
    var controller, $scope;

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $rootScope, forumDataService, $sce) {});
    });

    beforeEach(function() {
        $scope = $rootScope.$new();
        controller = $controller('NewDiscussionController', {$scope: $scope});
        sinon.stub($sce, 'trustAsHtml', function(str) {
            return str;
        });
    });

    it('should have max title character length set to 300', function() {
        expect(controller.max_title_char_length).to.equal(300);
    });

    describe('highlight', function() {
        it('should try to highlight using primary_matcher if it matches', function() {
            controller.question.title = 'How you doin ?';
            expect(controller.highlight('How you doin ?')).to.equal('<b>How you doin ?</b>');
        });

        it("should try to highlight using secondary_matcher if primary_matcher doesn't match the text", function() {
            controller.question.title = 'How you doin ?';
            expect(controller.highlight('How doin')).to.equal('<b>How</b> <b>doin</b>');
        });
    });
});
