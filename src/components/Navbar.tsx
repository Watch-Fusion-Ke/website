'use client'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import SearchBar from './SearchBar'
import Categories from './CategoryList'
import Menu from './Menu'
import NavIcons from './NavIcons'
import MobileCartLink from './MobileCartLink'
import ThemeToggle from './ThemeToggle'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'

const Navbar = () => {
  const frame = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const searchRow = useRef<HTMLDivElement>(null)
  const natural = useRef<HTMLDivElement>(null)
  const { elevated, searchHidden } = useHeaderScroll(frame)

  // The sticky frame keeps the header's full height even while the search row is folded, so the page below never shifts
  // (a shift would move the scroll position, and that would unfold the row again). Only the panel inside it changes size.
  const [reserve, setReserve] = useState<number | null>(null)
  useEffect(() => {
    const el = panel.current
    const slide = searchRow.current
    const row = natural.current
    if (!el || !slide || !row || typeof ResizeObserver === 'undefined') return
    // The full height, whatever the search row is doing: everything in the panel except the sliding part, plus the search
    // row at its natural height. Measuring the panel alone while the row slides would resize the frame and shift the page.
    const measure = () => {
      const full = Math.round(el.getBoundingClientRect().height - slide.getBoundingClientRect().height + row.getBoundingClientRect().height)
      setReserve((prev) => (prev !== null && Math.abs(prev - full) < 2 ? prev : full))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={frame}
      style={reserve ? ({ '--reserve': `${reserve}px` } as React.CSSProperties) : undefined}
      className='pointer-events-none sticky top-0 z-[45] h-[var(--reserve,auto)] md:pointer-events-auto md:h-20'
    >
    <div
      ref={panel}
      className={`pointer-events-auto bg-[var(--page)] pt-[env(safe-area-inset-top)] md:h-20 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 transition-shadow duration-200 motion-reduce:transition-none ${
        elevated ? 'shadow-[0_8px_20px_-14px_rgba(0,0,0,0.45)]' : ''
      }`}
    >
      {/* Mobile Navbar: menu button on the left, logo in the middle, cart on the right, search underneath */}
      <div data-testid="phone-header" className='md:hidden border-b border-gray-200'>
        <div className='grid grid-cols-[1fr_auto_1fr] items-center h-14'>
          <div className='flex justify-start'>
            <Menu />
          </div>
          <Link href="/" aria-label="Watch Fusion Kenya, home" className='flex items-center h-11'>
            <span className='relative block h-8 aspect-[2000/665] overflow-hidden'>
              {/* Black lettering on the light page, white lettering on the black page */}
              <Image
                src="/logo-on-light.png"
                alt="Watch Fusion Kenya"
                fill
                sizes="110px"
                loading="eager"
                className='object-cover object-[50%_44%] dark:hidden'
              />
              <Image
                src="/logo.png"
                alt=""
                fill
                loading="eager"
                sizes="110px"
                className='hidden object-cover object-[50%_44%] dark:block dark:drop-shadow-[0_0_8px_rgba(249,201,43,0.5)]'
              />
            </span>
          </Link>
          <div className='flex items-center justify-end gap-1'>
            <ThemeToggle />
            <MobileCartLink />
          </div>
        </div>
        {/* The search row folds away while reading down the page and comes back at the first scroll up */}
        <div
          ref={searchRow}
          data-header-search
          aria-hidden={searchHidden || undefined}
          className={`grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none ${
            searchHidden ? 'grid-rows-[0fr] invisible' : 'grid-rows-[1fr]'
          }`}
        >
          <div className='overflow-hidden'>
            <div ref={natural} className='pb-3'>
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navbar */}
      <div data-testid="desktop-header" className='hidden md:flex items-center justify-between gap-8 h-full'>
        {/* Left Section */}
        <div className='w-1/3 xl:w-1/2 flex items-center gap-12'>
          <Link href="/" aria-label="Watch Fusion Kenya, home" className="flex items-center flex-shrink-0">
            <span className='relative block h-12 aspect-[2000/665] overflow-hidden'>
              <Image
                src="/logo-on-light.png"
                alt="Watch Fusion Kenya"
                fill
                sizes="160px"
                loading="eager"
                className='object-cover object-[50%_44%] dark:hidden'
              />
              <Image
                src="/logo.png"
                alt=""
                fill
                loading="eager"
                sizes="160px"
                className='hidden object-cover object-[50%_44%] dark:block dark:drop-shadow-[0_0_8px_rgba(249,201,43,0.5)]'
              />
            </span>
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
    </div>
  )
}

export default Navbar
