$(window).load(function () {
  console.log(window.ratingsData);
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
      // TODO: also show dataset of average among all users
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
    //legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\" style=\"list-style-type: none\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>"
    legendTemplate: "<% for (var i=0; i<datasets.length; i++){%><span style=\"background-color:<%=datasets[i].strokeColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span><%}%>"
  });
  console.log(chart.generateLegend());
  $(".legend").html(chart.generateLegend());

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
