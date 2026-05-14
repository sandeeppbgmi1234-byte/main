"use client";

import { useState } from "react";

const Section3 = () => {
  return (
    <section className="py-20">
      <div className="text-box flex flex-col justify-center items-center gap-2 mb-16">
        <div className="flex gap-2">
          <span className="text-[#6A06E4] text-[40px] font-extrabold">
            How Dmbroo Automates
          </span>{" "}
          <span className="text-[40px] font-extrabold">
            {" "}
            Your Social Growth
          </span>
        </div>
        <p className="text-[20px] font-medium text-[#071329]">
          Convert interactions into followers, engagement, and real results.
        </p>
      </div>

      <TabChanger />
    </section>
  );
};

const TabChanger = () => {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step Tabs */}
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((step, index) => (
          <button
            key={index}
            className={`px-8 py-4 text-[#6A06E4] text-xl font-medium rounded-t-2xl ${activeTab === index + 1 ? "bg-[#7500FF] text-white" : ""}`}
            onClick={() => setActiveTab(index + 1)}
          >
            Step {step}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-[#7500FF] p-12   border border-purple-200">
        <div className="grid grid-cols-2 gap-12">
          {/* Left: Text Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-seminbold text-white">
              Connect Your Account
            </h3>
            <p className="text-lg font-medium text-[#E0C7FF] leading-relaxed">
              Securely connect your Instagram Creator or Business account.
            </p>
          </div>

          {/* Right: Image Placeholder */}
          <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Image Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Section3;
