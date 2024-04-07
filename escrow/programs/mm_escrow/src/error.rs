use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    #[msg("The amount offered does not match the initial token price")]
    PriceMismatch,
    #[msg("Not enough funds in ecrow's vault")]
    NotEnoughFundsInVault,

    #[msg("Signature authority mismatch")]
    SignatureAuthorityMismatch,

    #[msg("Missing Signature")]
    MissingSignature,
}
