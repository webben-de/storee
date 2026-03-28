import {
  Component, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocationStore } from '@storee/data-access-locations';
import { ObjectStore } from '@storee/data-access-objects';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  name: string;
  type: 'root' | 'location' | 'object';
  children?: GraphNode[];
}

/** Returns whether the OS/browser prefers dark mode */
function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ||
    document.documentElement.classList.contains('dark');
}

@Component({
  selector: 'lib-graph',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  styles: [`
    :host { display: block; }

    .graph-node { cursor: pointer; }
    .graph-node circle {
      transition: r 0.2s cubic-bezier(0.16,1,0.3,1),
                  filter 0.2s ease;
    }
    .graph-node:hover circle {
      filter: brightness(1.08) drop-shadow(0 2px 8px rgba(59,130,246,0.35));
    }
    .graph-node.root-node { cursor: default; }

    .node-enter {
      animation: nodeIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes nodeIn {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }

    .link-enter {
      animation: linkIn 0.5s ease-out both;
    }
    @keyframes linkIn {
      from { stroke-dashoffset: var(--len); }
      to   { stroke-dashoffset: 0; }
    }
  `],
  template: `
    <div class="max-w-full px-4 lg:px-6 py-8">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <p class="section-label mb-1">{{ 'nav.graph' | transloco }}</p>
          <h1 class="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {{ 'graph.title' | transloco }}
          </h1>
          <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {{ 'graph.hint' | transloco }}
          </p>
        </div>
        <!-- Legend -->
        <div class="hidden sm:flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400 shrink-0 pt-1">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-brand-500 ring-2 ring-brand-200 dark:ring-brand-800 shrink-0"></span>
            Location
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-zinc-400 dark:bg-zinc-500 ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"></span>
            Object
          </div>
        </div>
      </div>

      <!-- Graph canvas -->
      <div
        #svgContainer
        class="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800
               bg-white dark:bg-zinc-900 overflow-hidden"
        style="min-height: 480px; height: calc(100dvh - 260px);"
      ></div>

      <!-- Controls hint -->
      <p class="mt-3 text-xs text-zinc-400 dark:text-zinc-600 text-center select-none">
        Scroll to zoom · Drag to pan · Click a node to navigate
      </p>
    </div>
  `,
})
export class GraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgContainer') container!: ElementRef<HTMLDivElement>;

  private locationStore = inject(LocationStore);
  private objectStore   = inject(ObjectStore);
  private router        = inject(Router);
  private zone          = inject(NgZone);

  private resizeObserver?: ResizeObserver;
  private svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;

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

  private buildTree(): GraphNode {
    const locations = this.locationStore.locations();
    const objects   = this.objectStore.objects();

    const nodeMap = new Map<string, GraphNode>();
    for (const l of locations) {
      nodeMap.set(l.id, { id: l.id, name: l.name, type: 'location', children: [] });
    }

    const roots: GraphNode[] = [];
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
        parent.children!.push({ id: o.id, name: o.name, type: 'object' });
      }
    }

    return { id: 'root', name: 'Storee', type: 'root', children: roots };
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  private renderGraph() {
    const el    = this.container.nativeElement;
    const W     = el.clientWidth  || 800;
    const H     = el.clientHeight || 480;
    const dark  = prefersDark();

    const COLORS = {
      bg:           dark ? '#18181b' : '#ffffff',
      bgCanvas:     dark ? '#0f0f11' : '#fafafa',
      linkStroke:   dark ? '#3f3f46' : '#e4e4e7',
      linkHighlight:dark ? '#3b82f6' : '#93c5fd',
      rootFill:     dark ? '#2563eb' : '#3b82f6',
      rootRing:     dark ? '#1d4ed8' : '#2563eb',
      locFill:      dark ? '#1e40af' : '#eff6ff',
      locStroke:    dark ? '#3b82f6' : '#3b82f6',
      locText:      dark ? '#93c5fd' : '#1d4ed8',
      objFill:      dark ? '#27272a' : '#f4f4f5',
      objStroke:    dark ? '#52525b' : '#a1a1aa',
      objText:      dark ? '#a1a1aa' : '#52525b',
      labelColor:   dark ? '#e4e4e7' : '#18181b',
      labelSub:     dark ? '#71717a' : '#a1a1aa',
    };

    // Clear
    d3.select(el).selectAll('*').remove();

    const data = this.buildTree();
    const root = d3.hierarchy(data);

    // Dynamic node spacing
    const nodeCount = root.descendants().length;
    const nodeSpacingY = Math.max(48, Math.min(72, H / Math.max(nodeCount * 0.5, 4)));
    const nodeSpacingX = Math.max(200, Math.min(260, W / Math.max(root.height + 1, 2)));

    const treeLayout = d3.tree<GraphNode>().nodeSize([nodeSpacingY, nodeSpacingX]);
    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();
    const minX  = Math.min(...nodes.map((n) => n.x ?? 0));
    const maxX  = Math.max(...nodes.map((n) => n.x ?? 0));
    const minY  = Math.min(...nodes.map((n) => (n as d3.HierarchyPointNode<GraphNode>).y ?? 0));
    const maxY  = Math.max(...nodes.map((n) => (n as d3.HierarchyPointNode<GraphNode>).y ?? 0));
    const treeW = maxY - minY + nodeSpacingX;
    const treeH = maxX - minX + nodeSpacingY * 2;

    // SVG
    const svg = d3.select(el).append('svg')
      .attr('width', W).attr('height', H)
      .attr('role', 'img')
      .attr('aria-label', 'Storage hierarchy graph')
      .style('background', COLORS.bg);
    this.svg = svg;

    // Defs — gradient for links, glow filter
    const defs = svg.append('defs');

    defs.append('filter').attr('id', 'glow')
      .html(`
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      `);

    defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .html(`
        <stop offset="0%" stop-color="${COLORS.linkHighlight}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${COLORS.linkStroke}" stop-opacity="0.4"/>
      `);

    // Zoom & pan — create g FIRST so the zoom handler can reference it
    const g = svg.append('g');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior);

    // Initial transform — center the tree
    const initX = Math.max(60, (W - (maxY - minY)) / 2);
    const initY = H / 2 - (minX + maxX) / 2;
    const initTransform = d3.zoomIdentity.translate(initX, initY);
    svg.call(zoomBehavior.transform, initTransform);

    // ─── Links ──────────────────────────────────────────────────────────────
    const linkGenerator = d3.linkHorizontal<
      d3.HierarchyPointLink<GraphNode>,
      d3.HierarchyPointNode<GraphNode>
    >().x((d) => d.y).y((d) => d.x);

    g.selectAll<SVGPathElement, d3.HierarchyPointLink<GraphNode>>('.link')
      .data(links as d3.HierarchyPointLink<GraphNode>[])
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', COLORS.linkStroke)
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('d', linkGenerator as never)
      // Dash-draw entrance animation
      .each(function() {
        const len = (this as SVGPathElement).getTotalLength?.() ?? 200;
        d3.select(this)
          .attr('stroke-dasharray', len)
          .attr('stroke-dashoffset', len)
          .transition()
          .delay((_, i) => i * 20)
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0);
      });

    // ─── Nodes ──────────────────────────────────────────────────────────────
    const node = g.selectAll<SVGGElement, d3.HierarchyPointNode<GraphNode>>('.graph-node')
      .data(nodes as d3.HierarchyPointNode<GraphNode>[])
      .join('g')
      .attr('class', (d) => `graph-node${d.data.type === 'root' ? ' root-node' : ''}`)
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .style('opacity', 0)
      .on('click', (_, d) => {
        if (d.data.id === 'root') return;
        this.zone.run(() => {
          const path = d.data.type === 'location'
            ? `/location/${d.data.id}`
            : `/object/${d.data.id}`;
          this.router.navigateByUrl(path);
        });
      });

    // Staggered fade-in
    node.transition()
      .delay((_, i) => i * 35 + 100)
      .duration(400)
      .ease(d3.easeBackOut.overshoot(1.2))
      .style('opacity', 1);

    // Node circles
    node.append('circle')
      .attr('r', (d) => d.data.type === 'root' ? 22 : d.data.type === 'location' ? 18 : 14)
      .attr('fill', (d) => {
        if (d.data.type === 'root')     return COLORS.rootFill;
        if (d.data.type === 'location') return COLORS.locFill;
        return COLORS.objFill;
      })
      .attr('stroke', (d) => {
        if (d.data.type === 'root')     return COLORS.rootRing;
        if (d.data.type === 'location') return COLORS.locStroke;
        return COLORS.objStroke;
      })
      .attr('stroke-width', (d) => d.data.type === 'root' ? 2.5 : 1.5);

    // Hover ring
    node.filter((d) => d.data.type !== 'root')
      .on('mouseenter', function(_, d) {
        d3.select(this).select('circle')
          .transition().duration(150).ease(d3.easeBackOut.overshoot(2))
          .attr('r', d.data.type === 'location' ? 22 : 17)
          .attr('stroke-width', 2);
      })
      .on('mouseleave', function(_, d) {
        d3.select(this).select('circle')
          .transition().duration(200)
          .attr('r', d.data.type === 'location' ? 18 : 14)
          .attr('stroke-width', 1.5);
      });

    // Node icons (Unicode — SVG text)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => d.data.type === 'root' ? 14 : d.data.type === 'location' ? 12 : 10)
      .attr('fill', (d) => {
        if (d.data.type === 'root')     return '#ffffff';
        if (d.data.type === 'location') return COLORS.locText;
        return COLORS.objText;
      })
      .attr('pointer-events', 'none')
      .text((d) => {
        if (d.data.type === 'root')     return '⌂';
        if (d.data.type === 'location') return '▤';
        return '◈';
      });

    // Node labels — name
    node.append('text')
      .attr('dy', (d) => (d.data.type === 'root' ? 32 : d.data.type === 'location' ? 28 : 24))
      .attr('text-anchor', 'middle')
      .attr('font-size', (d) => d.data.type === 'root' ? '12' : '11')
      .attr('font-weight', (d) => d.data.type === 'root' ? '600' : '500')
      .attr('fill', COLORS.labelColor)
      .attr('pointer-events', 'none')
      .attr('font-family', 'Outfit, system-ui, sans-serif')
      .text((d) => d.data.name.length > 14 ? d.data.name.slice(0, 13) + '…' : d.data.name);

    // Depth / child count sub-label for locations
    node.filter((d) => d.data.type === 'location' && (d.children?.length ?? 0) > 0)
      .append('text')
      .attr('dy', 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9')
      .attr('fill', COLORS.labelSub)
      .attr('font-family', 'Outfit, system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .text((d) => `${d.children!.length} ${d.children!.length === 1 ? 'child' : 'children'}`);
  }
}
