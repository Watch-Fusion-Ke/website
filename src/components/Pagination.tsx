"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Pagination = ({
    currentPage,
    hasPrev,
    hasNext,
}: {
    currentPage: number;
    hasPrev: boolean;
    hasNext: boolean;
}) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mt-12 flex justify-between w-full col-span-full">
            <button
                className="rounded-md bg-brand-navy text-white p-2 text-sm w-24 cursor-pointer hover:bg-brand-gold hover:text-brand-navy transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 disabled:hover:text-gray-400"
                disabled={!hasPrev}
                onClick={() => createPageUrl(currentPage - 1)}
            >
                Previous
            </button>
            <button
                className="rounded-md bg-brand-navy text-white p-2 text-sm w-24 cursor-pointer hover:bg-brand-gold hover:text-brand-navy transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-200 disabled:hover:text-gray-400"
                disabled={!hasNext}
                onClick={() => createPageUrl(currentPage + 1)}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;