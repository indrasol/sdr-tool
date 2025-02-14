import { type HTMLAttributes, type ReactNode } from 'react';
import type { PanelPosition } from '@xyflow/system';
export type PanelProps = HTMLAttributes<HTMLDivElement> & {
    /** Set position of the panel
     * @example 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
     */
    position?: PanelPosition;
    children: ReactNode;
};
export declare const Panel: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & {
    /** Set position of the panel
     * @example 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
     */
    position?: PanelPosition | undefined;
    children: ReactNode;
} & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=index.d.ts.map