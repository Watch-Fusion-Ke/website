'use client'
import Link from 'next/link'
import React from 'react'
import Image from 'next/image'
import SearchBar from './SearchBar'
import Categories from './CategoryList'
import Menu from './Menu'
import NavIcons from './NavIcons'
import MobileCartLink from './MobileCartLink'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
  return (
    <div className="md:h-20 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative">
      {/* Mobile Navbar: menu button on the left, logo in the middle, cart on the right, search underneath */}
      <div data-testid="phone-header" className='md:hidden border-b border-gray-200 pb-3'>
        <div className='grid grid-cols-[1fr_auto_1fr] items-center h-14'>
          <div className='flex justify-start'>
            <Menu />
          </div>
          <Link href="/" className='flex items-center h-11'>
            <span className='flex items-center bg-brand-black rounded-md px-2.5 py-1'>
              <Image
                src="/logo.png"
                alt="Watch Fusion Kenya"
                width={118}
                height={50}
                priority
                className='h-6 w-auto'
              />
            </span>
          </Link>
          <div className='flex items-center justify-end gap-1'>
            <ThemeToggle />
            <MobileCartLink />
          </div>
        </div>
        <SearchBar />
      </div>

      {/* Desktop Navbar */}
      <div data-testid="desktop-header" className='hidden md:flex items-center justify-between gap-8 h-full'>
        {/* Left Section */}
        <div className='w-1/3 xl:w-1/2 flex items-center gap-12'>
          <Link href="/" className="flex items-center flex-shrink-0 bg-brand-black rounded-lg px-3 py-1.5">
            <Image
              src="/logo.png"
              alt="Watch Fusion Kenya"
              width={118}
              height={50}
              priority
              className='h-10 w-auto'
            />
          </Link>
          <div className="hidden xl:flex gap-4">
            <Link href="/" className="hover:text-gray-600 transition-colors">
              Homepage
            </Link>
            <Link href="/shop" className="hover:text-gray-600 transition-colors">
              Shop
            </Link>
            <Link href="/deals" className="hover:text-gray-600 transition-colors">
              Deals
            </Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className='w-2/3 xl:w-1/2 flex items-center justify-between gap-8'>
          <SearchBar />
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <NavIcons />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar