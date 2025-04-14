import Carousel from "./Carousel";
import AddMoreItem from "./AddMoreItem";
import { Product } from "~/types/product";
import formatCurrency from "~/utils/formatCurrency";
import { useCartStore } from "~/cart/useCartStore";

export default function ProductContainer({ product }: { product: Product }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  return (
    <div className="px-4 sm:px-8 md:px-12 lg:px-20 xl:px-40 pt-4 md:pt-6 lg:pt-10">
      <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-8 lg:gap-10">
        {/* Carousel/Image Section */}
        <div className="w-full md:w-1/2">
          <Carousel images={product.imgUrl} />
        </div>

        {/* Product Details Section */}
        <div className="w-full md:w-1/2 md:pl-4 lg:pl-6">
          <div className="text-xl md:text-2xl lg:text-3xl font-bold tracking-widest">
            {product.name}
          </div>

          {/* Ratings */}
          <div className="mt-2">
            {[...Array(5)].map((_, index) => (
              <i key={index} className="ri-star-fill text-[#FCBF02]"></i>
            ))}
            <span className="pl-2 text-xs md:text-sm">{`(102) Reviews`}</span>
          </div>

          {/* Product Description */}
          <div className="text-left py-3 md:py-4 text-sm md:text-base">
            {product.description}
            <br /><br />
            {`Flowers and shades of ${product.name} may vary according to seasonal or market availability but your design will always include a gorgeous selection of our best PINK flowers including flowers like pink roses, disbuds, spray roses, stock or other seasonal pink flowers. The size of this design including flowers & vase is approximately 40cm high.`}
          </div>

          {/* Product Links */}
          <div className="underline font-bold text-xs md:text-sm hover:text-gray-600 cursor-pointer">
            VIEW MORE FROM FLORIQUE SIGNATURE VASE RANGE
          </div>

          {/* Add-ons Section */}
          <div className="py-4 font-bold text-sm md:text-base">
            ADD A LITTLE EXTRA SOMETHING
          </div>
          <AddMoreItem />

          {/* Delivery Info & Price/Add to Cart Section */}
          <div className="py-4 md:py-6 space-y-3">
            <div className="bg-[#F5F0EC] text-xs md:text-sm px-4 py-3 text-center md:text-left rounded">
              <p>
                Order now for delivery on Monday
                <span><i className="ri-flower-line mx-2"></i></span>
                Same day flower delivery Monday – Saturday
              </p>
            </div>

            {/* Price and CTA */}
            <div className="bg-[#FAF8F6] flex justify-between items-center px-4 md:px-6 py-4 rounded">
              <div className="text-xl md:text-2xl font-semibold">
                {formatCurrency(product.price)}
              </div>
              <button
                onClick={() => {
                  addToCart(product)
                  setCartOpen(true)
                }}
                className="bg-[#9AC2A0] hover:bg-[#8ab394] transition-colors text-white rounded-lg text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
              >
                ADD TO CART
              </button>
            </div>

            {/* Payment Info */}
            <div className="pt-2">
              <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
                <div className="text-center md:text-left font-semibold text-[#939394] text-xs md:text-sm">
                  <div>Guaranteed</div>
                  <div>Safe Checkout</div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 md:gap-4 items-center">
                  <img alt="MasterCard" className="h-8 md:h-10 w-auto" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/mastercard-2789e991b7ade46039eafc9c2dee83e7713eddb3_bwvc1z.svg" />
                  <img alt="Visa" className="h-8 md:h-10 w-auto" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704094/visa-60cf74cbad7400ab7427cd41529af15330af6383_spuac2.svg" />
                  <img alt="Amex" className="h-8 md:h-10 w-auto" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704112/amex-07ada099123d628aca142a88f03a41bf0af62076_br4ty5.svg" />
                  <img alt="PayPal" className="h-8 md:h-10 w-auto" src="https://res.cloudinary.com/djwau0xeb/image/upload/v1742704095/paypal-2db521f81867a9e2879753ee1a4889d0ef6af0e8_vfncb8.svg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
