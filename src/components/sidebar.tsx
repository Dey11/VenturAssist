"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileSearch, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    setActiveItem(
      pathname === "/add-startup"
        ? "add-startup"
        : pathname === "/chat"
          ? "chat"
          : "dashboard",
    );
  }, [pathname]);
  console.log(activeItem);

  return (
    <aside className="bg-brand-primary absolute top-0 left-0 h-full w-[5svw] p-2">
      <div className="flex flex-col items-center justify-center">
        <Link href="/">
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
                "hover:bg-brand-accent/30 rounded-md p-2",
              )}
            >
              {item.icon}
            </Link>
          ))}
        </div>
      </div>
    </aside>
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
