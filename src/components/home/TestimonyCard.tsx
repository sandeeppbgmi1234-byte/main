import Image, { StaticImageData } from "next/image";
import React from "react";

interface TestimonyCardProps {
  name: string;
  role: string;
  text: string;
  imageSrc: StaticImageData;
  className?: string;
}

const TestimonyCard: React.FC<TestimonyCardProps> = ({
  name,
  role,
  text,
  imageSrc,
  className = "",
}) => {
  return (
    <div
      className={`absolute bg-white rounded-xl p-5 hover:-translate-y-1 transition-all duration-300 w-[280px] ${className}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-base font-semibold text-[#071329] mb-1">
            {name}
          </h4>
          <p className="text-sm text-[#A876E7] font-medium">{role}</p>
        </div>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 0L9.79611 5.52786H15.6085L10.9062 8.94427L12.7023 14.4721L8 11.0557L3.29772 14.4721L5.09383 8.94427L0.391548 5.52786H6.20389L8 0Z"
                fill="#FFA500"
              />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[#071329] mb-4">{text}</p>
      <div className="absolute -bottom-5 right-5 w-[60px] h-[60px] rounded-full overflow-hidden border-3 border-white   ">
        <Image
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default TestimonyCard;
