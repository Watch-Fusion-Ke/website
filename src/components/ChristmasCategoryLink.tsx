"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./ChristmasCategoryLink.module.css";

gsap.registerPlugin(useGSAP);

const stars = [
  { left: "6%", top: "2px" },
  { left: "17%", top: "10px" },
  { left: "29%", top: "1px" },
  { left: "40%", top: "7px" },
  { left: "52%", top: "2px" },
  { left: "64%", top: "11px" },
  { left: "76%", top: "3px" },
  { left: "88%", top: "9px" },
  { left: "95%", top: "1px" },
] as const;

const ChristmasCategoryLink = ({ name, href }: { name: string; href: string }) => {
  const link = useRef<HTMLAnchorElement>(null);
  const lastSpace = name.lastIndexOf(" ");

  useGSAP(() => {
    const root = link.current;
    if (!root) return;
    const starNodes = Array.from(root.querySelectorAll<SVGSVGElement>("[data-christmas-star]"));
    const halo = root.querySelector<HTMLElement>("[data-christmas-halo]");
    const cane = root.querySelector<SVGSVGElement>("[data-christmas-cane]");
    if (!starNodes.length || !halo || !cane) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ repeat: -1, repeatDelay: 0.2 })
        .fromTo(starNodes,
          { y: -15, scale: 0.35, autoAlpha: 0, rotation: -14 },
          { y: 12, scale: 1.05, autoAlpha: 0.95, rotation: 8, duration: 0.65, stagger: 0.2, ease: "sine.out" }, 0)
        .to(starNodes,
          { y: 30, scale: 0.55, autoAlpha: 0, rotation: 30, duration: 1.05, stagger: 0.2, ease: "power1.in" }, 0.65);

      gsap.fromTo(halo,
        { autoAlpha: 0.4, scale: 0.82 },
        { autoAlpha: 0.95, scale: 1.18, duration: 1.15, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.fromTo(cane,
        { rotation: -3 },
        { rotation: 3, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    return () => media.revert();
  }, { scope: link });

  return (
    // data-row-focus marks the entry the phone row opens centred on, so the row starts balanced the way the computer's is.
    <Link ref={link} href={href} data-row-focus="" className={`${styles.link} snap-center`}>
      <span className={styles.giftHalo} data-christmas-halo aria-hidden="true" />
      <svg className={styles.gift} viewBox="0 0 32 34" aria-hidden="true">
        <rect className={styles.giftBox} x="3" y="13" width="26" height="18" rx="2" />
        <rect className={styles.giftLid} x="1.5" y="10" width="29" height="6" rx="1.5" />
        <path className={styles.giftRibbon} d="M13 10h6v21h-6z" />
        <path className={styles.giftBow} d="M16 10C9 10 5 7 7 4c2-3 7 0 9 6Zm0 0c7 0 11-3 9-6-2-3-7 0-9 6Z" />
        <path className={styles.giftShine} d="M4 18h2v8H4z" />
      </svg>
      <span className={styles.starfield} aria-hidden="true">
        {stars.map((star, index) => (
          <svg key={index} data-christmas-star className={styles.star} style={star} viewBox="0 0 12 12">
            <path d="M6 0 7.2 4.8 12 6 7.2 7.2 6 12 4.8 7.2 0 6 4.8 4.8Z" />
          </svg>
        ))}
      </span>
      <span className={styles.words}>
        {lastSpace > 0 ? <>{name.slice(0, lastSpace)} <em>{name.slice(lastSpace + 1)}</em></> : name}
      </span>
      <svg className={styles.cane} data-christmas-cane viewBox="0 0 24 36" aria-hidden="true">
        <path className={styles.caneBody} d="M7 32V11a7 7 0 0 1 14 0v2" />
        <path className={styles.caneStripe} d="m3.5 22 7 2m-7-9 7 2m-.8-12 5.8 5m1-5 4.7 5" />
      </svg>
    </Link>
  );
};

export default ChristmasCategoryLink;
