use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};
use std::str::FromStr;

use solana_program::sysvar::instructions::{
    self, load_current_index_checked, load_instruction_at_checked,
};

pub use crate::constants::*;
pub use crate::error::Errors;
pub use crate::helpers::helpers::check_price;
pub use crate::state::*;

#[derive(Accounts)]
pub struct Accept<'info> {
    #[account(mut)]
    buyer: Signer<'info>,
    #[account(
        seeds = ["escrow".as_bytes(), 
        escrow.authority.key().as_ref(), 
        escrow.product_seed.as_str().as_bytes()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, 
    constraint = escrowed_x_tokens.key() == escrow.escrowed_x_tokens)]
    pub escrowed_x_tokens: Account<'info, TokenAccount>,
    #[account(mut, 
    constraint = sellers_y_tokens.mint == escrow.y_mint)]
    pub sellers_y_tokens: Account<'info, TokenAccount>,
    #[account(mut, 
    constraint = buyers_x_tokens.mint == escrowed_x_tokens.mint)]
    pub buyers_x_tokens: Account<'info, TokenAccount>,
    #[account(mut, 
    associated_token::mint = escrow.y_mint, 
    associated_token::authority = buyer.key())]
    pub buyers_y_tokens: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    #[account(address = instructions::ID)]
    /// CHECK: InstructionsSysvar account
    instructions: UncheckedAccount<'info>,
}

impl<'info> Accept<'info> {
    pub fn transfer_x_to_buyer(&self, x_requested: u64, y_amount: u64) -> Result<()> {
        require!(
            check_price(x_requested, y_amount, self.escrow.y_price),
            Errors::PriceMismatch,
        );
        require!(
            x_requested <= self.escrowed_x_tokens.amount,
            Errors::PriceMismatch,
        );

        let cpi_accounts = Transfer {
            from: self.escrowed_x_tokens.to_account_info(),
            to: self.buyers_x_tokens.to_account_info(),
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
            x_requested,
        )
    }

    pub fn transfer_y_to_seller_if_needed(&self, x_requested: u64, y_amount: u64) -> Result<()> {
        require!(
            check_price(x_requested, y_amount, self.escrow.y_price),
            Errors::PriceMismatch,
        );

        let ixs = self.instructions.to_account_info();
        let current_index = load_current_index_checked(&ixs)? as usize;
        if current_index == 0 {
          // wallet payment case
          self.transfer_y_to_seller(y_amount)
        } else {
            match load_instruction_at_checked(current_index - 1, &ixs) {
                Ok(signature_ix) => {
                    if Pubkey::from_str(ED25519_PROGRAM_ID).unwrap() == signature_ix.program_id {
                        // Ensure signing authority is correct
                      require!(
                        signing_authority::ID
                            .to_bytes()
                            .eq(&signature_ix.data[16..48]),
                        Errors::SignatureAuthorityMismatch
                      );

                      let mut message_data: [u8; 4] = [0u8; 4];
                      message_data.copy_from_slice(&signature_ix.data[112..116]);
                      let amount = u32::from_le_bytes(message_data);

                      msg!("The message from Signature instruction is: {}", amount);

                      let x_token_amount_paid = amount as u64;

                      require!(
                          x_token_amount_paid <= self.escrowed_x_tokens.amount,
                          Errors::PriceMismatch,
                      );
                      Ok(())
                    } else {
                      // wallet payment case
                      msg!("has more than one instructions, but no ED25519 instruction");
                      self.transfer_y_to_seller(y_amount)
                    }
                }
                Err(_) => {
                    // wallet payment case
                    msg!("Couldn't load the previous instruction");

                    self.transfer_y_to_seller(y_amount)
                }
            }
        }
    }

    fn transfer_y_to_seller(&self, y_amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.buyers_y_tokens.to_account_info(),
            to: self.sellers_y_tokens.to_account_info(),
            authority: self.buyer.to_account_info(),
        };

        transfer(
            CpiContext::new(self.token_program.to_account_info(), cpi_accounts),
            y_amount,
        )
    }
}
