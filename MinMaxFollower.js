///    This program is free software: you can redistribute it and/or modify
///    it under the terms of the GNU General Public License as published by
///    the Free Software Foundation, either version 3 of the License, or
///    (at your option) any later version.
///
///    This program is distributed in the hope that it will be useful,
///    but WITHOUT ANY WARRANTY; without even the implied warranty of
///    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
///    GNU General Public License for more details.
///
///    You should have received a copy of the GNU General Public License
///    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
//When you have enough bitcoins, this script will follow the Ask price when it goes up. 
//When it drops below the ceiling by PercentageTop<Win or Loss>%, the script will sell all bitcoins.
//When we are making profit, and the price drops below this percentage, we sell
var PercentageTopWin = 0.75;
//When we are making loss, and the price drops below this percentage, we sell
var PercentageTopLoss = 5.0;
//When you have enough Euros, the script will follow the Bid price when it goes down.
//When it rises above the floor by PercentageBot%, the script will buy bitcoins for your EUR balance
//When we are making profit and the price raises above this percentage, we buy
var PercentageBotWin = 0.75;
//When we are making loss and the price raises above this percentage, we buy
var PercentageBotLoss = 2.5;
//Set this value to the trading fee in %
var FEE=0.25;
//Set this path to the log file to log prices and 
var fileLoggerFile = "/home/franss/CernBox/programmeren/MinMaxFollower.log";
//Set this to the minimum saldo that a trade can be executed (in Euro)
var MinimalTradeValue = 5;

//Don't change these values, just initial variable values.
var BuyFloor=1e99;
var SellCeiling=0;


log("Starting MinMaxFollower, please donate bitcoins to:");
log("3DmSBjaNptXp5dPNiPejzC6Un8HkWdWnxW");


trader.on("AskPrice").changed()
{
    if(symbol != "BTCEUR")return;
    if(trader.get("ApiLag")>10)
    {
        log("Api lag is to high");
        return;
    }

    var balanceBTC = trader.get("Balance","BTC");
    var AskPrice = trader.get("AskPrice");
    var openAsks = trader.get("OpenAsksCount");
    
       
    var PercentageTop = PercentageTopLoss;
    var LastBuyPrice = trader.get("LastMyBuyPrice");
    
    if((AskPrice * (1.0 - trader.get("Fee") / 100.0)) > LastBuyPrice) //Check if we are winning
    {
        PercentageTop = PercentageTopWin;
        log("Making profit: EUR"+round2(((AskPrice * (1.0 - trader.get("Fee") / 100.0)) - LastBuyPrice)*balanceBTC)+", Ask-FEE: "+round2(AskPrice * (1.0 - trader.get("Fee") / 100.0))+", Last Buy: "+round2(LastBuyPrice));
    }
    
    
    
    if(openAsks > 0) //If price changes while asks are open, keep following the ask price until order is executed.
    {
        log("Askprice changed to "+round2(AskPrice)+", cancel asks and sell again");
        trader.cancelAsks("BTCEUR");
        SellCeiling = trader.get("BTCEUR" , "AskPrice") * (1+(PercentageTop/100));
        return;
    }
    if((balanceBTC*AskPrice)<MinimalTradeValue)
    {
        SellCeiling = 0;
         return; //not enough balance
    }
    var p = 1 - (1*(PercentageTop/100));
    if(AskPrice < (SellCeiling *p))
    {
        var amount = balanceBTC;
        amount *= (1.0 - trader.get("Fee") / 100.0);
        var SellPrice = (SellCeiling*p);
        log("Selling amount BTC"+round2(amount)+", amount EUR"+round2(amount*SellPrice)+", Price"+round2(SellPrice));
        trader.sell("BTCEUR", amount, SellPrice);
        SellCeiling = 0;
        return;
    }
    else if (AskPrice>SellCeiling)
    {
        SellCeiling = AskPrice;
        log("Set new SellCeiling: EUR"+ round2(SellCeiling));
        return;
    }
    log("Below SellCeiling: "+ round2(100*((AskPrice-SellCeiling)/SellCeiling))+"%, sell at:"+ round2(-1*PercentageTop) + "%");
}


trader.on("BidPrice").changed()
{
    if(symbol != "BTCEUR")return;
    if(trader.get("ApiLag")>10)
    {
        log("Api lag is to high");
        return;
    }

    var balanceEUR = trader.get("Balance","EUR");
    var BidPrice = trader.get("BidPrice");
    var openBids = trader.get("OpenBidsCount");
    var PercentageBot = PercentageBotLoss;
    var LastSellPrice = trader.get("LastMySellPrice");
    
    if((BidPrice * (1.0 + trader.get("Fee") / 100.0)) < LastSellPrice) //Check if we are winning
    {
        PercentageBot = PercentageBotWin;
    }
    
    if(openBids > 0) //If price changes while bids are open, keep following the bid price until order is executed.
    {
        log("Bidprice changed to "+round2(BidPrice)+", cancel bids and buy again");
        trader.cancelBids("BTCEUR");
        BuyFloor = trader.get("BTCEUR" , "BidPrice") * (1-(PercentageBot/100));
        return;
    }
    if((balanceEUR)<MinimalTradeValue)
    {
        BuyFloor = 1e99;
        return; //not enough balance
    }
    var p = 1 + 1*(PercentageBot/100);
    if(BidPrice > (BuyFloor*p))
    {
        var amount = balanceEUR;
        amount -= 0.01;
        amount *= (1.0 - trader.get("Fee") / 100.0);
        var BuyPrice = (BuyFloor*p);
        log("Buying amount BTC"+round2(amount/BuyPrice)+", amount EUR"+round2(amount)+", Price"+round2(BuyPrice));
        trader.buy("BTCEUR", amount/BuyPrice, BuyPrice);
        BuyFloor = 1e99;
        return;
    }
    else if (BidPrice<BuyFloor)
    {
        BuyFloor = BidPrice;
        log("Set new BuyFloor: EUR" + round2(BuyFloor));
        return;
    }
    log("Above BuyFloor: " + round2(100*((BidPrice-BuyFloor)/BuyFloor)) +"%, buy at:"+ round2(PercentageBot)+ "%");
}


function log(str)
{
    trader.log(str);
    trader.fileAppend(fileLoggerFile, trader.dateTimeString() + " - " + str);
}

function round2(number)
{
    return Math.round(number*100)/100;
}

