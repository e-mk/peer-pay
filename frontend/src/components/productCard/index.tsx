import Image from "next/image";
import { IProduct } from "@/interface/productInterface";

export const ProductCard = ({
    data,
    onBuyClick,
}: {
    data: IProduct,
    onBuyClick: (data: IProduct) => void,
}) => {
    return (
        <div className="mb-10 p-4 border border-[#28DBD1] bg-[#09202F] rounded-lg ">
            <div className="rounded-lg h-64 overflow-hidden">
                <Image alt="content" className="object-cover h-full max-w-80" src={data.image} />
            </div>
            <h2 className="text-2xl font-medium text-white mt-6 mb-3">
                {data.title}
            </h2>
            <p className="leading-relaxed text-base">{`Price ${data.price} USDC`}</p>
            <button onClick={() => onBuyClick(data)} className="bg-blue-700 hover:bg-blue-800 duration-200 px-10 m-3 py-2 rounded-lg text-white">Buy</button>
        </div>
    )
}
