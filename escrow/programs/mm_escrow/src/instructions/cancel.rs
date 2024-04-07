pub use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{close_account, transfer, CloseAccount, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    seller: Signer<'info>,
    #[account(
      mut, 
      constraint = escrowed_x_tokens.key() == escrow.escrowed_x_tokens,
      seeds = ["escrow".as_bytes(), 
      escrow.key().as_ref()],
      bump
    )]
    pub escrowed_x_tokens: Account<'info, TokenAccount>,
    #[account(
        seeds = ["escrow".as_bytes(), escrow.authority.key().as_ref(), escrow.product_seed.as_str().as_bytes()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, 
      constraint = sellers_x_token.mint == escrowed_x_tokens.mint && sellers_x_token.owner == seller.key())]
    sellers_x_token: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Cancel<'info> {
    pub fn cancel_escrow(&self) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.escrowed_x_tokens.to_account_info(),
            to: self.sellers_x_token.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let escrow_signer_seeds: &[&[&[u8]]] = &[&[
            b"escrow",
            self.escrow.authority.as_ref(),
            self.escrow.product_seed.as_str().as_bytes(),
            &[self.escrow.bump],
        ]];
        transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                cpi_accounts,
                escrow_signer_seeds,
            ),
            self.escrowed_x_tokens.amount,
        )
    }

    pub fn close_escrow(&self) -> Result<()> {
        let cpi_accounts = CloseAccount {
            account: self.escrowed_x_tokens.to_account_info(),
            destination: self.seller.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let escrow_signer_seeds: &[&[&[u8]]] = &[&[
            b"escrow",
            self.escrow.authority.as_ref(),
            self.escrow.product_seed.as_str().as_bytes(),
            &[self.escrow.bump],
        ]];
        close_account(CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            escrow_signer_seeds,
        ))
    }
}
