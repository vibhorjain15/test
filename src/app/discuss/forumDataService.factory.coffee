angular.module('diligenceVault').factory 'forumDataService', ->

  titles = [
    'Are there startups that make their due diligence documents public?'
    'What is the biggest red flag you should heed during due diligence with a VC?'
    'What is the future of due diligence?'
    'What are the things you should know before buying a foreclosure home at an auction?'
    'How do you research a small company?'
    'What is the importance of customer due diligence as a critical element in the effective management of banking risks?'
    'How do I structure a pragmatic but professional virtual data room for a due diligence process?'
    'What is an example of a set of documents needed to successfully raise $500,000 for a early stage company through due diligence?'
    'What are questions that an entrepreneur should be asking of the investors?'
    'What is due diligence?'
    'I registered on Groupon today and know nothing about it. I\'m interested in making a purchase. Is due diligence necessary before paying for something on Groupon, or are there enough safeguards that it\'s unwarranted?'
    'What is Derek C. Cheung\'s research and investment process (sourcing, due-diligence process, and trigger pulling)?'
    'What are typical due diligence costs that a consulting firm charges for private equity due diligence?'
    'What is a good list to go through during the due diligence process of an acquisition?'
    'How do you read the balance sheet of a company?'
    'How do you determine an appropriate EBITDA exit multiple for a given company?'
    'What is the nature of due diligence I should do on for an EB-5 Visa related investment?'
    'I have a group of angel investors who have formed an investment group that are performing due diligence. Is this something that is recommended to share?'
    'What are some telltale signs a startup team is going to outperform or underperform other teams?'
    'When you\'re thinking about buying a business, what are the top 5 must ask questions?'
    'What types of due diligence are undertaken by VCs before investing in a company?'
    'What due diligence will a VC do on entrepreneurs - prior to investing?'
    'Will VCs and investors require drug screening during due diligence?'
    'The U.S. requires that commercial banks, pensions and governments only invest in bonds rated as investment grade by NRSROs. How do other countries deal with this issue?'
    'Are credit rating agencies to blame for the US financial crisis? Why?'
    'What should I be aware of as I\'m exiting a company I founded, with respect to due diligence and commonly overlooked procedures?'
    'Is it normal for the investor\'s lawyers to request full access to the founders email in a due-diligence?'
    'What is your experience of performing due diligence in China?'
    'How do you know if a potential acquirer is actually interested in your company or if they are just trying to take a look at your books or have other ulterior motives?'
    'What is the proper way to do due diligence on a VC firm?'
    'In layman\'s terms, what does due diligence mean?'
    'I am about to make my first angel investment. What should I do (structure, legal call, etc.) before I wire the money?'
    'What\'s the best format for due diligence on an early stage technology company for a possible investment?'
    'What are the best resources to learn about performing due diligence?'
    'How do you do commercial due diligence?'
    'Why is project due diligence so important when deciding which EB-5 visa project to invest in?'
    'Are VC\'s usually doing the Due Diligence alone or do they hire consultants (e.g. BIG 4 due diligence specialists) to do it?'
    'Who performs due diligence on the operations of technology companies for private equity or venture capital firms, and how do they perform it?'
    'How do you complete a bottom\'s up sizing analysis for startup due diligence?'
  ]

  categories = [
    'due-diligence'
    'venture-capital'
    'investments'
    'equity'
    'angel-investing'
    'startup'
  ]

  users = [
    {
      name: 'Monica Geller'
      bio: 'Monica E. Geller is a fictional character in the American sitcom Friends, portrayed by Courteney Cox. Monica is known as the \'Mother Hen\' of the group and her Greenwich Village apartment is one of the group\'s main gathering places. She is also known for her obsessive-compulsive personality and competitive nature'
      image_url: '//upload.wikimedia.org/wikipedia/en/d/d0/Courteney_Cox_as_Monica_Geller.jpg'
      gender: 'female'
    }
    {
      name: 'Chandler Bing'
      bio: 'Chandler Muriel Bing is a fictional character from the NBC sitcom Friends, portrayed by Matthew Perry.'
      image_url: '//upload.wikimedia.org/wikipedia/en/6/6c/Matthew_Perry_as_Chandler_Bing.jpg'
      gender: 'male'
    }
    {
      name: 'Joey Tribbiani'
      bio: 'Joey is portrayed as promiscuous and dim-witted, but very loyal and protective of his friends. As a struggling actor, he is constantly looking for work. He also has a soft toy penguin named Hugsy (his bedtime penguin pal), whom he is very fond of and does not like to share. He also doesn\'t like sharing food and has difficulty with simple mathematics'
      image_url: '//upload.wikimedia.org/wikipedia/en/d/da/Matt_LeBlanc_as_Joey_Tribbiani.jpg'
      gender: 'male'
    }
    {
      name: 'Pheobe Buffay'
      bio: 'Phoebe Buffay-Hannigan is a fictional character from the NBC sitcom Friends, portrayed by Lisa Kudrow.[2] For her portrayal of Phoebe Buffay, Kudrow received a Golden Globe Award nomination, as well as winning the Primetime Emmy Award, Screen Actors Guild Award, Satellite Award, and American Comedy Award.'
      image_url: '//upload.wikimedia.org/wikipedia/en/f/f6/Friendsphoebe.jpg'
      gender: 'female'
    }
    {
      name: 'Ross Geller'
      bio: 'Ross Eustace Geller, Ph.D. is a fictional character from the NBC sitcom Friends, portrayed by David Schwimmer. Ross is the smartest member of the group and is noted for his goofy, lovable demeanor. His relationship with Rachel Green was included in TV Guide\'s list of the best TV couples of all time, as well as Entertainment Weekly\'s \'30 Best \'Will They/Won\'t They?\' TV Couples\''
      image_url: '//upload.wikimedia.org/wikipedia/en/6/6f/David_Schwimmer_as_Ross_Geller.jpg'
      gender: 'male'
    }
    {
      name: 'Rachel Karen Greene'
      bio: 'Rachel Karen Green is a fictional character, one of the six main characters who appear in the American NBC sitcom Friends. Portrayed by actress Jennifer Aniston, the character was created by show creators David Crane and Marta Kauffman, and appeared in each of the show’s 236 episodes during its decade-long run, from its premiere on September 24, 1994 to its finale on May 6, 2004. Introduced in the show\'s pilot as a runaway bride who reunites with her childhood best friend Monica and relocates to New York City, Rachel gradually evolves from a spoiled, inexperienced daddy\'s girl into a successful businesswoman. During the show\'s second season, the character becomes romantically involved with her friend Ross, with whom she maintains a distinct on-again, off-again relationship throughout the entire series. Together the characters have a daughter, Emma.'
      image_url: '//upload.wikimedia.org/wikipedia/en/e/ec/Jennifer_Aniston_as_Rachel_Green.jpg'
      gender: 'female'
    }
  ]

  setFollowers = (question) ->
    question.followers = _.sample(users, 3)
    question.author = _.sample(users)

  getSlugForTitle = ((title) -> title.replace(/\?/g, '').replace /(\s+)/g, '-')

  class Question
    constructor: (options) ->
      _(@).extend(options)

      @favorite_count = _.random(0, 10)
      @view_count = _.random(2000, 5000)
      @answer_count = _.random(0, 20)
      @categories = _.map(_.sample(categories, _.random(1, 3)), (name) ->
        { name: name }
      )
      @created_at = moment().subtract(_.random(0, 10), 'day')
      @slug = getSlugForTitle(@title)


  class Activity
    constructor: (options) ->
      @type = options.type
      @created_at = moment().subtract(_.random(0, 50), 'day')
      @question = _(_.sample(questions)).pick('title', 'slug')

      if @type is 'answer'
        @answer = 'Well the others have said it all - this is not only absurd, but a clear reason for you to cut and run. Of course it may just be the lawyer adding value -- this issue is who\'s asking the question that will determine as to how fast you should run. If this originates from the funder/VC (hard as it\'s to believe) - that\'s about as big a red flag as you can have (as Brad Feld & others have pointed out).'

  class User
    constructor: (options) ->
      _(options).each ((value, key) ->
        @[key] = value
        return
      ), this
      @username = @name.toLowerCase().replace(/\s+/g, '.')
      @role = _.sample([
        'Managing Director'
        'Directing Manager'
        'Investor'
        'Cofounder'
        'Director'
      ])
      @location = _.sample([
        'Central Perk'
        'Yemen'
        'London'
        'Iceland'
        'Narnia'
        'Gargantua'
      ])
      @organization = _.sample([
        'Gryffindor Inc.'
        'Stark Industries'
        'Javu restaurant'
        'Ralph Lauren'
      ])
      @activities = []
      if _.sample([
          0
          1
          2
          3
        ])
        @favorite_count = _.random(10, 50)
        @question_count = _.random(10, 50)
        @answer_count = _.random(10, 50)
        @contribution_count = _.random(10, 50)
      else
        @favorite_count = 0
        @question_count = 0
        @answer_count = 0
        @contribution_count = 0
        @bio = null
      _(_.range(@favorite_count)).each (->
        @activities.push new Activity(type: 'favorite')
        return
      ), this
      _(_.range(@answer_count)).each (->
        @activities.push new Activity(type: 'answer')
        return
      ), this
      _(_.range(@question_count)).each (->
        @activities.push new Activity(type: 'question')
        return
      ), this
      @activities = _(@activities).sortBy((activity) ->
        -activity.created_at
      )
      @categories = _(categories).sample(3)
      return

  questions = _(titles).map((title, idx) ->
    new Question(title: title, id: idx + 1)
  )

  users = _(users).map((attrs, idx) ->
    new User(_(attrs).extend(id: idx + 1))
  )

  _(questions).each setFollowers

  new class ForumDataService
    getMatcher = (matcher) ->
      (question) ->
        matcher.test question.title

    getQuestions: (options) ->
      primary_matcher = undefined
      results = questions
      page_count = 10
      min = (options.page - 1) * page_count
      max = min + page_count

      if options.q
        primary_matcher = new RegExp(options.q.replace(/\?/g, ''), 'i')
        results = _(results).filter((question) ->
          primary_matcher.test question.title
        )

      if options.category
        results = _(results).filter((question) ->
          category_names = _(question.categories).pluck('name')
          if !_.isArray(options.category)
            options.category = [ options.category ]
          _.intersection(options.category, category_names).length == options.category.length
        )

      results = _(results).sortBy((question) ->
        -question[options.sort]
      )

      {
        meta:
          total_pages: Math.ceil(results.length / page_count)
          data_length: results.length
        questions: results.slice(min, max)
      }


    getUserByUsername: ((username) -> _(users).findWhere({username: username}))


    getCategories: (-> categories)


    getSecondaryMatcher: (text) ->
      text = text.replace(/\?/g, '')
      words = text.trim().split(/\s/g)
      words_wrapped_in_paranthesis = _(words).map((word) ->
        '(' + word + ')'
      )

      new RegExp(words_wrapped_in_paranthesis.join('|'), 'ig')


    getSimilarQuestions: (primary_matcher, secondary_matcher) ->
      primary_matches = _(questions).filter(getMatcher(primary_matcher))
      secondary_matches = _(questions).filter(getMatcher(secondary_matcher))

      _.uniq _(primary_matches).concat(secondary_matches)


    getPopularTags: ->
      _.sample(categories, _.random(1, 5)).map (name) ->
        {
          name: name
          question_count: _.random(1, 50)
        }


    getQuestion: (slug) ->
      question = _(questions).findWhere({slug: slug})

      @formatQuestion question


    getTopQuestions: (-> _.sample(questions, 3))


    getRecentQuestions: (-> @getTopQuestions())


    formatQuestion: (question) ->
      top_three_followers = question.followers.slice(0, 3)
      question.follower_string = _(top_three_followers).pluck('name').join(', ') + ' and 2 others'
      question.created_at_in_words = question.created_at.fromNow()

      question


    formatQuestions: (questions) ->
      _(questions).each @formatQuestion

      questions
