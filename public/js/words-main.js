$(window).load(function () {
  var $btnAddWord = $(".btn-add-word");

  var $grid = $('.word-card-grid');
  $grid.masonry({
    itemSelector: '.grid-item',
    columnWidth: '.grid-sizer',
    percentPosition: true,
    transitionDuration: 0
  });

  toastr.options = {
    "positionClass": "toast-bottom-right",
    "progressBar": true
  };

  $(".word-card").each(function(index, value) {
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
    $(this).find("i").toggleClass("starred");
  }

  function confirmRate() {
    $(this).hide();
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
    $card.on("click", ".btn-confirm-rate", confirmRate);
    $card.on("click", ".btn-delete-word", deleteWord);
    $card.on("click", ".card-control", toggleActions);
    $card.find(".select-rate").barrating({
      theme: 'bars-1to10',
      showValues: false,
      showSelectedRating: false,
      onSelect: function () {
        $(this).closest(".card-actions").find(".btn-confirm-rate").show();
      }
    });
  }
});
