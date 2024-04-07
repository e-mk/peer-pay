import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Success = () => {
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => clearTimeout(timeout);
    }, [router]);
    return (
        <>
            <Head>
                <title>Success Page</title>
            </Head>
            <div className="h-screen flex justify-center items-center">
                <h1 className="text-green-600 text-4xl">SUCCESS TRANSACTION</h1>
            </div>
        </>
    );
};

export default Success;