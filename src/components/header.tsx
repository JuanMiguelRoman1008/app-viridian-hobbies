import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-black">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.webp" alt="Viridian Hobbies Logo" width={40} height={40} />
        <span className="text-xl font-bold">Viridian Hobbies</span>
      </Link>
      <nav className="flex gap-4">
        <Link href="/inventory" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white">
          Inventory
        </Link>
        <Link href="/image-database" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white">
          Image Database
        </Link>
      </nav>
    </header>
  );
}