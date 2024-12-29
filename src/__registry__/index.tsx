// @ts-nocheck
// This file is autogenerated by scripts/build-registry.ts
// Do not edit this file directly.
import * as React from "react"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const Index: Record<string, any> = {
	"chat-input": {
		name: "chat-input",
		description: "",
		type: "registry:ui",
		registryDependencies: ["textarea"],
		files: [{
			path: "src/registry/ui/chat-input.tsx",
			type: "registry:ui",
			target: ""
		},{
			path: "src/registry/hooks/use-textarea-resize.ts",
			type: "registry:hook",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/ui/chat-input.tsx")),
		source: "",
		meta: undefined,
    },	"chat-message-area": {
		name: "chat-message-area",
		description: "",
		type: "registry:ui",
		registryDependencies: ["scroll-area"],
		files: [{
			path: "src/registry/ui/chat-message-area.tsx",
			type: "registry:ui",
			target: ""
		},{
			path: "src/registry/hooks/use-scroll-to-bottom.ts",
			type: "registry:hook",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/ui/chat-message-area.tsx")),
		source: "",
		meta: undefined,
    },	"chat-message": {
		name: "chat-message",
		description: "",
		type: "registry:ui",
		registryDependencies: ["https://ai.alwurts.com/registry/markdown-content.json"],
		files: [{
			path: "src/registry/ui/chat-message.tsx",
			type: "registry:ui",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/ui/chat-message.tsx")),
		source: "",
		meta: undefined,
    },	"markdown-content": {
		name: "markdown-content",
		description: "",
		type: "registry:ui",
		registryDependencies: undefined,
		files: [{
			path: "src/registry/ui/markdown-content.tsx",
			type: "registry:ui",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/ui/markdown-content.tsx")),
		source: "",
		meta: undefined,
    },	"chat-input-demo": {
		name: "chat-input-demo",
		description: "",
		type: "registry:example",
		registryDependencies: ["https://ai.alwurts.com/registry/chat-input.json"],
		files: [{
			path: "src/registry/examples/chat-input-demo.tsx",
			type: "registry:example",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/examples/chat-input-demo.tsx")),
		source: "",
		meta: undefined,
    },	"use-textarea-resize": {
		name: "use-textarea-resize",
		description: "",
		type: "registry:hook",
		registryDependencies: undefined,
		files: [{
			path: "src/registry/hooks/use-textarea-resize.ts",
			type: "registry:hook",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/hooks/use-textarea-resize.ts")),
		source: "",
		meta: undefined,
    },	"use-scroll-to-bottom": {
		name: "use-scroll-to-bottom",
		description: "",
		type: "registry:hook",
		registryDependencies: undefined,
		files: [{
			path: "src/registry/hooks/use-scroll-to-bottom.ts",
			type: "registry:hook",
			target: ""
		}],
		categories: undefined,
		component: React.lazy(() => import("@/registry/hooks/use-scroll-to-bottom.ts")),
		source: "",
		meta: undefined,
    },
}
