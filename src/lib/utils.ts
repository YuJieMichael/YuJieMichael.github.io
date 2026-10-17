import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** 合并 Tailwind 类名，后面的覆盖前面的（Spectrum UI 组件用） */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
