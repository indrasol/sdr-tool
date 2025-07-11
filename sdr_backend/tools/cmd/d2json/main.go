package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"

	"oss.terrastruct.com/d2/d2compiler"
	"oss.terrastruct.com/d2/d2graph"
	"oss.terrastruct.com/d2/d2layouts/d2elklayout"
)

func main() {
	layout := flag.String("layout", "elk", "elk|none")
	flag.Parse()

	src, err := io.ReadAll(os.Stdin)
	check(err)

	// 1️⃣ compile D2 → graph
	g, _, err := d2compiler.Compile("stdin", bytesReader(src), &d2compiler.CompileOptions{})
	check(err)

	// 2️⃣ layout - try ELK first if requested
	if *layout == "elk" {
		tryELKLayout(g) // Try ELK but don't fail if it doesn't work
	}

	// 3️⃣ flatten → JSON (this now includes our fallback layout)
	out := flatten(g)
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	check(enc.Encode(out))
}

// calculateNodeOrder determines the best order for nodes based on edges
func calculateNodeOrder(g *d2graph.Graph) []*d2graph.Object {
	if len(g.Objects) == 0 {
		return nil
	}
	
	// Build adjacency information
	outgoing := make(map[string][]*d2graph.Object)
	incoming := make(map[string]int)
	objMap := make(map[string]*d2graph.Object)
	
	// Initialize maps
	for _, obj := range g.Objects {
		if obj == nil {
			continue
		}
		objMap[obj.ID] = obj
		incoming[obj.ID] = 0
		outgoing[obj.ID] = []*d2graph.Object{}
	}
	
	// Process edges
	for _, edge := range g.Edges {
		if edge == nil || edge.Src == nil || edge.Dst == nil {
			continue
		}
		
		srcID := edge.Src.ID
		dstID := edge.Dst.ID
		
		if _, exists := objMap[srcID]; exists {
			if dstObj := objMap[dstID]; dstObj != nil {
				outgoing[srcID] = append(outgoing[srcID], dstObj)
				incoming[dstID]++
			}
		}
	}
	
	// Topological sort to get good ordering
	var result []*d2graph.Object
	queue := []*d2graph.Object{}
	
	// Start with nodes that have no incoming edges
	for id, count := range incoming {
		if count == 0 {
			if obj := objMap[id]; obj != nil {
				queue = append(queue, obj)
			}
		}
	}
	
	// If no starting nodes, just use the first one
	if len(queue) == 0 && len(g.Objects) > 0 {
		queue = append(queue, g.Objects[0])
	}
	
	visited := make(map[string]bool)
	
	// Process queue
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		
		if current == nil || visited[current.ID] {
			continue
		}
		
		visited[current.ID] = true
		result = append(result, current)
		
		// Add connected nodes
		for _, next := range outgoing[current.ID] {
			if next != nil && !visited[next.ID] {
				queue = append(queue, next)
			}
		}
	}
	
	// Add any remaining unvisited nodes
	for _, obj := range g.Objects {
		if obj != nil && !visited[obj.ID] {
			result = append(result, obj)
		}
	}
	
	return result
}

// tryELKLayout attempts to apply ELK layout but doesn't fail the program if it doesn't work
func tryELKLayout(g *d2graph.Graph) error {
	// Basic validation
	if g == nil || len(g.Objects) == 0 {
		return fmt.Errorf("graph is empty or nil")
	}

	// Try ELK layout with full error recovery
	defer func() {
		recover() // Silently recover from any panics
	}()

	err := d2elklayout.Layout(context.Background(), g, nil)
	if err != nil {
		return fmt.Errorf("ELK layout error: %v", err)
	}

	return nil
}

/* ---------- helpers ---------- */

func bytesReader(b []byte) *bytes.Reader { return bytes.NewReader(b) }
func check(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "d2json:", err)
		os.Exit(1)
	}
}

type jNode struct {
	ID    string  `json:"id"`
	Label string  `json:"label"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	W     float64 `json:"width"`
	H     float64 `json:"height"`
}
type jEdge struct{ Source, Target, Label string }
type jDiag struct {
	Nodes []jNode `json:"nodes"`
	Edges []jEdge `json:"edges"`
}

func flatten(g *d2graph.Graph) jDiag {
	var jd jDiag
	
	// Calculate layout coordinates for nodes
	nodeLayout := calculateNodeLayout(g)
	
	for _, n := range g.Objects {
		if n == nil {
			continue
		}
		
		// Get all properties safely with one big recover block
		var id, label string
		var x, y, w, h float64
		
		func() {
			defer func() {
				if r := recover(); r != nil {
					// If anything fails, we'll use default values
				}
			}()
			
			id = n.ID
			label = n.ID // default to ID
			
			// Try to get label value
			if n.Label.Value != "" {
				label = n.Label.Value
			}
			
			// Try to get position from D2 first
			if n.TopLeft != nil {
				x = float64(n.TopLeft.X)
				y = float64(n.TopLeft.Y)
			}
			
			// Try to get dimensions from D2 first
			w = float64(n.Width)
			h = float64(n.Height)
		}()
		
		// Use our calculated layout if D2 didn't provide coordinates
		if layout, exists := nodeLayout[id]; exists {
			if x == 0 && y == 0 {
				x = layout.X
				y = layout.Y
			}
			if w == 0 {
				w = layout.Width
			}
			if h == 0 {
				h = layout.Height
			}
		}
		
		jd.Nodes = append(jd.Nodes, jNode{
			ID:    id,
			Label: label,
			X:     x,
			Y:     y,
			W:     w,
			H:     h,
		})
	}
	
	for _, e := range g.Edges {
		if e == nil {
			continue
		}
		
		// Get all edge properties safely
		var source, target, label string
		
		func() {
			defer func() {
				if r := recover(); r != nil {
					// If anything fails, we'll use default values
				}
			}()
			
			if e.Src != nil {
				source = e.Src.ID
			}
			if e.Dst != nil {
				target = e.Dst.ID
			}
			if e.Label.Value != "" {
				label = e.Label.Value
			}
		}()
		
		jd.Edges = append(jd.Edges, jEdge{
			Source: source,
			Target: target,
			Label:  label,
		})
	}
	return jd
}

// NodeLayout represents calculated position and dimensions
type NodeLayout struct {
	X, Y, Width, Height float64
}

// calculateNodeLayout computes positions and dimensions for all nodes with beautiful layered architecture
func calculateNodeLayout(g *d2graph.Graph) map[string]NodeLayout {
	layout := make(map[string]NodeLayout)
	
	if len(g.Objects) == 0 {
		return layout
	}
	
	// Calculate node order based on dependencies
	nodeOrder := calculateNodeOrder(g)
	
	// Enhanced layered layout with proper spacing and alignment
	// Define layer zones for beautiful left-to-right architecture flow
	layers := map[string]struct {
		baseX, baseY, spacing, fixedY float64
	}{
		"client":      {50, 150, 150, 150},   // Client zone (leftmost)
		"network":     {300, 250, 120, 250}, // DMZ/Network layer
		"application": {550, 350, 130, 350}, // Application layer
		"database":    {950, 450, 140, 450}, // Data layer (rightmost)
		"default":     {550, 350, 130, 350}, // Default to application layer
	}
	
	// Count nodes per layer for proper horizontal spacing
	layerCounts := make(map[string]int)
	
	// Categorize nodes by layer based on naming conventions
	for _, obj := range nodeOrder {
		if obj == nil {
			continue
		}
		
		layer := "default"
		id := obj.ID
		
		// Determine layer based on node ID patterns
		if strings.HasPrefix(id, "client_") || strings.Contains(id, "browser") || strings.Contains(id, "mobile") {
			layer = "client"
		} else if strings.HasPrefix(id, "network_") || strings.Contains(id, "cdn") || strings.Contains(id, "firewall") || strings.Contains(id, "load_balancer") || strings.Contains(id, "waf") {
			layer = "network"
		} else if strings.HasPrefix(id, "application_") || strings.Contains(id, "server") || strings.Contains(id, "api") || strings.Contains(id, "service") || strings.Contains(id, "auth") {
			layer = "application"
		} else if strings.HasPrefix(id, "database_") || strings.Contains(id, "db") || strings.Contains(id, "cache") || strings.Contains(id, "redis") || strings.Contains(id, "postgresql") || strings.Contains(id, "mysql") || strings.Contains(id, "mongo") {
			layer = "database"
		}
		
		layerCounts[layer]++
	}
	
	// Reset counters for positioning
	layerIndexes := make(map[string]int)
	
	for _, obj := range nodeOrder {
		if obj == nil {
			continue
		}
		
		// Calculate dimensions based on label
		label := obj.ID
		func() {
			defer func() { recover() }()
			if obj.Label.Value != "" {
				label = obj.Label.Value
			}
		}()
		
		// Enhanced width calculation for better visual balance
		width := float64(len(label)*8 + 40) // More padding for better appearance
		if width < 120 {                   // Larger minimum width
			width = 120
		}
		if width > 200 { // Maximum width to prevent oversized nodes
			width = 200
		}
		height := float64(50) // Taller nodes for better visibility
		
		// Determine layer
		layer := "default"
		id := obj.ID
		
		if strings.HasPrefix(id, "client_") || strings.Contains(id, "browser") || strings.Contains(id, "mobile") {
			layer = "client"
		} else if strings.HasPrefix(id, "network_") || strings.Contains(id, "cdn") || strings.Contains(id, "firewall") || strings.Contains(id, "load_balancer") || strings.Contains(id, "waf") {
			layer = "network"
		} else if strings.HasPrefix(id, "application_") || strings.Contains(id, "server") || strings.Contains(id, "api") || strings.Contains(id, "service") || strings.Contains(id, "auth") {
			layer = "application"
		} else if strings.HasPrefix(id, "database_") || strings.Contains(id, "db") || strings.Contains(id, "cache") || strings.Contains(id, "redis") || strings.Contains(id, "postgresql") || strings.Contains(id, "mysql") || strings.Contains(id, "mongo") {
			layer = "database"
		}
		
		// Get layer configuration
		layerConfig := layers[layer]
		
		// Calculate position with proper horizontal spacing within layer
		x := layerConfig.baseX + (float64(layerIndexes[layer]) * layerConfig.spacing)
		y := layerConfig.fixedY
		
		layout[obj.ID] = NodeLayout{
			X:      x,
			Y:      y,
			Width:  width,
			Height: height,
		}
		
		layerIndexes[layer]++
	}
	
	return layout
}
