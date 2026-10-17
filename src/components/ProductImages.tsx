"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

const ProductImages = ({ items }: { items: any }) => {
    const [index, setIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    // Auto-slide every 3 seconds
    useEffect(() => {
        if (!items || items.length <= 1) return;

        const interval = setInterval(nextSlide, 3000);
        return () => clearInterval(interval);
    }, [items, nextSlide]);

    return (
        <div className="">
            <div className="h-[500px] relative overflow-hidden">
                <Image
                    src={items[index].image?.url}
                    alt=""
                    fill
                    sizes="50vw"
                    className="object-cover rounded-md transition-opacity duration-500"
                />
            </div>
            <div className="flex justify-between gap-4 mt-8">
                {items.map((item: any, i: number) => (
                    <div
                        className={`w-1/4 h-32 relative gap-4 mt-8 cursor-pointer rounded-md ${
                            i === index ? "ring-2 ring-brand-navy" : ""
                        }`}
                        key={item._id}
                        onClick={() => setIndex(i)}
                    >
                        <Image
                            src={item.image?.url}
                            alt=""
                            fill
                            sizes="30vw"
                            className="object-cover rounded-md"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductImages;