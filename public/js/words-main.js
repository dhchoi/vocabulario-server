$(window).load(function () {
  var $btnAddWord = $(".btn-add-word");
  var $emptyNotice = $(".empty-notice");

  var $grid = $('.word-card-grid');
  $grid.masonry({
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    percentPosition: true,
    transitionDuration: 0
  });

  $(".search").keyup(function () {
    var filter = {
      field: ".word",
      match: $(this).val(),
      evaluate: function (value) {
        return value.search(new RegExp(this.match, "i")) < 0;
      }
    };
    filterWordCards(filter);
  });

  function filterWordCards(filter) {
    $grid.children(".grid-item").each(function () {
      var value = $(this).find(filter.field).text();
      if (filter.evaluate(value)) {
        $(this).fadeOut("fast", function () {
          $grid.masonry('layout');
        });
      }
      else {
        $(this).fadeIn("fast", function () {
          $grid.masonry('layout');
        });
      }
    });
  };

  $(".filters").find(".filter-by").on("click", function () {
    console.log($(this).data("filter-by"));
    $(this).toggleClass("selected");
  });

  toastr.options = {
    "positionClass": "toast-bottom-right",
    "progressBar": true
  };

  $(".word-card").each(function (index, value) {
    initializeCard($(value));
  });

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
    $this.find("i").toggleClass("fa-bars").toggleClass("fa-times");
    $this.parent().find(".card-actions").slideToggle({
      duration: "fast",
      progress: function () {
        $grid.masonry('layout');
      }
    });
  }

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
});
