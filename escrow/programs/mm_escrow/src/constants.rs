use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "mm_escrow";
pub const ED25519_PROGRAM_ID: &str = "Ed25519SigVerify111111111111111111111111111";

pub mod signing_authority {
    use super::*;
    declare_id!("FexVSkWTomAziTdHs2E4FyDougLbCEZXjHLn4vaPhmiB");
}
