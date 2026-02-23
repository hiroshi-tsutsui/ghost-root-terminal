import alpaca_trade_api as tradeapi
import pandas as pd
import pandas_ta as ta
import time
import logging

# CONFIGURATION
# ---------------------------------------------------------
# Get these from https://alpaca.markets/ (Paper Trading)
API_KEY = "YOUR_PAPER_API_KEY"
SECRET_KEY = "YOUR_PAPER_SECRET_KEY"
BASE_URL = "https://paper-api.alpaca.markets"

SYMBOL = "BTC/USD"
TIMEFRAME = "15Min"
QTY = 0.1  # Trade size (fractional Bitcoin)

# STRATEGY PARAMETERS
RSI_PERIOD = 14
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70
BB_LENGTH = 20
BB_STD = 2.0

# RISK MANAGEMENT
TAKE_PROFIT_PCT = 0.015  # 1.5%
STOP_LOSS_PCT = 0.030    # 3.0%

# ---------------------------------------------------------

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
api = tradeapi.REST(API_KEY, SECRET_KEY, BASE_URL, api_version='v2')

def get_data(symbol, timeframe, limit=100):
    """Fetch historical bars from Alpaca."""
    try:
        bars = api.get_crypto_bars(symbol, timeframe, limit=limit).df
        return bars
    except Exception as e:
        logging.error(f"Error fetching data: {e}")
        return None

def check_signals(df):
    """Calculate indicators and check for entry signals."""
    # Calculate RSI
    df['rsi'] = ta.rsi(df['close'], length=RSI_PERIOD)
    
    # Calculate Bollinger Bands
    bb = ta.bbands(df['close'], length=BB_LENGTH, std=BB_STD)
    df = pd.concat([df, bb], axis=1)
    
    # Get latest completed candle (previous row)
    last_row = df.iloc[-2] 
    current_price = df.iloc[-1]['close']
    
    logging.info(f"Price: {current_price} | RSI: {last_row['rsi']:.2f} | LowerBB: {last_row[f'BBL_{BB_LENGTH}_{BB_STD}']:.2f}")

    # ENTRY LOGIC (Mean Reversion Long)
    # Condition: Price touched Lower Band AND RSI is Oversold
    if last_row['close'] < last_row[f'BBL_{BB_LENGTH}_{BB_STD}'] and last_row['rsi'] < RSI_OVERSOLD:
        return 'buy', current_price
    
    return None, current_price

def execute_trade(signal, price):
    """Submit Order with Bracket (TP/SL)."""
    if signal == 'buy':
        try:
            # Check for existing position
            try:
                position = api.get_position(SYMBOL)
                if float(position.qty) > 0:
                    logging.info("Position already open. Skipping.")
                    return
            except:
                pass # No position found

            take_profit = price * (1 + TAKE_PROFIT_PCT)
            stop_loss = price * (1 - STOP_LOSS_PCT)

            logging.info(f"🚀 ENTRY SIGNAL! Buying {QTY} {SYMBOL} at {price}")
            
            api.submit_order(
                symbol=SYMBOL,
                qty=QTY,
                side='buy',
                type='market',
                time_in_force='gtc',
                order_class='bracket',
                take_profit={'limit_price': take_profit},
                stop_loss={'stop_price': stop_loss}
            )
            logging.info("Order Submitted.")
            
        except Exception as e:
            logging.error(f"Order failed: {e}")

def main():
    logging.info("🕷️ Widow Scalper Bot (Alpaca Edition) Initialized...")
    while True:
        df = get_data(SYMBOL, TIMEFRAME)
        if df is not None:
            signal, price = check_signals(df)
            if signal:
                execute_trade(signal, price)
        
        time.sleep(60) # Check every minute

if __name__ == "__main__":
    main()
