/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect      = require('chai').expect;
const MongoClient = require('mongodb');
const ObjectId    = require('mongodb').ObjectId;
const express     = require("express");
const request     = require('request');
const yahooFinance= require('yahoo-finance');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
     .get((req, res) => {
       let output = [];
       let url = 'https://finance.google.com/finance/info';
       let company = req.query.stock;
       let likeNum;
       if(req.query.like) {
         likeNum = 1;
       } else {
         likeNum = 0;
       }
    
       MongoClient.connect(CONNECTION_STRING, (err, client) => {
         const db = client.db("stock_price_checker");
         
         for (let i = 0; i < company.length; i++) {
           const element = company[i].toUpperCase();
           
           yahooFinance.quote({
            symbol: element,
            modules: ['price', 'summaryDetail']
          }, (err, quotes) => {
             let query = {
               name: element
             };
             db.collection("stock")
               .find(query).toArray((err, result)=> {
                 if(err) throw err;
                 if(!result[0].ip(req.ip)){
                   let action = { $inc: {"like": likeNum}, 
                                  $push: {"ip": req.ip}}
                   db.collection('stock').updateOne(query, action, {upsert: true}, (err, doc) => { if (err) throw err; });
                 }
                 
                 new Promise((resolve, reject) => {
                   (db.collection('stock').find({ _id: result[0]._id }).toArray((err, resultat)=> {
                     resolve(resultat);    
                     output.push ({
                       "stock":element ,
                       "shortname":quotes.shortName,
                       "price": quotes.price.regularMarketPrice,
                       "likes": resultat[0].like
                    
                  })
                     if(i === company.lengt-1) {
                        if(company.length>1){  
                          let rellikes1= output[0].likes - output[1].likes 
                          let rellikes2= output[1].likes - output[0].likes 
                           
                          rellikes1 = output[0]['rel_likes'];
                          rellikes2 = output[1]['rel_likes'];
                     }
                       res.send({"stockData":output});
                     }
                }));
            });
         });
        }); 
        };
      })
    });
}