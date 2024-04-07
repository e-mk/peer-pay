pub use crate::error::Errors;
pub use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::*;
use anchor_spl::token::{transfer, Transfer};

#[derive(Accounts)]
#[instruction(x_amount: u64,
    y_amount: u64,
    product_seed: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    seller: Signer<'info>,
    x_mint: Account<'info, Mint>,
    y_mint: Account<'info, Mint>,
    #[account(mut, 
    constraint = sellers_x_token.mint == x_mint.key() && 
    sellers_x_token.owner == seller.key())]
    sellers_x_token: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = seller,
        seeds = ["escrow".as_bytes(), 
        seller.key().as_ref(), 
        product_seed.as_str().as_bytes()],
        space = Escrow::LEN,
        bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = seller,
        seeds = ["escrow".as_bytes(), escrow.key().as_ref()],
        token::mint = x_mint,
        token::authority = escrow,
        bump,
    )]
    escrowed_x_tokens: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, y_price: u64, bumps: &InitializeBumps, product_seed: String) {
        self.escrow.set_inner(Escrow {
            authority: self.seller.key(),
            bump: bumps.escrow,
            escrowed_x_tokens: self.escrowed_x_tokens.key(),
            y_price,
            y_mint: self.y_mint.key(),
            product_seed,
        });
    }

    pub fn transfer_tokens(&self, x_amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.sellers_x_token.to_account_info(),
            to: self.escrowed_x_tokens.to_account_info(),
            authority: self.seller.to_account_info(),
        };

        transfer(
            CpiContext::new(self.token_program.to_account_info(), cpi_accounts),
            x_amount,
        )
    }
}
