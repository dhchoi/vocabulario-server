$(window).load(function () {
  /**
   * Initialize
   */
  var $grid = $('.word-card-grid');
  var masonryOpts = {
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    percentPosition: true,
    transitionDuration: 0
  };
  $grid.masonry(masonryOpts);

  toastr.options = {
    "positionClass": "toast-bottom-right",
    "progressBar": true
  };

  /**
   * Interactions
   */
  function deleteWord() {
    var $wordCardGridItem = $(this).closest(".grid-item");
    $.ajax({
      url: "/api/web/delete",
      method: "POST",
      data: "word=" + $(this).data().word
    }).done(function (response) {
      if (response.result) {
        $grid.masonry("remove", $wordCardGridItem).masonry("layout");
        toastr.success(response.message);
      }
      else {
        toastr.warning(response.message);
      }
    });
  }

  function starWord() {
    var $this = $(this);
    $.ajax({
      url: "/api/web/toggle-starred",
      method: "POST",
      data: "word=" + $(this).data().word
    }).done(function (response) {
      if (response.result) {
        $this.toggleClass("starred");
        toastr.success(response.message);
      }
      else {
        toastr.warning(response.message);
      }
    });
  }

  function rateWord() {
    var $this = $(this);
    var rating = $this.parent().find(".br-current").data("rating-value");
    $.ajax({
      url: "/api/web/rate",
      method: "POST",
      data: "word=" + $(this).data().word + "&rating=" + rating
    }).done(function (response) {
      if (response.result) {
        $this.parent().find(".select-rate").attr("data-current-rate", rating);
        $this.hide();
        toastr.success(response.message);
      }
      else {
        toastr.warning(response.message);
      }
    });
  }

  function toggleActions() {
    var $this = $(this);
    $this.toggleClass("toggled");
    $this.parent().find(".card-actions").slideToggle({
      duration: "fast",
      progress: function () {
        $grid.masonry('layout');
      }
    });
  }

  $(".word-card").each(function (index, value) {
    initializeCard($(value));
  });

  function initializeCard($card) {
    $card.on("click", ".btn-star-word", starWord);
    $card.on("click", ".btn-rate-word", rateWord);
    $card.on("click", ".btn-delete-word", deleteWord);
    $card.on("click", ".btn-toggle-actions", toggleActions);
    $card.find(".select-rate").barrating({
      theme: 'bars-1to10',
      showValues: false,
      showSelectedRating: false,
      onSelect: function () {
        $(this).closest(".card-actions").find(".btn-rate-word").show();
      }
    });
  }

  /**
   * Filters
   */
  var filterOptions = {
    isRated: {}
  };

  function isStarred($gridItem) {
    return $gridItem.find(".btn-star-word").hasClass("starred");
  }

  function isRated(rate) {
    return function($gridItem) {
      return $gridItem.find(".select-rate").attr("data-current-rate") == rate;
    };
  }

  function hasKeyword(keyword) {
    return function ($gridItem) {
      return $gridItem.find(".word").text().search(new RegExp(keyword, "i")) >= 0;
    };
  }

  function filterWordCards() {
    $grid.children(".grid-item").each(function () {
      var $gridItem = $(this);
      var isFiltered = true;
      var hasRateFilter = false;
      var isRated = false;
      $.each(filterOptions, function(key, filterFunction) {
        if(key === "isRated") {
          if(!$.isEmptyObject(filterOptions.isRated)) {
            hasRateFilter = true;
            $.each(filterOptions.isRated, function (k, rateFilterFunction) {
              isRated = isRated || rateFilterFunction($gridItem);
            });
          }
        }
        else {
          isFiltered = isFiltered && filterFunction($gridItem);
        }
      });

      if(hasRateFilter) {
        isFiltered = isFiltered && isRated;
      }

      if (isFiltered) {
        $(this).show();
      }
      else {
        $(this).hide();
      }
    });

    $grid.masonry('layout');
  }

  $(".search").keyup(function () {
    var keyword = $(this).val();
    if(keyword.length > 0) {
      filterOptions.hasKeyword = hasKeyword(keyword);
    }
    else {
      delete filterOptions.hasKeyword;
    }
    filterWordCards();
  });

  $(".filter-by-starred").on("click", function () {
    $(this).toggleClass("selected");
    if($(this).hasClass("selected")) {
      filterOptions.isStarred = isStarred;
    }
    else {
      delete filterOptions.isStarred;
    }
    filterWordCards();
  });

  $(".filter-by-rate").on("click", function () {
    var rate = $(this).text();
    $(this).toggleClass("selected");
    if($(this).hasClass("selected")) {
      filterOptions.isRated["isRated"+rate] = isRated(rate);
    }
    else {
      delete filterOptions.isRated["isRated"+rate];
    }
    filterWordCards();
  });

  $(".sort-by").on("click", function () { // TODO: optimize this
    $this = $(this);
    if (!$this.hasClass("check")) {
      // toggle classes
      $this.toggleClass("check");
      $(".sort-by-options").find("a").each(function () {
        if (!$(this).is($this)) {
          $(this).removeClass("check");
        }
      });
      // sort
      var sortBy = $(this).data("sort-by");
      var orderBy = $(this).data("order-by");
      var sortOptions = null;
      if(sortBy === ".created") {
        sortOptions = {
          selector: sortBy,
          order: orderBy,
          data: "epoch"
        };
      }
      else if (sortBy === ".word") {
        sortOptions = {
          selector: sortBy,
          order: orderBy
        };
      }
      else if (sortBy === ".select-rate") {
        sortOptions = {
          selector: sortBy,
          order: orderBy,
          data: "current-rate"
        };
      }
      tinysort('.grid-item', sortOptions);
      $grid.masonry('destroy');
      $grid.masonry(masonryOpts);
    }
  });


  /**
   * Adding Word
   */
  var $btnAddWord = $(".btn-add-word");
  var $emptyNotice = $(".empty-notice");

  $btnAddWord.on("click", function (event) {
    event.preventDefault();
    addWord();
  });
  $(".form-add-word").on("keypress", function (event) {
    if (event.which == 13) {
      event.preventDefault();
      addWord();
    }
  });

  function addWord() {
    $btnAddWord.button("loading");
    $.ajax({
      url: "/api/web/add",
      method: "POST",
      data: "word=" + $(".input-add-word").val()
    }).done(function (response) {
      if (response.result) {
        if($emptyNotice) { $emptyNotice.remove(); }
        var $newWordCard = $(Handlebars.compile($("#word-card-template").html())(response));
        initializeCard($newWordCard);
        $grid.append($newWordCard).masonry("appended", $newWordCard);
        toastr.success(response.message);
      }
      else {
        toastr.warning(response.message);
      }
      $btnAddWord.button("reset");
    });
  }
});
