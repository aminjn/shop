"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useShop } from "@/lib/store";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function LocaleLink({ href, ...props }: Props) {
  const { locale } = useShop();
  const full = href === "/" ? `/${locale}` : `/${locale}${href}`;
  return <Link href={full} {...props} />;
}
