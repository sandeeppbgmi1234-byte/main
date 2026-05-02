import Image from "next/image";
import { Instagram } from "lucide-react";
import { redirect } from "next/navigation";
import { getUserWorkspaces } from "./actions";
import { instagramOAuthAction } from "@/api/services/instagram/actions";
import { DASHBOARD_ROUTE } from "@/configs/routes.config";
import ConnectPageGirl0 from "@/assets/stock-images/connect-page-girl-0.png";
import metaLogo from "@/assets/svgs/meta-color.svg";

/**
 * ConnectPage handles the initial Instagram account connection.
 * It is only accessible to users who have no accounts connected.
 */
export default async function ConnectPage() {
  const accounts = await getUserWorkspaces();

  // If user has even one account connected, redirect to dashboard
  if (accounts.length > 0) {
    redirect(DASHBOARD_ROUTE);
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-[960px] w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch relative">
        {/* Left: auth card */}
        <div className="bg-white rounded-lg flex flex-col items-center justify-between p-10 lg:p-12 text-center h-full min-h-[560px]">
          <div className="w-full flex flex-col items-center grow">
            <h2 className="text-[#6A06E4] font-bold text-[32px] mb-8">
              Dmbroo
            </h2>

            {/* Fresh user — full connect flow */}
            <h1 className="text-[#1A1A1A] font-semibold text-lg mb-2 tracking-tight">
              Connect Instagram
            </h1>
            <p className="text-gray-500 text-[13px] mb-8 max-w-[240px] mx-auto">
              Use your Instagram account to connect with us.
            </p>

            {/* Visual connector */}
            <div className="flex items-center justify-center my-6">
              <div className="w-[46px] h-[46px] rounded-[14px] bg-linear-to-tr from-[#FFB800] via-[#FF007A] to-[#6A06E4] flex items-center justify-center ring-[3px] ring-white">
                <Instagram className="text-white w-6 h-6" />
              </div>
              <div className="flex gap-[6px] items-center px-[14px]">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[5px] h-[5px] rounded-full bg-[#6A06E4]"
                  />
                ))}
              </div>
              <div className="w-[46px] h-[46px] rounded-[14px] bg-[#6A06E4] flex items-center justify-center ring-[3px] ring-white">
                <span className="text-white font-bold text-[10px]">DmBroo</span>
              </div>
            </div>

            <div className="px-4 w-full mt-6">
              <form action={instagramOAuthAction}>
                <button
                  type="submit"
                  className="w-full bg-[#6A06E4] hover:bg-[#5a05c4] text-white py-3 rounded-[10px] font-medium text-[15px] transition-all"
                >
                  Go to Instagram
                </button>
              </form>
            </div>

            <p className="mt-5 text-[10px] text-[#686868] leading-relaxed max-w-[240px] mx-auto">
              Log in with instagram and set your permissions. Once that connect
              you're all set to connect with us.
            </p>
          </div>

          {/* Meta badge */}
          <div className="mt-8 flex flex-col items-center">
            <Image
              src={metaLogo}
              alt="Meta Tech Provider"
              className="h-[22px] w-auto object-contain mb-1"
            />
            <p className="text-[10px] text-gray-500 font-normal">
              Certified by Meta as an official Tech Provider.
            </p>
          </div>
        </div>

        {/* Right: illustration */}
        <div className="hidden md:block w-full h-full relative rounded-[20px] overflow-hidden">
          <Image
            src={ConnectPageGirl0}
            alt="Grow your audience"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
