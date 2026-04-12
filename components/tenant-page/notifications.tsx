import { ProfileIcons } from "./ProfileIcons";
import border from "./border.svg";
import { JSX } from "react";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex w-[405px] items-center justify-between p-2.5 relative bg-primary">
      <div className="relative w-12 h-12 bg-[url(/notification-icons.svg)] bg-[100%_100%]">
        <div className="relative w-[22.92%] h-[22.92%] top-[6.25%] left-[54.17%] bg-error rounded-[5.5px]" />
      </div>

      <img
        className="relative w-px h-[73px] object-cover"
        alt="Border"
        src={border}
      />

      <div className="inline-flex items-center gap-[15px] pl-1 pr-[23px] pt-[3px] pb-1 relative flex-[0_0_auto] bg-card rounded-[500px]">
        <ProfileIcons className="!relative !w-12 !h-12" />
        <div className="relative w-fit font-body-medium font-[number:var(--body-medium-font-weight)] text-high-emphasis text-[length:var(--body-medium-font-size)] tracking-[var(--body-medium-letter-spacing)] leading-[var(--body-medium-line-height)] [font-style:var(--body-medium-font-style)]">
          Leonard Forrosuelo
        </div>
      </div>
    </div>
  );
};
