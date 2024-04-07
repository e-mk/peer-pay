const CheckoutButtonAccept = ({
    onAcceptClick
}: {
    onAcceptClick: () => void;
}) => {
    return (
        <button
            onClick={onAcceptClick}
            className="bg-blue-700 hover:bg-blue-800 duration-200 px-8 mx-3 py-4 rounded-lg text-white"
        >
            Buy with crypto
        </button >
    );
};

export default CheckoutButtonAccept;