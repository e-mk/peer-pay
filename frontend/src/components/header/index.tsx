import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Header = (): JSX.Element => {
    return (
        <header className="flex justify-between items-center p-[22px_80px] border-b-[1px] border-[#28DBD1]">
            <WalletMultiButton style={{ background: "#28dbd1", marginLeft: "10px", borderRadius: "8px", transform: "skew(-12deg)" }} />
        </header >
    );
};

export default Header;
