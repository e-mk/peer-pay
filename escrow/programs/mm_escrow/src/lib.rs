pub mod constants;
pub mod error;
pub mod helpers;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("5RwVJFUYq1aTBtivpHDt6cPdHQPJcS82tx3FsGnQQ3vD");

#[program]
pub mod mm_escrow {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        x_amount: u64,
        y_price: u64,
        product_seed: String,
    ) -> Result<()> {
        ctx.accounts.initialize(y_price, &ctx.bumps, product_seed);
        ctx.accounts.transfer_tokens(x_amount)
    }

    pub fn accept(ctx: Context<Accept>, x_requested: u64, y_amount: u64) -> Result<()> {
        ctx.accounts.transfer_x_to_buyer(x_requested, y_amount)?;
        ctx.accounts
            .transfer_y_to_seller_if_needed(x_requested, y_amount)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        ctx.accounts.cancel_escrow()?;
        ctx.accounts.close_escrow()
    }
}
