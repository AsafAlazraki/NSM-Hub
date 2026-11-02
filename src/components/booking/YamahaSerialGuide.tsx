"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interactive version of the service team's "Yamaha Serial & Model Number
 * Guide" graphic, shown from the booking form's engine details section so
 * customers can find the numbers we ask them for.
 */

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span
    className={cn(
      'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
      className
    )}
  >
    {children}
  </span>
);

const StickerDiagram = () => (
  <div className="rounded-2xl bg-zinc-900 p-4 sm:p-6 shadow-inner">
    <div className="flex flex-col gap-3">
      {/* Top row: YAMAHA + model */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xl sm:text-2xl font-black italic tracking-wider text-white select-none">
          YAMAHA
        </span>
        <div className="relative">
          <div className="rounded-lg border-2 border-dashed border-sky-400 p-1.5">
            <div className="rounded-md bg-zinc-200 px-4 py-2 sm:px-8 sm:py-2.5 text-center font-mono text-lg sm:text-2xl font-semibold tracking-[0.2em] text-zinc-800">
              F250XCB
            </div>
          </div>
          <span className="absolute -top-2.5 -right-2 rounded-full bg-sky-400 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-zinc-900">
            MODEL
          </span>
        </div>
      </div>

      {/* Bottom row: serial parts */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative">
          <div className="rounded-lg border-[3px] border-yellow-400 p-1">
            <div className="rounded-md bg-zinc-200 px-4 py-2 sm:px-6 sm:py-2.5 text-center font-mono text-lg sm:text-2xl font-semibold tracking-[0.2em] text-zinc-800">
              6KH
            </div>
          </div>
          <Badge className="absolute -top-2.5 -right-2 bg-yellow-400 text-zinc-900 ring-2 ring-zinc-900">1</Badge>
        </div>

        <div className="relative rounded-md bg-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5 text-center font-mono text-lg sm:text-2xl font-semibold text-zinc-500">
          X
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-7 sm:w-8 -translate-x-1/2 -translate-y-1/2 rotate-[-20deg] rounded bg-red-500" />
        </div>

        <div className="relative flex-1 min-w-[9rem]">
          <div className="rounded-lg border-[3px] border-yellow-400 p-1">
            <div className="rounded-md bg-zinc-200 px-4 py-2 sm:px-6 sm:py-2.5 text-center font-mono text-lg sm:text-2xl font-semibold tracking-[0.2em] text-zinc-800">
              1009179
            </div>
          </div>
          <Badge className="absolute -top-2.5 -right-2 bg-yellow-400 text-zinc-900 ring-2 ring-zinc-900">2</Badge>
        </div>
      </div>

      <div className="text-[10px] leading-tight text-zinc-400">
        <p>YAMAHA MOTOR CO.,LTD.</p>
        <p>MADE IN JAPAN</p>
      </div>
    </div>
  </div>
);

export const YamahaSerialGuideContent = () => (
  <div className="space-y-6">
    <p className="text-sm sm:text-base text-muted-foreground">
      You&apos;ll find this sticker on the{' '}
      <strong className="text-foreground">port side of the transom bracket</strong> — the bracket
      that holds the engine to the back of the boat, on the left side when you&apos;re facing
      forward. We need <strong className="text-foreground">two separate numbers</strong> from it:
      the <strong className="text-foreground">serial number</strong>{' '}
      <span className="whitespace-nowrap">(highlighted in yellow)</span> and the{' '}
      <strong className="text-foreground">model number</strong>{' '}
      <span className="whitespace-nowrap">(outlined in blue)</span>.
    </p>

    <StickerDiagram />

    {/* Serial number explainer */}
    <div className="space-y-3">
      <h4 className="text-xs font-extrabold uppercase tracking-widest text-blue-700">Serial Number</h4>
      <ul className="space-y-2.5 text-sm sm:text-base">
        <li className="flex items-center gap-3">
          <Badge className="bg-yellow-400 text-zinc-900">1</Badge>
          <span><strong className="font-mono">6KH</strong> — first part of the serial number</span>
        </li>
        <li className="flex items-center gap-3">
          <Badge className="bg-yellow-400 text-zinc-900">2</Badge>
          <span><strong className="font-mono">1009179</strong> — second part of the serial number</span>
        </li>
        <li className="flex items-center gap-3">
          <Badge className="bg-red-100 text-red-600"><X className="h-3.5 w-3.5" strokeWidth={3} /></Badge>
          <span><strong className="font-mono">X</strong> — shaft length letter. Leave this out.</span>
        </li>
      </ul>
    </div>

    <div className="border-t" />

    {/* Model number explainer */}
    <div className="space-y-3">
      <h4 className="text-xs font-extrabold uppercase tracking-widest text-blue-700">Model Number</h4>
      <div className="flex items-center gap-3 text-sm sm:text-base">
        <span className="shrink-0 rounded-full bg-sky-200 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-sky-900">
          MODEL
        </span>
        <span>
          <strong className="font-mono">F250XCB</strong> — the top row. This is a{' '}
          <strong>separate number</strong>, not part of the serial. Please send it as well.
        </span>
      </div>
    </div>

    {/* Example summary */}
    <div className="rounded-2xl bg-[#0c2d52] p-4 sm:p-5 text-white">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-yellow-300">
        In this example, please enter
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-yellow-400/90 bg-white/5 p-3.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">Serial Number</p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold leading-tight">6KH 1009179</p>
          <p className="mt-1.5 text-xs text-sky-200/90">Parts 1 and 2, without the shaft length letter</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-sky-400 bg-white/5 p-3.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">Model Number</p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-bold leading-tight">F250XCB</p>
          <p className="mt-1.5 text-xs text-sky-200/90">The top row, entered on its own</p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs sm:text-sm text-sky-100">
        These are two different numbers — please don&apos;t join them together.
      </p>
    </div>
  </div>
);

export const YamahaSerialGuideDialog = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs sm:text-sm text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800">
        <HelpCircle className="h-4 w-4 mr-1.5" />
        Where do I find these?
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
      <DialogHeader className="text-left space-y-1">
        <p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
          Takes ten seconds
        </p>
        <DialogTitle className="font-headline text-2xl sm:text-3xl font-bold text-blue-700 leading-tight">
          Finding your serial &amp; model numbers
        </DialogTitle>
      </DialogHeader>
      <YamahaSerialGuideContent />
    </DialogContent>
  </Dialog>
);
