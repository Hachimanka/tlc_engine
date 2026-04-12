"use client";

import Link from "next/link";

export default function NavButtons() {
  const features = [
    {
      title: "Home",
      icon: "mingcute:chef-hat-fill",
      page: "/homePage",
    },
    {
      title: "My Pantry",
      icon: "healthicons:vegetables",
      page: "/myPantry",
    },
    {
      title: "Randomizer",
      icon: "streamline-flex:shuffle-solid",
      page: "/randomizer",
    },
    // {
    //   title: "Favorites",
    //   icon: "ant-design:heart-filled",
    //   page: "/favoriteRecipePage",
    // },
  ];
  return (
    <div className="navButton flex flex-col sm:flex-row gap-4">
      {features.map((feature, index) => {
        return (
          <Link key={index} href={feature.page}>
            <div className="group px-2 py-3 flex items-center border border-white lg:border-none justify-center gap-1 hover:bg-mint rounded-lg cursor-pointer transition ">
              {/* <Icon
                icon={feature.icon}
                className="text-xl text-gold group-hover:text-orange"
              /> */}
              <span className=" text-sm group-hover:text-white whitespace-nowrap">
                {feature.title}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
