import type { Model } from "@/registry/blocks/flow-01/types/ai";
import type { Edge, Node } from "@xyflow/react";

type NodeExecutionStatus = "success" | "error" | "processing" | "idle";

export type NodeExecutionState = {
	timestamp: string;
	targets?: Record<string, string>;
	sources?: Record<string, string>;
	status: NodeExecutionStatus;
	error?: string;
};

// Dynamic Handles

export type DynamicHandle = {
	id: string;
	name: string;
	description?: string;
	//type: THandleType;
};

type DynamicHandles<THandleCategory extends string> = {
	[key in THandleCategory]: DynamicHandle[];
};

// Visualize Text

/* export const VISUALIZE_TEXT_TARGETS = ["input"] as const;
type VisualizeTextTargets = (typeof VISUALIZE_TEXT_TARGETS)[number]; */

type VisualizeTextData = {
	executionState?: NodeExecutionState;
};

export type VisualizeTextNode = Node<VisualizeTextData, "visualize-text"> & {
	type: "visualize-text";
};

// Text Input

/* const TEXT_INPUT_SOURCES = ["result"] as const;
type TextInputSources = (typeof TEXT_INPUT_SOURCES)[number]; */

type TextInputConfig = {
	value: string;
};

type TextInputData = {
	config: TextInputConfig;
	executionState?: NodeExecutionState;
};

export type TextInputNode = Node<TextInputData, "text-input"> & {
	type: "text-input";
};

// Prompt Crafter

/* const PROMPT_CRAFTER_TARGETS = ["input"] as const;
type PromptCrafterTargets = (typeof PROMPT_CRAFTER_TARGETS)[number]; */

/* const PROMPT_CRAFTER_SOURCES = ["result"] as const;
type PromptCrafterSources = (typeof PROMPT_CRAFTER_SOURCES)[number]; */

type PromptCrafterConfig = {
	template: string;
};

type PromptCrafterData = {
	config: PromptCrafterConfig;
	dynamicHandles: DynamicHandles<"template-tags">;
	executionState?: NodeExecutionState;
};

export type PromptCrafterNode = Node<PromptCrafterData, "prompt-crafter"> & {
	type: "prompt-crafter";
};

// Generate Text

/* const GENERATE_TEXT_TARGETS = ["system", "prompt"] as const;
type GenerateTextTargets = (typeof GENERATE_TEXT_TARGETS)[number];

const GENERATE_TEXT_SOURCES = ["result"] as const;
type GenerateTextSources = (typeof GENERATE_TEXT_SOURCES)[number]; */

type GenerateTextConfig = {
	model: Model;
};

type GenerateTextData = {
	config: GenerateTextConfig;
	dynamicHandles: DynamicHandles<"tools">;
	executionState?: NodeExecutionState;
};

export type GenerateTextNode = Node<GenerateTextData, "generate-text"> & {
	type: "generate-text";
};

// Flow

export type FlowNodeDataTypeMap = {
	"visualize-text": VisualizeTextData;
	"text-input": TextInputData;
	"prompt-crafter": PromptCrafterData;
	"generate-text": GenerateTextData;
};

export type FlowNode =
	| VisualizeTextNode
	| TextInputNode
	| PromptCrafterNode
	| GenerateTextNode;

export type FlowEdge = Edge & {
	targetHandle: string;
	sourceHandle: string;
};

/* export type FlowNode = FlowNodeUndefined & {
	type: Exclude<FlowNodeUndefined["type"], undefined>;
}; */

// Type Guards

export function hasTargets(
	node: FlowNode,
): node is Extract<
	FlowNode,
	VisualizeTextNode | PromptCrafterNode | GenerateTextNode
> {
	switch (node.type) {
		case "visualize-text":
		case "prompt-crafter":
		case "generate-text":
			return true;
		default:
			return false;
	}
}

export function hasSources(
	node: FlowNode,
): node is Extract<
	FlowNode,
	TextInputNode | PromptCrafterNode | GenerateTextNode
> {
	switch (node.type) {
		case "text-input":
		case "prompt-crafter":
		case "generate-text":
			return true;
		default:
			return false;
	}
}

export function isNodeOfType<T extends FlowNode["type"]>(
	node: FlowNode,
	type: T,
): node is Extract<FlowNode, { type: T }> {
	return node.type === type;
}

export function isNodeWithDynamicHandles<T extends FlowNode>(
	node: T,
): node is Extract<T, { data: { dynamicHandles: DynamicHandles<string> } }> {
	return "dynamicHandles" in node.data;
}
