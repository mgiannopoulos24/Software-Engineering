// frontend/src/components/ui/slider.tsx

'use client';

import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const a11yValue = value ?? [0];

  return (
      <SliderPrimitive.Root
          ref={ref}
          value={value}
          className={cn('relative flex w-full touch-none select-none items-center', className)}
          {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>

        {a11yValue.map((_, i) => (
            <SliderPrimitive.Thumb
                key={i} // Το key είναι απαραίτητο για τη React όταν κάνουμε render λίστας
                className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            />
        ))}
      </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
