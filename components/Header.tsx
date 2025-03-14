"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/loading-screen";
import { useSettings } from "@/components/context/SettingsContext";
import { supabase } from "@/src/integrations/supabase/client";
import { toast } from "sonner";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [searchType, setSearchType] = useState<"onchain" | "offchain">("onchain");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    email?: string;
    name?: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profile } = useSettings();

  // Fetch and sync user state with Supabase Auth
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0],
        });
        
        // Store user info in localStorage for other components
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0],
          isLoggedIn: true,
          settingsKey: `settings_${user.email}`
        }));
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
    };

    fetchUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" && session) {
          const user = session.user;
          setCurrentUser({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
          });
          
          // Store user info in localStorage for other components
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            isLoggedIn: true,
            settingsKey: `settings_${user.email}`
          }));
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
          localStorage.removeItem("currentUser");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handle dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500)); // Simulated delay
      if (searchType === "onchain") {
        router.push(`/search/?address=${encodeURIComponent(address)}`);
      } else {
        router.push(`/search-offchain/?address=${encodeURIComponent(address)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingClick = () => {
    router.push("/setting");
    setDropdownOpen(false);
  };

  const clearAddress = () => setAddress("");

  const handleSearchIconClick = () => router.push("/search");

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem("currentUser"); // Clean up if used
      setCurrentUser(null);
      setDropdownOpen(false);
      toast.success("Logged out successfully");
      router.push("/login");
      if (typeof window !== "undefined" && (window as any).ethereum) {
        console.log("Please disconnect your wallet manually in MetaMask.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const displayName =
    profile?.username && profile.username !== "User"
      ? profile.username
      : currentUser?.name || currentUser?.email?.split("@")[0] || "";

  return (
    <>
      <header className="flex items-center bg-black h-16 px-4">
        <div className="text-white mr-auto ml-4 text-3xl font-bold">
          <h1 className="ml-8">
            <Link href="/">
              <Image
                src="/Img/logo/logo2.png"
                alt="CryptoPath Logo"
                width={75}
                height={75}
                className="inline-block mr-2"
              />
              Crypto<span className="text-[#F5B056]">
                Path<sub>©</sub>
              </span>
            </Link>
          </h1>
        </div>

        <nav className="hidden md:flex justify-center items-center space-x-6">
          <Link href="/" className="text-white text-sm hover:text-[#F5B056] transition">
            Home
          </Link>
          <Link href="/pricetable" className="text-sm hover:text-[#F5B056] transition">
            PriceTable
          </Link>
          <Link href="/transactions" className="text-white text-sm hover:text-[#F5B056] transition">
            Transactions
          </Link>
          <Link href="/Faucet" className="text-white text-sm hover:text-[#F5B056] transition">
            Faucet
          </Link>
          <a href="mailto:cryptopath@gmail.com" className="text-white text-sm hover:text-[#F5B056] transition">
            Support
          </a>

          <form onSubmit={handleSearch} className="relative flex items-center">
            <button
              type="button"
              onClick={handleSearchIconClick}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              <Search size={16} />
            </button>
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search wallet..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10 pr-10 py-2 h-9 w-64 text-sm transition-all duration-200 focus:border-amber-500 rounded-[5px]"
              />
              {address.length > 0 && (
                <button
                  type="button"
                  onClick={clearAddress}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 bg-transparent p-1 rounded-[10px] transition-colors duration-200"
                  aria-label="Clear input"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "onchain" | "offchain")}
              className="ml-2 px-2 py-1 h-9 text-sm text-white bg-black border border-gray-700 rounded-[5px] focus:outline-none hover:bg-gray-800 transition-colors"
            >
              <option value="onchain">On-Chain</option>
              <option value="offchain">Off-Chain</option>
            </select>
          </form>

          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-white text-xs uppercase hover:text-[#F5B056] transition"
              >
                {displayName}
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-[5px] shadow-lg z-20">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-white bg-black hover:text-[#F5B056]"
                  >
                    Logout
                  </button>
                  <button
                    onClick={handleSettingClick}
                    className="block w-full text-left px-4 py-2 text-sm text-white bg-black hover:text-[#F5B056]"
                  >
                    Setting
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-white text-sm hover:text-[#F5B056] transition">
              Login
            </Link>
          )}
        </nav>

        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {isOpen && (
          <div className="absolute top-16 right-0 w-64 bg-black text-white p-6 shadow-lg md:hidden z-50 w-screen">
            <nav className="flex flex-col space-y-4 text-center text-xl">
              <Link
                href="/"
                className="text-sm uppercase hover:text-[#F5B056] transition"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/pricetable"
                className="text-sm uppercase hover:text-[#F5B056] transition"
                onClick={() => setIsOpen(false)}
              >
                Pricetable
              </Link>
              <Link
                href="/transactions"
                className="text-sm uppercase hover:text-[#F5B056] transition"
                onClick={() => setIsOpen(false)}
              >
                Transactions
              </Link>
              <Link
                href="/Faucet"
                className="text-sm uppercase hover:text-[#F5B056] transition"
                onClick={() => setIsOpen(false)}
              >
                Faucet
              </Link>
              <a
                href="mailto:cryptopath@gmail.com"
                className="text-sm uppercase hover:text-[#F5B056] transition"
                onClick={() => setIsOpen(false)}
              >
                Support
              </a>

              <form
                onSubmit={handleSearch}
                className="relative w-3/4 mx-auto mt-4 pt-2 flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={handleSearchIconClick}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <Search size={18} />
                </button>
                <Input
                  type="text"
                  placeholder="Search wallet..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 pr-10 py-2 w-full text-black transition-all duration-200 focus:border-amber-500"
                />
                {address.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAddress}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent p-1 rounded-full"
                    aria-label="Clear input"
                  >
                    <X size={16} />
                  </button>
                )}
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as "onchain" | "offchain")}
                  className="mt-2 px-4 py-2 w-full text-sm text-white bg-black border border-gray-700 rounded-[5px] focus:outline-none hover:bg-gray-800 transition-colors"
                >
                  <option value="onchain">On-Chain</option>
                  <option value="offchain">Off-Chain</option>
                </select>
              </form>

              {currentUser ? (
                <div className="relative flex justify-center mt-4 pt-2">
                  <Link href="/search" className="text-white text-xs uppercase hover:text-[#F5B056]">
                    {displayName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-black bg-white hover:bg-[#F5B056] px-4 py-2 rounded-[5px] transition ml-2"
                  >
                    Logout
                  </button>
                  <button
                    onClick={handleSettingClick}
                    className="block w-full text-left px-4 py-2 text-sm text-white bg-black hover:text-[#F5B056]"
                  >
                    Setting
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-white text-sm uppercase hover:text-[#F5B056] transition">
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <LoadingScreen isLoading={isLoading} />
    </>
  );
};

export default Header;
