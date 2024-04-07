import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/router";
import { YPRICE } from "@/costants/costants";

const asyncStripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

const CheckoutButtonStripe = ({
    amount = 1,
    type
}:
    {
        amount: number | string,
        type: string
    }) => {
    const router = useRouter();
    const usdAmount = +amount * YPRICE;
    const handler = async () => {
        try {
            const stripe = await asyncStripe;

            const res = await fetch("/api/stripe/session", {
                method: "POST",
                body: JSON.stringify({
                    amount: usdAmount,
                    type
                }),
                headers: { "Content-Type": "application/json" },
            });
            const { sessionId } = await res.json();

            const redirectResult = await stripe?.redirectToCheckout({ sessionId });

            if (redirectResult?.error) {
                router.push("/error");
            }
        } catch (err) {
            router.push("/error");
        }
    };

    return (
        <button
            onClick={handler}
            className="bg-blue-700 hover:bg-blue-800 duration-200 px-8 mx-3 py-4 rounded-lg text-white"
        >
            Buy with stripe
        </button>
    );
};

export default CheckoutButtonStripe;