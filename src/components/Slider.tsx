import { wixClientServer } from "@/lib/wixClientServer";
import SliderClient, { SlideData } from "./SliderClient";
import { media as wixMedia } from "@wix/sdk";

// Fallback slides used when no CMS promotions exist. Two slides, as the shop owner asked.
export const fallbackSlides: SlideData[] = [
    {
        id: 'hero',
        title: 'WEAR THE MOMENT\nOWN THE LEGACY',
        description: 'Premium timepieces crafted for those who value precision, style, and the art of timekeeping.',
        categoryTag: 'Premium Collection',
        buttonText: 'Explore Collection',
        img: '/products/megir2.jpg',
        url: '/shop',
        bg: 'from-zinc-900 via-black to-zinc-900',
    },
    {
        id: 'elegance',
        title: 'TIMELESS\nELEGANCE',
        subtitle: 'REDEFINE YOUR STYLE',
        description: 'From boardroom to weekend — discover watches that complement every moment of your journey.',
        categoryTag: 'Gents & Ladies',
        buttonText: 'Shop Now',
        img: '/products/megirb.jpg',
        url: '/shop',
        bg: 'from-[#3a2d08] via-[#1c1604] to-black',
    }
];

const Slider = async () => {
    let slides: SlideData[] = fallbackSlides;

    try {
        const wixClient = await wixClientServer();

        // Query the "Promotions" CMS collection for active promotions
        const { items: promotions } = await wixClient.items
            .query("Promotions")
            .ascending("order")
            .find();

        if (promotions && promotions.length > 0) {
            const cmsSlides: SlideData[] = promotions
                .filter((item) => item.data?.isActive !== false)
                .map((item) => {
                    const data = item.data!;
                    // Handle image: could be a Wix media URL or a string
                    let imgUrl = data.image || "/products/megir2.jpg";
                    if (typeof imgUrl === "string" && imgUrl.startsWith("wix:image://")) {
                        imgUrl = wixMedia.getScaledToFillImageUrl(imgUrl, 1200, 800, {});
                    } else if (typeof imgUrl === "object" && imgUrl?.src) {
                        // Handle Wix media object format
                        imgUrl = wixMedia.getScaledToFillImageUrl(imgUrl.src, 1200, 800, {});
                    }

                    return {
                        id: item._id || data.title || String(Math.random()),
                        title: data.title || "WATCH FUSION",
                        subtitle: data.subtitle || undefined,
                        description: data.description || "",
                        categoryTag: data.categoryTag || "",
                        buttonText: data.buttonText || "Shop Now",
                        img: imgUrl,
                        url: data.url || "/shop",
                        bg: data.bgGradient || "from-zinc-900 via-black to-zinc-900",
                    };
                });

            if (cmsSlides.length > 0) {
                slides = cmsSlides;
            }
        }
    } catch (err) {
        // If CMS query fails (e.g. collection doesn't exist yet), use fallback slides
        console.info("Banner: using the built-in slides, as no Promotions collection could be read");
    }

    return <SliderClient slides={slides} />;
};

export default Slider;