$(window).load(function () {
    var $grid = $('.word-card-grid');
    $grid.masonry({
        itemSelector: '.grid-item',
        columnWidth: '.grid-sizer',
        percentPosition: true,
        transitionDuration: 0
    });

    $(".btn-delete-word").on("click", deleteWord);
    $(".btn-add-word").on("click", function(event) {
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
        $.ajax({
            url: "/api/web/add",
            method: "POST",
            data: "word="+$(".input-add-word").val()
        }).done(function (response) {
            if (response.result) {
                var $newWordCard = $(Handlebars.compile($("#word-card-template").html())(response));
                $newWordCard.find(".btn-delete-word").on("click", deleteWord);
                $grid.append($newWordCard).masonry("appended", $newWordCard);
                toastr.success(response.message);
            }
            else {
                toastr.warning(response.message);
            }
        });
    }

    function deleteWord() {
        var $wordCardGridItem = $(this).parent().parent().parent();
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
});
