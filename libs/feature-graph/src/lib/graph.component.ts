import {
  Component,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocationStore } from '@storee/data-access-locations';
import { ObjectStore } from '@storee/data-access-objects';
import * as d3 from 'd3';

interface PackNode {
  id: string;
  name: string;
  type: 'root' | 'location' | 'object';
  children?: PackNode[];
  value?: number;
}

/** Returns whether the OS/browser prefers dark mode */
function prefersDark(): boolean {
  return (
    window.matchMedia('(prefers-color-scheme: dark)').matches ||
    document.documentElement.classList.contains('dark')
  );
}

@Component({
  selector: 'lib-graph',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  styles: [
    `
      :host {
        display: block;
      }

      svg {
        cursor: pointer;
      }

      .pack-circle {
        transition:
          fill 0.2s ease,
          stroke 0.2s ease;
      }
      .pack-circle:hover {
        filter: brightness(1.06);
      }

      .pack-label {
        pointer-events: none;
        user-select: none;
      }
    `,
  ],
  template: `
    <div class="max-w-full px-4 lg:px-6 py-8">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <p class="section-label mb-1">{{ 'nav.graph' | transloco }}</p>
          <h1
            class="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            {{ 'graph.title' | transloco }}
          </h1>
          <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {{ 'graph.hint' | transloco }}
          </p>
        </div>
        <!-- Legend -->
        <div
          class="hidden sm:flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400 shrink-0 pt-1"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full bg-brand-500 ring-2 ring-brand-200 dark:ring-brand-800 shrink-0"
            ></span>
            Location
          </div>
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full bg-zinc-400 dark:bg-zinc-500 ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"
            ></span>
            Object
          </div>
        </div>
      </div>

      <!-- Chart canvas -->
      <div
        #svgContainer
        class="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800
               bg-white dark:bg-zinc-900 overflow-hidden"
        style="min-height: 480px; height: calc(100dvh - 260px);"
      ></div>

      <!-- Controls hint -->
      <p
        class="mt-3 text-xs text-zinc-400 dark:text-zinc-600 text-center select-none"
      >
        {{ 'graph.zoomHint' | transloco }}
      </p>
    </div>
  `,
})
export class GraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgContainer') container!: ElementRef<HTMLDivElement>;

  private locationStore = inject(LocationStore);
  private objectStore = inject(ObjectStore);
  private router = inject(Router);
  private zone = inject(NgZone);

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.renderGraph();
      this.resizeObserver = new ResizeObserver(() => this.renderGraph());
      this.resizeObserver.observe(this.container.nativeElement);
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  // ─── Data ─────────────────────────────────────────────────────────────────

  private buildTree(): PackNode {
    const locations = this.locationStore.locations();
    const objects = this.objectStore.objects();

    const nodeMap = new Map<string, PackNode>();
    for (const l of locations) {
      nodeMap.set(l.id, {
        id: l.id,
        name: l.name,
        type: 'location',
        children: [],
      });
    }

    const roots: PackNode[] = [];
    for (const l of locations) {
      const node = nodeMap.get(l.id)!;
      if (l.parent_id && nodeMap.has(l.parent_id)) {
        nodeMap.get(l.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    for (const o of objects) {
      const parent = nodeMap.get(o.location_id);
      if (parent) {
        parent.children!.push({
          id: o.id,
          name: o.name,
          type: 'object',
          value: 1,
        });
      }
    }

    // Give empty locations a minimum size so they're still visible
    for (const node of nodeMap.values()) {
      if (!node.children?.length) {
        node.value = 1;
      }
    }

    return {
      id: 'root',
      name: 'Storee',
      type: 'root',
      children: roots.length
        ? roots
        : [{ id: '__empty', name: '', type: 'object', value: 1 }],
    };
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  private renderGraph() {
    const el = this.container.nativeElement;
    const W = el.clientWidth || 800;
    const H = el.clientHeight || 480;
    const dark = prefersDark();

    const COLORS = {
      bg: dark ? '#18181b' : '#ffffff',
      rootFill: dark ? 'rgba(37,99,235,0.15)' : 'rgba(59,130,246,0.08)',
      rootStroke: dark ? '#3b82f6' : '#93c5fd',
      locFills: dark
        ? [
            'rgba(29,78,216,0.45)',
            'rgba(30,64,175,0.35)',
            'rgba(37,99,235,0.25)',
            'rgba(59,130,246,0.18)',
          ]
        : [
            'rgba(219,234,254,0.9)',
            'rgba(191,219,254,0.8)',
            'rgba(147,197,253,0.6)',
            'rgba(96,165,250,0.4)',
          ],
      locStroke: dark ? '#3b82f6' : '#3b82f6',
      objFill: dark ? '#27272a' : '#f4f4f5',
      objStroke: dark ? '#52525b' : '#d4d4d8',
      locLabel: dark ? '#93c5fd' : '#1d4ed8',
      objLabel: dark ? '#a1a1aa' : '#71717a',
      rootLabel: dark ? '#e4e4e7' : '#18181b',
    };

    // Clear previous render
    d3.select(el).selectAll('*').remove();

    // Build hierarchy & pack layout
    const data = this.buildTree();
    const root = d3
      .hierarchy<PackNode>(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = d3.pack<PackNode>().size([W, H]).padding(4);
    pack(root);

    type PackedNode = d3.HierarchyCircularNode<PackNode>;

    // ─── SVG ────────────────────────────────────────────────────────────────
    const svg = d3
      .select(el)
      .append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', W)
      .attr('height', H)
      .attr('role', 'img')
      .attr('aria-label', 'Storage circle packing chart')
      .style('background', COLORS.bg)
      .style('display', 'block');

    const g = svg.append('g');

    // ─── Track focus for zoom ────────────────────────────────────────────────
    let focus = root as PackedNode;

    const packed = root as PackedNode;
    const view = { x: packed.x, y: packed.y, r: packed.r };

    function zoomTo(v: { x: number; y: number; r: number }) {
      const k = Math.min(W, H) / 2 / v.r;
      g.attr(
        'transform',
        `translate(${W / 2},${H / 2}) scale(${k}) translate(${-v.x},${-v.y})`,
      );
    }

    zoomTo(view);

    // ─── Circles ────────────────────────────────────────────────────────────
    const node = g
      .selectAll<SVGCircleElement, PackedNode>('circle')
      .data(root.descendants() as PackedNode[])
      .join('circle')
      .attr('class', 'pack-circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => d.r)
      .attr('fill', (d) => {
        if (!d.parent) return COLORS.rootFill;
        if (d.data.type === 'object') return COLORS.objFill;
        const depth = Math.min(d.depth - 1, COLORS.locFills.length - 1);
        return COLORS.locFills[depth];
      })
      .attr('stroke', (d) => {
        if (!d.parent) return COLORS.rootStroke;
        if (d.data.type === 'object') return COLORS.objStroke;
        return COLORS.locStroke;
      })
      .attr('stroke-width', (d) =>
        d.parent ? (d.data.type === 'object' ? 1 : 1.5) : 2,
      )
      .style('opacity', 0)
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d === focus) {
          // Click focused location → navigate to it (leaf objects navigate directly)
          if (d.data.type !== 'root' && d.data.id !== '__empty') {
            this.zone.run(() => {
              const path =
                d.data.type === 'location'
                  ? `/location/${d.data.id}`
                  : `/object/${d.data.id}`;
              this.router.navigateByUrl(path);
            });
          }
          return;
        }
        // Zoom into clicked node (or zoom out if clicking background / root)
        zoom(d.children ? d : (d.parent ?? (root as PackedNode)));
      });

    // Fade in
    node
      .transition()
      .delay((_, i) => i * 8)
      .duration(350)
      .ease(d3.easeBackOut.overshoot(1.1))
      .style('opacity', 1);

    // ─── Labels ─────────────────────────────────────────────────────────────
    const label = g
      .selectAll<SVGTextElement, PackedNode>('text')
      .data(root.descendants() as PackedNode[])
      .join('text')
      .attr('class', 'pack-label')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'Outfit, system-ui, sans-serif')
      .attr('font-size', (d) => {
        if (!d.parent) return Math.max(10, Math.min(16, d.r / 4));
        if (d.data.type === 'object')
          return Math.max(8, Math.min(12, d.r * 0.55));
        return Math.max(9, Math.min(14, d.r / 3.5));
      })
      .attr('font-weight', (d) =>
        !d.parent || d.data.type === 'location' ? '600' : '400',
      )
      .attr('fill', (d) => {
        if (!d.parent) return COLORS.rootLabel;
        if (d.data.type === 'object') return COLORS.objLabel;
        return COLORS.locLabel;
      })
      .style('opacity', 0)
      .text((d) => {
        if (d.data.id === '__empty') return '';
        const maxLen = Math.max(3, Math.floor(d.r / 5));
        const name = d.data.name;
        return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
      });

    // Show labels for visible levels
    function updateLabels(focusNode: PackedNode) {
      label
        .transition()
        .duration(300)
        .style('opacity', (d) => {
          if (d === focusNode) return 1;
          if (d.parent === focusNode) return d.r > 14 ? 1 : 0;
          return 0;
        });
    }

    updateLabels(focus);

    // ─── Zoom animation ─────────────────────────────────────────────────────
    function zoom(targetNode: PackedNode) {
      focus = targetNode;

      svg
        .transition()
        .duration(600)
        .ease(d3.easeCubicInOut)
        .tween('zoom', () => {
          const i = d3.interpolateZoom(
            [view.x, view.y, view.r * 2],
            [targetNode.x, targetNode.y, targetNode.r * 2],
          );
          return (t: number) => {
            const [vx, vy, vr] = i(t);
            view.x = vx;
            view.y = vy;
            view.r = vr / 2;
            zoomTo(view);
          };
        });

      updateLabels(targetNode);
    }

    // Click SVG background → zoom back to root
    svg.on('click', () => zoom(root as PackedNode));
  }
}
