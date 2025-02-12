describe("DiscussionDetailController", function() {
    var controller, popular_tags, top_questions, recent_questions, question;

    before(function() {
        popular_tags = ['tag1', 'tag2'];
        top_questions = [{title: 'some question title', answer_count: 121}, {title: 'some other question title'}];
        recent_questions = [{title: 'some recent question title'}];
        question = top_questions[0];
    });

    beforeEach(function() {
        module('diligenceVault');
        specHelper.injector(function($controller, $rootScope, forumDataService, $sce) {});
    });

    beforeEach(function() {
        sinon.stub(forumDataService, 'getPopularTags').returns(popular_tags);
        sinon.stub(forumDataService, 'getTopQuestions').returns(top_questions);
        sinon.stub(forumDataService, 'getRecentQuestions').returns(recent_questions);
        sinon.stub(forumDataService, 'formatQuestions', function(questions) {
            return questions;
        });
        sinon.stub(forumDataService, 'getQuestion').returns(question);
    });

    beforeEach(function() {
        $scope = $rootScope.$new();
        controller = $controller('DiscussionDetailController', {$stateParams: {slug: 'some-slug'}});
    });

    it('should fetch popular_tags from forumDataService', function() {
        expect(controller.popular_tags).to.equal(popular_tags);
    });

    it('should fetch top_questions from forumDataService', function() {
        expect(controller.top_questions).to.equal(top_questions);
    });

    it('should fetch recent_questions from forumDataService', function() {
        expect(controller.recent_questions).to.equal(recent_questions);
    });

    it('should fetch question from the slug', function() {
        expect(controller.question).to.equal(question);
        forumDataService.getQuestion.should.have.been.calledWith('some-slug');
        expect(controller.question.answer_count).to.equal(121);
    });

    it('should hide answer form unless specified in $stateParams', function() {
        expect(controller.hide_answer_form).to.be.true;
    });

    it('should hide tinymce menubar and statusbar', function() {
        expect(controller.tinymceOptions.menubar).to.be.false;
        expect(controller.tinymceOptions.statusbar).to.be.false;
    });

    describe('displaying answer form', function() {
        beforeEach(function() {
            controller = $controller('DiscussionDetailController', {$stateParams: {
                slug: 'some-slug',
                action: 'write_answer'
            }});
        });

        it('should reveal answer form if specified via $stateParams', function() {
            expect(controller.hide_answer_form).to.be.false;
        });
    });
});
