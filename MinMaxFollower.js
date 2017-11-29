//When you have enough bitcoins, this script will follow the Ask price when it goes up. 
//When it drops below the ceiling by PercentageTop%, the script will sell all bitcoins.
var PercentageTop = 1.5;
//When you have enough Euros, the script will follow the Bid price when it goes down.
//When it rises above the floor by PercentageBot%, the script will buy bitcoins for your EUR balance
var PercentageBot = 0.75;
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
    if(openAsks > 0) //If price changes while asks are open, keep following the ask price until order is executed.
    {
        log("Askprice changed to "+AskPrice+", cancel asks and sell again");
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
        log("Selling amount BTC"+amount+", amount EUR"+(amount*SellPrice)+", Price"+SellPrice);
        trader.sell("BTCEUR", amount, SellPrice);
        SellCeiling = 0;
        return;
    }
    else if (AskPrice>SellCeiling)
    {
        SellCeiling = AskPrice;
        log("Set new SellCeiling: EUR"+ SellCeiling);
        return;
    }
    log("Below SellCeiling: "+ (100*((AskPrice-SellCeiling)/SellCeiling))+"%, sell at:"+ (-1*PercentageTop) + "%");
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
    if(openBids > 0) //If price changes while bids are open, keep following the bid price until order is executed.
    {
        log("Bidprice changed to "+BidPrice+", cancel bids and buy again");
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
        amount *= (1.0 - trader.get("Fee") / 100.0);
        var BuyPrice = (BuyFloor*p);
        log("Buying amount BTC"+(amount/BuyPrice)+", amount EUR"+amount+", Price"+BuyPrice);
        trader.buy("BTCEUR", amount/BuyPrice, BuyPrice);
        BuyFloor = 1e99;
        return;
    }
    else if (BidPrice<BuyFloor)
    {
        BuyFloor = BidPrice;
        log("Set new BuyFloor: EUR" + BuyFloor);
        return;
    }
    log("Above BuyFloor: " + (100*((BidPrice-BuyFloor)/BuyFloor)) +"%, buy at:"+ PercentageBot+ "%");
}


function log(str)
{
    trader.log(str);
    trader.fileAppend(fileLoggerFile, trader.dateTimeString() + " - " + str);
}

