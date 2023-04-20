import { NavItem } from "@/types/nav"

interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
  }
}

export const siteConfig: SiteConfig = {
  name: "0u0",
  description: "Get context from your community",
  mainNav: [
    {
      title: "Chat",
      href: "/",
    },
    {
      title: "Settings",
      href: "/settings",
    },
  ],
  links: {
    twitter: "https://twitter.com/0xPetra",
    github: "https://github.com/0xPetra",
  },
}
