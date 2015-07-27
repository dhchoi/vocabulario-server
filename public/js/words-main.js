$(window).load(function () {
    var $btnAddWord = $(".btn-add-word");

    initializeBarRating($('.select-confidence-rate'));

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

    $(".btn-delete-word").on("click", deleteWord);
    $btnAddWord.on("click", function(event) {
        event.preventDefault();
        addWord();
    });
    $(".form-add-word").on("keypress", function(event){
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
            data: "word="+$(".input-add-word").val()
        }).done(function (response) {
            if (response.result) {
                var $newWordCard = $(Handlebars.compile($("#word-card-template").html())(response));
                $newWordCard.find(".btn-delete-word").on("click", deleteWord);
                initializeBarRating($newWordCard.find(".select-confidence-rate"));
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
        }).done(function(response) {
            if (response.result) {
                $grid.masonry("remove", $wordCardGridItem).masonry("layout");
                toastr.success(response.message);
            }
            else {
                toastr.warning(response.message);
            }
        });
    }

    function initializeBarRating($el) {
        $el.barrating({
            theme: 'bars-1to10',
            showValues: false,
            showSelectedRating: false,
            onSelect: function () {
                console.log("selected!");
            }
        });
    }
});
