var express = require('express');
var superagent = require('superagent');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var urls = require('./constants');
var app = express();

app.get('/test', function (req, res) {
  var brands = Object.keys(urls);
  for (var brand of brands) {
    if (urls[brand].NEXT) {
      console.log(urls[brand].NEXT.replace("{0}", "test"));
    }
  }
  res.send('aman');
});

function post(payload, url) {
  superagent
    .post(url)
    .send(payload)
    .set('Accept', 'application/json')
    .end(function (err) {
      if (err) {
        console.log(`error on saving ${payload.name}`);
        console.log("Retrying...");
        post(payload);
      } else {
        console.log(`${payload.name} successfully saved`);
      }
    });
}

function requestProductDom(url, brandId, keyword) {
  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      $('#review-body').filter(function () {
        var parent = $(".makers");
        parent.find('ul').children().each(function (idx, element) {
          var ulElement = $(this);
          var imgElement = ulElement.find('img');
          var link = ulElement.find('a');
          var name = ulElement.find("span").text();
          var description = imgElement.attr('title');
          var imageUrl = imgElement.attr('src');
          var href = link.attr("href");
          var orderId = href.split(".")[0].split("-")[1];
          var jsonObject = {
            name: name,
            description: description,
            imageurl: imageUrl,
            detailurl: href,
            brandId: brandId,
            keyword: keyword,
            orderId: orderId
          }
          post(jsonObject, 'http://52.221.230.61:9000/api/items');
        });
      });
    }
  });
}

app.get('/scrapeProduct', function (req, res) {
  var brandNames = Object.keys(urls);
  for (var brandName of brandNames) {
    var metaBrand = urls[brandName];
    var url;
    for (var i = 1; i <= metaBrand.TOTAL_PAGE; i++) {
      if (i === 1) {
        url = `http://www.gsmarena.com/${metaBrand.FIRST}`;
      } else {
        var brandUrl = metaBrand.NEXT.replace("{0}", i);
        url = `http://www.gsmarena.com/${brandUrl}`;
      }
      requestProductDom(url, metaBrand.BRAND_ID, metaBrand.KEYWORD);
    }
  }
  res.send('Check your console!');
});

app.get('/scrapeBrand', function (req, res) {
  var url = "http://www.gsmarena.com/makers.php3";
  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      $('.st-text').filter(function () {
        var parent = $("table");
        parent.find('td').each(function (idx, element) {
          console.log($(this).find("a").text());
          var element = $(this);
          var a = element.find("a").html().split("<br>");
          var title = a[0];
          var totalDevices = $(a[1]).text().split(" ")[0];
          var jsonObject = {
            title: title,
            totalProducts: parseInt(totalDevices, 10)
          }
          post(jsonObject, 'http://52.221.230.61:9000/api/brands');
        });
      });
    }
  });
  res.send('Check your console!');
});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
