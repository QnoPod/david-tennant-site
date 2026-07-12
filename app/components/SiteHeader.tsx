"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "../data/content";

/** PCとスマートフォンで共通利用するグローバルナビゲーション。 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner shell">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span>DT</span><strong>DAVID TENNANT<br />ARCHIVE</strong>
        </Link>
        <button className="menu-button" type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((value) => !value)}>
          <span>{open ? "CLOSE" : "MENU"}</span><i aria-hidden="true" />
        </button>
        <nav id="main-nav" className={`main-nav ${open ? "main-nav--open" : ""}`} aria-label="メインナビゲーション">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return <Link key={item.href} className={active ? "is-active" : ""} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>;
          })}
        </nav>
      </div>
    </header>
  );
}
