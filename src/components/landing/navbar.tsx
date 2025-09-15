import Link from "next/link";
import { Button } from "../ui/button";
import Image from "next/image";

export default function Navbar() {
  return (
    <div className="flex w-full items-center justify-between py-2">
      <Image
        src="/venturassist-logo.svg"
        alt="Venturassist"
        width={60}
        height={60}
      />
      <Link href="/signup">
        <Button variant="brand">Sign up now</Button>
      </Link>
    </div>
  );
}
