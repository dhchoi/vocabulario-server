$(window).load(function () {
  var ratingsData = getAxes(window.ratingsData);
  var chartData = {
    labels: ratingsData.dates,
    datasets: [
      {
        label: "You",
        fillColor: "rgba(151,187,205,0.2)",
        strokeColor: "rgba(151,187,205,1)",
        pointColor: "rgba(151,187,205,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(151,187,205,1)",
        data: ratingsData.rates
      },
      {
        label: "Average",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: getAverageRates(ratingsData.rates)
      }
    ]
  };

  var ctx = $(".chart").get(0).getContext("2d");
  var chart = new Chart(ctx).Line(chartData, {
    responsive: true,
    scaleOverride: true,
    scaleSteps: 4,
    scaleStepWidth: 1,
    scaleStartValue: 1,
    legendTemplate: "<% for (var i=0; i < datasets.length; i++){%><span style=\"background-color:<%=datasets[i].strokeColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span><%}%>"
  });
  $(".legend").html(chart.generateLegend());

  // TODO: also show dataset of average among all users
  function getAverageRates(rates) {
    var average = [];
    for(var i = 0; i < rates.length; i++) {
      average.push(3.2);
    }

    return average;
  }

  function getAxes(ratings) {
    var axes = {
      rates: [],
      dates: []
    };

    $.each(ratings, function (key, rating) {
      axes.rates.push(rating.rate);
      axes.dates.push(moment(new Date(rating.saved)).format("MMMM Do YYYY"));
    });

    return axes;
  }
});
