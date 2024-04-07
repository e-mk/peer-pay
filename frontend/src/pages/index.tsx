"use client"
import { useEffect, useState } from 'react';
import { Keypair } from "@solana/web3.js";
import CheckoutButtonStripe from "@/components/checkoutStripe";
import walletKeypair from "../key.json";
import CheckoutButtonAccept from '@/components/checkoutButtonAccept';
import { ProductCard } from '@/components/productCard';
import { PRODUCTS } from '@/costants/costants';
import { useSolanaGetProvider } from '@/hooks/useSolanaGetProvider';
import { useSolana } from '@/hooks/useSolana';
import { IProduct, IMintType } from '@/interface/productInterface';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { showNotification } from '@/utils/showNotification';
import mintedProducts from "../pages/mint.json";

export default function Home() {
  const tokenAmount = new URLSearchParams(window.location.search).get('amount');
  const typeQueryParam = new URLSearchParams(window.location.search).get('type');
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const { provider, connection } = useSolanaGetProvider();
  const sellerKP: Keypair = Keypair.fromSecretKey(new Uint8Array(walletKeypair));
  const buyerWalletPK = useWallet().publicKey!!;
  const { acceptWallet, acceptStripe } = useSolana({ buyerWalletPK });
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        if (buyerWalletPK && Object.values(mintedProducts).length && tokenAmount) {
          const isStripeAccepted = await acceptStripe({
            provider,
            sellerAccept: sellerKP,
            type: IMintType[typeQueryParam as keyof typeof IMintType],
            connection,
            quantity: quantity || tokenAmount,
            mintedProductsData: mintedProducts
          })

          if (isStripeAccepted) {
            router.replace("/", undefined, { shallow: true })
          }
        }
      } catch (error) {
        showNotification((error as { message: string }).message, "error");
      }
    })()
  }, [tokenAmount, typeQueryParam, mintedProducts, buyerWalletPK]);

  const handleBuyClick = (product: IProduct) => {
    setSelectedProduct(product);
    setShowPopup(true);
  }

  const handleCancelClick = () => {
    setShowPopup(false);
    setQuantity("");
  }

  const handleAcceptClick = (type: IMintType, quantity: string) => {
    acceptWallet({
      provider,
      sellerAccept: sellerKP,
      type,
      connection,
      quantity
    })
    setShowPopup(false);
  }

  return (
    <main>
      <div className="container px-5 py-20 text-white mx-auto">
        <div className="flex justify-center flex-wrap mx-4 text-center gap-8">
          {PRODUCTS.map((product, index) => {
            return <ProductCard
              data={product}
              key={index}
              onBuyClick={handleBuyClick}
            />
          })}
        </div>
      </div>
      {showPopup && selectedProduct && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-700 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-medium text-gray-800 mb-4">Confirm Purchase</h2>
            <p className="text-gray-700">How many tokens of {selectedProduct?.title} you want to buy?</p>
            <input type="number" placeholder='How much tokens of product do you want'
              value={quantity}
              onChange={({ target: { value = "" } = {} }) => { setQuantity(value) }}
              className="border border-gray-300 rounded-md p-2 mt-4 text-black placeholder:text-red-600"
              style={{ width: '100%', textAlign: 'center', }}
            />
            <div className="flex justify-end mt-6">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-md mr-4" onClick={handleCancelClick}>Cancel</button>
              <CheckoutButtonStripe
                type={selectedProduct.type}
                amount={quantity ? quantity : selectedProduct?.price}
              />
              <CheckoutButtonAccept onAcceptClick={() => handleAcceptClick(selectedProduct?.type, quantity)} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}