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


trader.fileAppend(fileLoggerFile,  "Starting MinMaxFollower - " + trader.dateTimeString());


trader.on("AskPrice").changed()
{
    if(symbol != "BTCEUR")return;
    var balanceBTC = trader.get("Balance","BTC");
    var price = trader.get("AskPrice");
    if((balanceBTC*price)<MinimalTradeValue)
    {
        SellCeiling = 0;
        ///TODO: Check if any sell orders are open, if AskPrice is below our price by TBD %, lower the price.
         return; //not enough balance

    }
    var p = 1 - (1*(PercentageTop/100));
    if(price < (SellCeiling *p))
    {
        var amount = balanceBTC;
        amount = amount - amount*(FEE/100);
        trader.log("Selling: ",SellCeiling*p," for: ",amount);
        trader.fileAppend(fileLoggerFile, "Selling: "+(SellCeiling*p)+" for: "+amount+ " - " + trader.dateTimeString());
        trader.sell("BTCEUR", amount, SellCeiling*p);
        SellCeiling = 0;
    }
    else if (price>SellCeiling)
    {
        SellCeiling = price;
        trader.log("Set new SellCeiling: EUR", SellCeiling);
        trader.fileAppend(fileLoggerFile, "Set new SellCeiling: EUR"+ SellCeiling+ " - " + trader.dateTimeString());
    }
    trader.log("Below SellCeiling: ", 100*((price-SellCeiling)/SellCeiling),"%, sell at:", -1*PercentageTop, "%");
    trader.fileAppend(fileLoggerFile, "Below SellCeiling: "+ (100*((price-SellCeiling)/SellCeiling))+"%, sell at:"+ (-1*PercentageTop)+ "% - " + trader.dateTimeString());
}


trader.on("BidPrice").changed()
{
    if(symbol != "BTCEUR")return;
    var balanceEUR = trader.get("Balance","EUR");
    var price = trader.get("BidPrice");
    if((balanceEUR)<MinimalTradeValue)
    {
        BuyFloor = 1e99;
        ///TODO: Check if any buy orders are open, if BidPrice is above our price by TBD %, raise the price.
         return; //not enough balance

    }
    var p = 1 + 1*(PercentageBot/100);
    if(price > (BuyFloor*p))
    {
        var amount = balanceEUR/BuyFloor;
        amount -= amount * (FEE/100);
        trader.log("Buying: ",BuyFloor*p," for: ",amount);
        trader.fileAppend(fileLoggerFile, "Buying: "+(BuyFloor*p)+" for: "+amount+ " - " + trader.dateTimeString());
        trader.buy("BTCEUR", amount, (BuyFloor*p));
        BuyFloor = 1e99;
    }
    else if (price<BuyFloor)
    {
        BuyFloor = price;
        trader.log("Set new BuyFloor: EUR", BuyFloor);
        trader.fileAppend(fileLoggerFile, "Set new BuyFloor: EUR" + BuyFloor + " - " + trader.dateTimeString());
    }
    trader.log("Above BuyFloor: ", 100*((price-BuyFloor)/BuyFloor),"%, buy at:", PercentageBot, "%");
    trader.fileAppend(fileLoggerFile, "Above BuyFloor: " + (100*((price-BuyFloor)/BuyFloor)) +"%, buy at:"+ PercentageBot+ "% - " + trader.dateTimeString());
}


