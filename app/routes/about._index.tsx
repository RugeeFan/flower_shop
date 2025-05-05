import { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "About Us - Royal Rose" }];
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-primary mb-6">About Royal Rose</h1>

      <p className="mb-4">
        Royal Rose is a Sydney-based premium floral service committed to delivering elegant, fresh, and meaningful arrangements for every occasion. Whether it’s a romantic gesture, a birthday celebration, or a grand wedding, we believe flowers speak where words fall short — and we make sure they’re always heard.
      </p>

      <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">Why Choose Us?</h2>

      <ul className="list-disc list-inside space-y-3">
        <li>
          <strong>Citywide Delivery Across Sydney:</strong> From the CBD to the North Shore, Inner West, Eastern Suburbs, and Western Sydney — we deliver everywhere with care and precision.
        </li>
        <li>
          <strong>Farm-Fresh Daily Blooms:</strong> We partner with local growers to source the freshest flowers each morning, ensuring every bouquet is vibrant, fragrant, and long-lasting.
        </li>
        <li>
          <strong>Modern Floral Artistry:</strong> Our experienced florists blend contemporary style with timeless charm to create arrangements that impress, whether for daily gifting or luxury weddings.
        </li>
        <li>
          <strong>Multilingual Support:</strong> We proudly serve customers in both English and Chinese, ensuring a seamless experience for all.
        </li>
        <li>
          <strong>Same-Day Delivery Guarantee:</strong> Place your order before the cutoff time and we’ll get your flowers delivered the very same day — because timing matters.
        </li>
        <li>
          <strong>Eco-Friendly Packaging:</strong> We care about our planet. Our bouquets are wrapped in recyclable, sustainable materials without compromising on presentation.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">Our Promise</h2>
      <p className="mb-4">
        Royal Rose isn’t just a flower shop — we’re storytellers. Every bouquet we craft carries a message of love, appreciation, comfort, or celebration. We’re here to make your moments memorable and meaningful.
      </p>

      <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">Get in Touch</h2>
      <p>
        Curious to learn more? Feel free to{" "}
        <a href="/contact" className="text-primary underline">
          contact us
        </a>{" "}
        anytime. At Royal Rose, we’re proud to be your trusted floral partner across Sydney.
      </p>
    </div>
  );
}
