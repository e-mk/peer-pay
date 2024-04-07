pub use state::*;

use crate::state;
use anchor_lang::prelude::*;
#[account]
pub struct Escrow {
    pub authority: Pubkey,
    pub bump: u8,
    pub escrowed_x_tokens: Pubkey,
    pub y_price: u64,
    pub y_mint: Pubkey,
    pub product_seed: String,
}

impl Escrow {
    pub const LEN: usize = 8 + 32 + 1 + 32 + 8 + 32 + 24;
}
