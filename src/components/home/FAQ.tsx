"use client";

import React, { useState } from "react";
import FAQItem from "./FAQItem";
import Image from "next/image";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How do you connect to my Instagram account?",
      answer:
        "We use a secure OAuth-based connection (you log in via Instagram). To enable messaging & comment actions you typically need a Creator or Business account connected to a Facebook Page. Permissions are explicit and you control what we can access.",
    },
    {
      question: "Will using automation risk my Instagram account?",
      answer:
        "Our automation follows Instagram's guidelines and rate limits to ensure your account stays safe. We use official APIs and implement smart delays to mimic natural behavior.",
    },
    {
      question: "Can I send links and product details through replies?",
      answer:
        "Yes! You can configure automated responses that include links, product details, and custom messages. Our system supports rich text formatting and dynamic variables.",
    },
    {
      question: "Where is my data stored and can I export it?",
      answer:
        "Your data is securely stored on encrypted servers. You have full control and can export all your data at any time through your dashboard settings.",
    },
    {
      question: "What platforms do you support?",
      answer:
        "Currently we support Instagram with plans to expand to other social media platforms. Stay tuned for updates on new integrations.",
    },
  ];

  return (
    <section className="w-full py-20 px-5 relative">
      <div className="text-box flex flex-col justify-center items-center gap-2 mb-16">
        <div className="flex gap-2">
          <span className="text-[#6A06E4] text-[40px] font-extrabold">
            Got Questions?
          </span>{" "}
          <span className="text-[40px] font-extrabold"> We've Got Answers</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* FAQ Accordion */}
        <div className="bg-white rounded-xl   overflow-hidden">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Mockup Image */}
        <div className="relative w-full h-[500px] rounded-xl overflow-hidden border-2 border-[#A876E7]/20 ">
          <div className="absolute inset-0 bg-linear-to-br from-[#A876E7]/5 to-[#6A06E4]/5" />
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <div className="text-center text-gray-400">
              <svg
                className="w-24 h-24 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg">Dashboard Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
