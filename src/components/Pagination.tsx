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

    // A button that leads nowhere is not shown at all, and with only one page there is nothing to show.
    if (!hasPrev && !hasNext) return null;

    const button =
        "rounded-md bg-brand-navy text-white p-2 text-sm w-24 cursor-pointer hover:bg-brand-gold hover:text-brand-navy transition-colors";

    return (
        <div className="mt-12 flex justify-between w-full col-span-full">
            {hasPrev && (
                <button className={button} onClick={() => createPageUrl(currentPage - 1)}>
                    Previous
                </button>
            )}
            {hasNext && (
                <button className={`${button} ml-auto`} onClick={() => createPageUrl(currentPage + 1)}>
                    Next
                </button>
            )}
        </div>
    );
};

export default Pagination;