import Link from "next/link";
import { Car, House, Layers, Tag, type LucideIcon } from "lucide-react";

type ListingType = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string; // no href = coming soon
};

const TYPES: ListingType[] = [
  {
    title: "Item for sale",
    description: "Create a single listing for one or more items to sell.",
    icon: Tag,
    href: "/create/item",
  },
  {
    title: "Create multiple listings",
    description: "Quickly create several listings at the same time.",
    icon: Layers,
  },
  {
    title: "Vehicle for sale",
    description: "Sell a car, truck, motorcycle or other vehicle.",
    icon: Car,
    href: "/create/item?type=vehicle",
  },
  {
    title: "Home for sale or rent",
    description: "List a house or apartment for sale or rent.",
    icon: House,
    href: "/create/item?type=home",
  },
];

export function ListingTypeCards() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
      {TYPES.map(({ title, description, icon: Icon, href }, i) => {
        const body = (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </>
        );
        const style = { animationDelay: `${i * 60}ms` };

        return href ? (
          <Link
            key={title}
            href={href}
            style={style}
            className="animate-pop-in group flex flex-col items-center rounded-xl bg-white px-5 py-7 text-center shadow-sm ring-1 ring-gray-200/70 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            {body}
          </Link>
        ) : (
          <div
            key={title}
            style={style}
            aria-disabled="true"
            className="animate-pop-in relative flex flex-col items-center rounded-xl bg-white/70 px-5 py-7 text-center ring-1 ring-gray-200/70"
          >
            <span className="absolute right-3 top-3 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Coming soon
            </span>
            <div className="flex flex-col items-center opacity-60">{body}</div>
          </div>
        );
      })}
    </div>
  );
}
