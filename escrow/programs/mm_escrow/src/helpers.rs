pub mod helpers {
    pub fn check_price(x_requested: u64, y_amount: u64, y_price: u64) -> bool {
        let slippage = 2;
        y_amount / x_requested <= y_price * (1 + slippage / 100)
            && y_amount / x_requested >= y_price * (1 - slippage / 100)
    }
}

pub use helpers::*;
