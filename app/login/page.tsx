"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ParticlesBackground from "@/components/ParticlesBackground";
import { toast } from "sonner";
import { supabase } from "@/src/integrations/supabase/client";
import { Web3OnboardProvider, init, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import coinbaseModule from "@web3-onboard/coinbase";
import infinityWalletModule from "@web3-onboard/infinity-wallet";
import safeModule from "@web3-onboard/gnosis";
import trezorModule from "@web3-onboard/trezor";
import magicModule from "@web3-onboard/magic";
import dcentModule from "@web3-onboard/dcent";
import sequenceModule from "@web3-onboard/sequence";
import tahoModule from "@web3-onboard/taho";
import trustModule from "@web3-onboard/trust";
import okxModule from "@web3-onboard/okx";
import frontierModule from "@web3-onboard/frontier";
import { useAuth } from "@/lib/context/AuthContext";

const dcent = dcentModule();

const INFURA_KEY = '7d389678fba04ceb9510b2be4fff5129';

const walletConnect = walletConnectModule({
  projectId: 'b773e42585868b9b143bb0f1664670f1',
  optionalChains: [1, 137],
});

const injected = injectedModule();
const coinbase = coinbaseModule();
const infinityWallet = infinityWalletModule();
const safe = safeModule();
const sequence = sequenceModule();
const taho = tahoModule();
const trust = trustModule();
const okx = okxModule();
const frontier = frontierModule();
const trezor = trezorModule({ email: "test@test.com", appUrl: "https://www.blocknative.com" });
const magic = magicModule({ apiKey: "pk_live_E9B0C0916678868E" });

const wallets = [
  infinityWallet,
  sequence,
  injected,
  trust,
  okx,
  frontier,
  taho,
  coinbase,
  dcent,
  walletConnect,
  safe,
  magic,
];

const chains = [
  { id: "0x1", token: "ETH", label: "Ethereum Mainnet", rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}` },
  { id: 11155111, token: "ETH", label: "Sepolia", rpcUrl: "https://rpc.sepolia.org/" },
  { id: "0x13881", token: "MATIC", label: "Polygon - Mumbai", rpcUrl: "https://matic-mumbai.chainstacklabs.com" },
  { id: "0x38", token: "BNB", label: "Binance", rpcUrl: "https://bsc-dataseed.binance.org/" },
  { id: "0xA", token: "OETH", label: "OP Mainnet", rpcUrl: "https://mainnet.optimism.io" },
  { id: "0xA4B1", token: "ARB-ETH", label: "Arbitrum", rpcUrl: "https://rpc.ankr.com/arbitrum" },
  { id: "0xa4ec", token: "ETH", label: "Celo", rpcUrl: "https://1rpc.io/celo" },
  { id: 666666666, token: "DEGEN", label: "Degen", rpcUrl: "https://rpc.degen.tips" },
  { id: 2192, token: "SNAX", label: "SNAX Chain", rpcUrl: "https://mainnet.snaxchain.io" },
];

const appMetadata = {
  name: "CryptoPath",
  description: "Login to CryptoPath with your wallet",
  recommendedInjectedWallets: [
    { name: "MetaMask", url: "https://metamask.io" },
    { name: "Coinbase", url: "https://wallet.coinbase.com/" },
  ],
};

const web3Onboard = init({ wallets, chains, appMetadata });

function LoginPageContent() {
  const router = useRouter();
  const { signInWithWalletConnect, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  interface Account {
    address: string;
    ens: string | null;
  }

  const formatWalletAddress = (walletAddress: string) => {
    if (!walletAddress) return "";
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  const [account, setAccount] = useState<Account | null>(null);

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    
    checkExistingSession();
  }, [router]);

  // Handle wallet connection with Supabase
  useEffect(() => {
    if (wallet?.provider && !isLoggedOut) {
      const { address, ens } = wallet.accounts[0];
      setAccount({ address, ens: ens?.name || null });

      const authenticateWithWallet = async () => {
        try {
          setIsLoading(true);
          const { data, error } = await signInWithWalletConnect(address);
          if (error) {
            console.error("Wallet auth error:", error);
            toast.error(`Failed to authenticate with wallet: ${error.message}`);
            return;
          }

          const settingsKey = `settings_${address}`;
          const existingSettings = localStorage.getItem(settingsKey);
          if (!existingSettings) {
            const defaultSettings = {
              profile: {
                username: ens?.name || formatWalletAddress(address),
                profileImage: null,
                backgroundImage: null,
              },
              wallets: [{ id: Date.now().toString(), address, isDefault: true }],
            };
            localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
          }

          const publicUserData = {
            walletAddress: address,
            name: ens?.name || formatWalletAddress(address),
            isLoggedIn: true,
            settingsKey,
          };
          localStorage.setItem("userDisplayInfo", JSON.stringify(publicUserData));
          localStorage.setItem("userToken", data.session?.access_token || "");

          toast.success("Successfully authenticated with wallet");
          router.push("/");
        } catch (error: any) {
          console.error("Error authenticating with wallet:", error);
          toast.error(`Authentication failed: ${error?.message || "Unknown error"}`);
        } finally {
          setIsLoading(false);
        }
      };

      authenticateWithWallet();
    }
  }, [wallet, router, isLoggedOut, signInWithWalletConnect]);

  // Handle email/password login with Supabase
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("email")) setEmailError(error.message);
        else if (error.message.includes("password")) setPasswordError(error.message);
        else toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Something went wrong with the login");
        setIsLoading(false);
        return;
      }

      // Get the user profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const settingsKey = `settings_${email}`;
      const existingSettings = localStorage.getItem(settingsKey);
      if (!existingSettings) {
        const defaultSettings = {
          profile: {
            username: profileData?.display_name || email.split("@")[0],
            profileImage: profileData?.profile_image || null,
            backgroundImage: profileData?.background_image || null,
          },
          wallets: [],
        };
        localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
      }

      const publicUserData = {
        id: data.user.id,
        name: profileData?.display_name || email.split("@")[0],
        email,
        isLoggedIn: true,
        settingsKey,
      };
      localStorage.setItem("currentUser", JSON.stringify(publicUserData));
      localStorage.setItem("userToken", data.session?.access_token || "");

      toast.success("Login successful!");
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet connect/disconnect
  const handleWalletConnect = async () => {
    if (!wallet) {
      connect();
    } else {
      disconnect({ label: wallet.label });
      setAccount(null);
      setIsLoggedOut(true);
      await supabase.auth.signOut();
      localStorage.removeItem("userDisplayInfo");
      localStorage.removeItem("userToken");
      router.push("/login");
    }
  };

  return (
    <>
      <div className="relative">
        <ParticlesBackground />
        <div className="bg-transparent flex min-h-screen flex-col items-center justify-center p-6 relative z-10">
          <div id="form-container" className="w-full max-w-sm md:max-w-3xl">
            <div className="card bg-transparent rounded-md shadow-lg overflow-hidden">
              <div className="card-content p-6 md:p-10">
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                      <p className="text-gray-400">
                        Login to your{" "}
                        <span className="text-[#ff6500] font-bold">CryptoPath</span> account
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className="w-full px-3 py-2 border border-white rounded-md bg-black text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                      {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <label htmlFor="password" className="text-sm font-medium text-white">Password</label>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          className="w-full px-3 py-2 border border-white rounded-md bg-black text-white pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c4.756 0 8.773-3.162 10.065-7.498a10.523 10.523 0 01-4.293-5.774" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {passwordError && <span className="text-red-500 text-sm">{passwordError}</span>}
                    </div>
                    <button
                      type="submit"
                      className={`w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                      disabled={isLoading}
                    >
                     Login
                    </button>
                    <div className="text-center text-sm">
                      <span className="bg-black px-2 text-gray-400">Or continue with</span>
                    </div>
                    <div className="grid gap-2">
                      
                      <button
                        id="google-login"
                        className="flex items-center justify-center w-full border border-white rounded-md py-2 px-4 hover:bg-gray-800"
                        onClick={async () => {
                          setIsLoading(true);
                          try {
                            const { error } = await supabase.auth.signInWithOAuth({
                              provider: "google",
                              options: { redirectTo: `${window.location.origin}/` },
                            });
                            if (error) throw error;
                          } catch (error) {
                            console.error("Google login error:", error);
                            toast.error("Google login failed. Please try again.");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-white">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                        </svg>
                        <span className="sr-only">Login with Google</span>
                      </button>
                      <button
                        id="connectButton"
                        type="button"
                        onClick={handleWalletConnect}
                        disabled={connecting || isLoading}
                        className="flex items-center justify-center w-full border border-white rounded-md py-2 px-4 hover:bg-gray-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-white">
                          <path d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" fill="currentColor" />
                        </svg>
                        <span className="sr-only">Login with Wallet</span>
                      </button>
                    </div>
                    <div className="text-center text-sm text-white">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="text-white underline ml-1">Sign up</Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">
              By clicking continue, you agree to our{" "}
              <a href="#" className="underline text-white">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="underline text-white">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <LoginPageContent />
    </Web3OnboardProvider>
  );
}
