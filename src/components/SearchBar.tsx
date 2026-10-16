
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const SearchBar = () => {

  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (name) {
      router.push(`/list?name=${name}`)
    }
  };

  return (
    <form
      className="flex items-center justify-between gap-3 bg-gray-100 px-4 py-2.5 rounded-lg flex-1"
      onSubmit={handleSearch}
    >
      <input
        type="text"
        name="name"
        placeholder="Search watches"
        aria-label="Search watches"
        className="flex-1 bg-transparent outline-none"
      />
      <button className="cursor-pointer" aria-label="Search">
        <Image src="/search.png" alt="" width={16} height={16} />
      </button>
    </form>
  );
};

export default SearchBar;