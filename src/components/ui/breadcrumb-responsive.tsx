"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BreadcrumbItem {
  href?: string
  label: string
}

interface BreadcrumbResponsiveProps {
  items: BreadcrumbItem[]
  maxDisplayItems?: number
}

const ITEMS_TO_DISPLAY = 3

export function BreadcrumbResponsive({
  items,
  maxDisplayItems = ITEMS_TO_DISPLAY
}: BreadcrumbResponsiveProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Se não há itens suficientes, mostrar todos
  if (items.length <= maxDisplayItems) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink
                    href={item.href}
                    className="text-sm sm:text-base min-h-[44px] sm:min-h-[40px] flex items-center px-1 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="max-w-[120px] sm:max-w-[200px] md:max-w-none truncate">
                      {item.label}
                    </span>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-sm sm:text-base min-h-[44px] sm:min-h-[40px] flex items-center px-1 py-2">
                    <span className="max-w-[120px] sm:max-w-[200px] md:max-w-none truncate font-medium">
                      {item.label}
                    </span>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator className="text-muted-foreground" />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Primeiro item sempre visível */}
        <BreadcrumbItem>
          <BreadcrumbLink
            href={items[0].href ?? "/"}
            className="text-sm sm:text-base min-h-[44px] sm:min-h-[40px] flex items-center px-1 py-2 rounded-md hover:bg-muted transition-colors"
          >
            <span className="max-w-[80px] sm:max-w-[120px] md:max-w-none truncate">
              {items[0].label}
            </span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Menu com itens ocultos */}
        <BreadcrumbItem>
          {isDesktop ? (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger
                className="min-h-[44px] sm:min-h-[40px] flex items-center gap-1 px-2 py-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                <BreadcrumbEllipsis className="h-5 w-5 sm:h-4 sm:w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                {items.slice(1, -2).map((item, index) => (
                  <DropdownMenuItem key={index} className="min-h-[44px] sm:min-h-[40px]">
                    <a
                      href={item.href ? item.href : "#"}
                      className="w-full text-sm sm:text-base py-2"
                    >
                      {item.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger
                className="min-h-[44px] flex items-center gap-1 px-2 py-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Toggle Menu"
              >
                <BreadcrumbEllipsis className="h-5 w-5" />
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle className="text-lg">Navegar para</DrawerTitle>
                  <DrawerDescription className="text-base">
                    Selecione uma página para navegar.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-2 px-4 pb-4">
                  {items.slice(1, -2).map((item, index) => (
                    <a
                      key={index}
                      href={item.href ? item.href : "#"}
                      className="min-h-[44px] flex items-center py-3 px-2 text-base rounded-md hover:bg-muted transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
                <DrawerFooter className="pt-4">
                  <DrawerClose asChild>
                    <Button variant="outline" className="min-h-[44px] text-base">
                      Fechar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Últimos itens sempre visíveis */}
        {items.slice(-maxDisplayItems + 1).map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink
                  href={item.href}
                  className="text-sm sm:text-base min-h-[44px] sm:min-h-[40px] flex items-center px-1 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="max-w-[100px] sm:max-w-[150px] md:max-w-none truncate">
                    {item.label}
                  </span>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-sm sm:text-base min-h-[44px] sm:min-h-[40px] flex items-center px-1 py-2">
                  <span className="max-w-[100px] sm:max-w-[150px] md:max-w-none truncate font-medium">
                    {item.label}
                  </span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.slice(-maxDisplayItems + 1).length - 1 && (
              <BreadcrumbSeparator />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}