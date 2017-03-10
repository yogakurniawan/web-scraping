var express = require('express');
var superagent = require('superagent');
var axios = require('axios');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var urls = require('./constants');
var app = express();

function post(payload, url) {
  superagent
    .post(url)
    .send(payload)
    .set('Accept', 'application/json')
    .end(function (err) {
      if (err) {
        // console.log(`error on saving ${payload.name}`);
        // console.log("Retrying...");
        // console.log(payload);
        post(payload, url);
      } else {
        // console.log(`${payload.name} successfully saved`);
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
            orderId: parseInt(orderId),
            createdDate: new Date(),
            updatedDate: new Date()
          }
          post(jsonObject, 'http://52.221.230.61:9000/api/items');
        });
      });
    }
  });
}

app.get('/scrapeProduct', function (req, res) {
  var brandsUrl = "http://52.221.230.61:9000/api/brands";
  axios.get(brandsUrl)
    .then(function (response) {
      var brands = response.data;
      for (var brand of brands) {
        var url;
        console.log(brand);
        for (var i = 1; i <= brand.totalPage; i++) {
          if (i === 1) {
            url = `http://www.gsmarena.com/${brand.firstUrl}`;
          } else {
            var nextUrl = brand.nextUrl.replace("{0}", i);
            url = `http://www.gsmarena.com/${nextUrl}`;
          }
          requestProductDom(url, brand.id, brand.title.toLowerCase());
        }
      }
    })
    .catch(function (error) {
      console.log("error on requesting data");
      console.log(error);
    });
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

app.get('/test', function (req, res) {
  get('http://52.221.230.61:9000/api/brands');
  res.send('Check your console!');
});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
