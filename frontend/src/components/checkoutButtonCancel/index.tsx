const CheckoutButtonCancel = ({
    onCancelClick
}: {
    onCancelClick: () => void;
}) => {
    return (
        <button
            onClick={onCancelClick}
            className="bg-blue-700 hover:bg-blue-800 duration-200 px-8 mx-3 py-4 rounded-lg text-white"
        >
            Cancel
        </button >
    );
};

export default CheckoutButtonCancel;