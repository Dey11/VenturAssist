"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileSearch, MessageCircleMore, Menu, X } from "lucide-react";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveItem(
      pathname === "/add-startup"
        ? "add-startup"
        : pathname === "/chat"
          ? "chat"
          : "dashboard",
    );
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="border-gray-300 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-brand-primary fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out",
          "md:w-[5svw] md:translate-x-0",
          "w-64",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0",
          "p-2",
        )}
      >
        <div className="flex h-full flex-col items-center justify-center md:justify-start md:pt-8">
          <Link href="/" className="mb-8">
            <Image
              src="/venturassist-logo.svg"
              alt="Venturassist"
              width={60}
              height={60}
              className="cursor-pointer"
            />
          </Link>
          <Separator className="mb-4 w-full" />
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  `/${activeItem}` === item.href && "bg-brand-accent/50",
                  "hover:bg-brand-accent/30 rounded-md p-2 transition-colors",
                  "flex min-w-[200px] items-center gap-3 px-3 py-2 md:min-w-0 md:justify-center",
                )}
              >
                {item.icon}
                <span className="text-sm font-medium text-gray-300 md:hidden">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

const navItems = [
  {
    id: 1,
    icon: <FileSearch className={cn("text-gray-300")} />,
    label: "Analyse a startup",
    href: "/add-startup",
  },
  {
    id: 2,
    icon: <MessageCircleMore className={cn("text-gray-300")} />,
    label: "Chat with Venturassist",
    href: "/chat",
  },
];
